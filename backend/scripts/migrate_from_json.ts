import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

const JSON_FILE_PATH = path.join(__dirname, '../../old_data/db.json');

// Check for --dry-run flag
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function migrate() {
  console.log("=========================================");
  console.log(`JSON to PostgreSQL Migration ${isDryRun ? '[DRY RUN MODE]' : '[LIVE MODE]'}`);
  console.log("=========================================");

  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.error(`Error: Old database JSON file not found at ${JSON_FILE_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
  let db: any;
  try {
    db = JSON.parse(rawData);
  } catch (e) {
    console.error("Error: db.json has invalid JSON formatting.");
    process.exit(1);
  }

  // Statistics
  const stats = {
    classes: { total: 0, created: 0, skipped: 0, reasons: [] as string[] },
    sessions: { total: 0, created: 0, skipped: 0, reasons: [] as string[] },
    students: { total: 0, created: 0, skipped: 0, reasons: [] as string[] },
    teachers: { total: 0, created: 0, skipped: 0, reasons: [] as string[] },
    validRecords: 0,
    skippedRecords: 0,
  };

  try {
    const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    const teacherRole = await prisma.role.findUnique({ where: { name: 'TEACHER' } });

    if (!studentRole || !teacherRole) {
      throw new Error("Roles 'STUDENT' or 'TEACHER' not found in database. Run the seed script first.");
    }

    const defaultPassword = await bcrypt.hash("123456", 10);

    // In-memory sets to track created items in dry-run mode
    const dryRunSessions = new Set<string>();
    const dryRunClasses = new Set<string>();

    // 1. Migrate Sessions
    console.log("\nProcessing Sessions...");
    const sessionsList = db.sessions || [];
    stats.sessions.total = sessionsList.length;

    for (const session of sessionsList) {
      if (!session.year || !/^\d{4}$/.test(session.year)) {
        stats.sessions.skipped++;
        stats.skippedRecords++;
        stats.sessions.reasons.push(`সেশনের বছর '${session.year}' সঠিক নয়।`);
        continue;
      }

      const existing = await prisma.session.findFirst({ where: { year: session.year } });
      if (existing) {
        stats.sessions.skipped++;
        stats.skippedRecords++;
        stats.sessions.reasons.push(`সেশন বছর ${session.year} ইতিমধ্যে ডাটাবেসে রয়েছে।`);
        dryRunSessions.add(session.year);
        continue;
      }

      stats.validRecords++;
      if (!isDryRun) {
        await prisma.session.create({
          data: {
            year: session.year,
            isActive: session.isActive || false
          }
        });
        stats.sessions.created++;
      } else {
        dryRunSessions.add(session.year);
        stats.sessions.created++;
      }
    }

    // 2. Migrate Classes
    console.log("Processing Classes...");
    const classesList = db.classes || [];
    stats.classes.total = classesList.length;

    for (const cls of classesList) {
      if (!cls.name || cls.numericValue === undefined) {
        stats.classes.skipped++;
        stats.skippedRecords++;
        stats.classes.reasons.push(`শ্রেণীর তথ্য অসম্পূর্ণ (নাম অথবা ক্রমিক মান নেই)।`);
        continue;
      }

      const existing = await prisma.class.findFirst({ where: { name: cls.name, isDeleted: false } });
      if (existing) {
        stats.classes.skipped++;
        stats.skippedRecords++;
        stats.classes.reasons.push(`শ্রেণী '${cls.name}' ইতিমধ্যে ডাটাবেসে রয়েছে।`);
        dryRunClasses.add(cls.name);
        continue;
      }

      stats.validRecords++;
      if (!isDryRun) {
        await prisma.class.create({
          data: {
            name: cls.name,
            numericValue: Number(cls.numericValue)
          }
        });
        stats.classes.created++;
      } else {
        dryRunClasses.add(cls.name);
        stats.classes.created++;
      }
    }

    // 3. Migrate Students
    console.log("Processing Students...");
    const studentsList = db.students || [];
    stats.students.total = studentsList.length;

    for (const student of studentsList) {
      if (!student.student_id || !student.name_bn || student.roll === undefined || !student.class_name || !student.session_year) {
        stats.students.skipped++;
        stats.skippedRecords++;
        stats.students.reasons.push(`ছাত্রের তথ্য অসম্পূর্ণ (স্টুডেন্ট আইডি, নাম, রোল, শ্রেণী বা সেশন নেই)। ID: ${student.student_id || 'N/A'}`);
        continue;
      }

      const cls = await prisma.class.findFirst({ where: { name: student.class_name, isDeleted: false } });
      const session = await prisma.session.findFirst({ where: { year: student.session_year } });

      const clsExists = cls || dryRunClasses.has(student.class_name);
      const sessionExists = session || dryRunSessions.has(student.session_year);

      if (!clsExists || !sessionExists) {
        stats.students.skipped++;
        stats.skippedRecords++;
        stats.students.reasons.push(`শ্রেণী (${student.class_name}) অথবা সেশন (${student.session_year}) পাওয়া যায়নি। ID: ${student.student_id}`);
        continue;
      }

      // Check unique studentId
      const duplicateId = await prisma.student.findUnique({ where: { studentId: student.student_id } });
      if (duplicateId) {
        stats.students.skipped++;
        stats.skippedRecords++;
        stats.students.reasons.push(`স্টুডেন্ট আইডি ${student.student_id} ইতিমধ্যে ডাটাবেসে নিবন্ধিত।`);
        continue;
      }

      // Check duplicate roll in same class & session
      const classId = cls?.id || 'dummy-class-id';
      const sessionId = session?.id || 'dummy-session-id';
      
      if (!isDryRun && cls && session) {
        const duplicateRoll = await prisma.student.findFirst({
          where: { roll: Number(student.roll), classId, sessionId, isDeleted: false }
        });
        if (duplicateRoll) {
          stats.students.skipped++;
          stats.skippedRecords++;
          stats.students.reasons.push(`শ্রেণী '${student.class_name}' এবং সেশন ${student.session_year}-এ রোল ${student.roll} ইতিমধ্যে রয়েছে। ID: ${student.student_id}`);
          continue;
        }
      }

      stats.validRecords++;
      if (!isDryRun && cls && session) {
        // Run as a transaction per student to isolate rollback on failure
        try {
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                username: student.student_id,
                passwordHash: defaultPassword,
                roleId: studentRole.id,
                mustChangePassword: true,
                isActive: true
              }
            });

            await tx.student.create({
              data: {
                studentId: student.student_id,
                roll: Number(student.roll),
                nameBn: student.name_bn,
                nameEn: student.name_en || null,
                classId: cls.id,
                sessionId: session.id,
                userId: user.id
              }
            });
          });
          stats.students.created++;
        } catch (err: any) {
          stats.students.skipped++;
          stats.skippedRecords++;
          stats.students.reasons.push(`ডাটাবেস ট্রানজাকশন ফেইলিউর: ${err.message}. ID: ${student.student_id}`);
        }
      } else {
        stats.students.created++;
      }
    }

    // 4. Migrate Teachers
    console.log("Processing Teachers...");
    const teachersList = db.teachers || [];
    stats.teachers.total = teachersList.length;

    for (const teacher of teachersList) {
      if (!teacher.teacher_id || !teacher.name_bn || !teacher.phone || !teacher.username) {
        stats.teachers.skipped++;
        stats.skippedRecords++;
        stats.teachers.reasons.push(`শিক্ষকের তথ্য অসম্পূর্ণ। ID: ${teacher.teacher_id || 'N/A'}`);
        continue;
      }

      const duplicateId = await prisma.teacher.findUnique({ where: { teacherId: teacher.teacher_id } });
      const duplicateUsername = await prisma.user.findUnique({ where: { username: teacher.username } });

      if (duplicateId || duplicateUsername) {
        stats.teachers.skipped++;
        stats.skippedRecords++;
        stats.teachers.reasons.push(`শিক্ষক আইডি বা ইউজারনেম ইতিমধ্যে ব্যবহৃত হচ্ছে। ID: ${teacher.teacher_id}`);
        continue;
      }

      stats.validRecords++;
      if (!isDryRun) {
        try {
          await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                username: teacher.username,
                passwordHash: defaultPassword,
                roleId: teacherRole.id,
                mustChangePassword: true,
                isActive: true
              }
            });

            await tx.teacher.create({
              data: {
                teacherId: teacher.teacher_id,
                nameBn: teacher.name_bn,
                phone: teacher.phone,
                designation: teacher.designation || null,
                userId: user.id
              }
            });
          });
          stats.teachers.created++;
        } catch (err: any) {
          stats.teachers.skipped++;
          stats.skippedRecords++;
          stats.teachers.reasons.push(`ডাটাবেস ট্রানজাকশন ফেইলিউর: ${err.message}. ID: ${teacher.teacher_id}`);
        }
      } else {
        stats.teachers.created++;
      }
    }

    // Output statistical report
    console.log("\n=========================================");
    console.log("             MIGRATION REPORT            ");
    console.log("=========================================");
    console.log(`Total Valid Records to Migrate: ${stats.validRecords}`);
    console.log(`Total Skipped/Invalid Records: ${stats.skippedRecords}`);
    console.log("-----------------------------------------");
    console.log(`Sessions: Total ${stats.sessions.total} | Migrated ${stats.sessions.created} | Skipped ${stats.sessions.skipped}`);
    console.log(`Classes:  Total ${stats.classes.total}  | Migrated ${stats.classes.created}  | Skipped ${stats.classes.skipped}`);
    console.log(`Students: Total ${stats.students.total} | Migrated ${stats.students.created} | Skipped ${stats.students.skipped}`);
    console.log(`Teachers: Total ${stats.teachers.total} | Migrated ${stats.teachers.created} | Skipped ${stats.teachers.skipped}`);
    console.log("=========================================");

    if (stats.skippedRecords > 0) {
      console.log("\nSkipped/Invalid Records Log:");
      const allReasons = [
        ...stats.sessions.reasons,
        ...stats.classes.reasons,
        ...stats.students.reasons,
        ...stats.teachers.reasons
      ];
      allReasons.forEach((reason, index) => {
        console.log(`[${index + 1}] ${reason}`);
      });
    }

  } catch (error) {
    console.error("Migration fatal error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
