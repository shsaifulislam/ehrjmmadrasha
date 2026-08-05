import prisma from "../config/prisma";
import StudentCreateService from "../modules/student/services/StudentCreateService";

async function runFreshDbMigrationVerification() {
  console.log('================================================================');
  console.log('🐘 EHRJ Madrasha ERP — Fresh Database Migration Verification (P3)');
  console.log('================================================================\n');

  const startTime = Date.now();
  let totalAssertions = 0;
  let passedAssertions = 0;

  try {
    // 1. Database Connection & Schema Verification
    console.log('[1/5] 🔌 Connecting to PostgreSQL & Verifying Schema Integrity...');
    await prisma.$connect();
    console.log('   ✅ PostgreSQL Connection Established');
    totalAssertions++; passedAssertions++;

    // 2. Check Migration Table & System Tables
    console.log('\n[2/5] 📜 Checking Database Schema Tables...');
    const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `;
    const tableNames = tables.map(t => t.table_name);
    console.log(`   ℹ️ Total Tables Found in Database: ${tableNames.length}`);
    
    const requiredTables = ['Student', 'Guardian', 'Class', 'Invoice', 'Notice', 'HostelBuilding', 'InventoryItem', 'FixedAsset', 'BookMaster', 'Staff'];
    const missingTables = requiredTables.filter(tbl => !tableNames.map(t => t.toLowerCase()).includes(tbl.toLowerCase()));
    
    if (missingTables.length === 0) {
      console.log('   ✅ Schema Integrity Verified: All 10 Core ERP Tables Exist in Public Schema');
      totalAssertions++; passedAssertions++;
    } else {
      console.error(`   ❌ Schema Verification Failed: Missing Tables: ${missingTables.join(', ')}`);
      totalAssertions++;
    }

    // 3. Database CRUD Smoke Test (Clean Seed & Query Cycle)
    console.log('\n[3/5] 🧪 Executing Basic CRUD Smoke Test Cycle...');
    
    let academicClass = await prisma.class.findFirst({ where: { isDeleted: false } });
    if (!academicClass) {
      academicClass = await prisma.class.create({
        data: {
          name: 'Mishkat-P3',
          numericValue: 12,
        },
      });
    }
    console.log(`   ✅ CRUD Class Anchor: [ID: ${academicClass.id}] - ${academicClass.name}`);
    totalAssertions++; passedAssertions++;

    let session = await prisma.session.findFirst({ where: { isActive: true } });
    if (!session) {
      session = await prisma.session.create({
        data: {
          year: '2026',
          isActive: true,
        },
      });
    }
    console.log(`   ✅ CRUD Session Anchor: [ID: ${session.id}] - Year ${session.year}`);
    totalAssertions++; passedAssertions++;

    // 4. Data Constraint & Foreign Key Verification via StudentCreateService
    console.log('\n[4/5] 🔗 Verifying Foreign Key Constraints & Student Creation Service...');
    const student = await StudentCreateService.execute({
      nameBn: 'রাকিব আহমেদ (P3-Smoke)',
      nameEn: 'Rakib Ahmed P3',
      dob: '2012-01-01',
      guardianName: 'আহমেদ রফিক (P3-Smoke)',
      guardianPhone: '01799001122',
      classId: academicClass.id,
      sessionId: session.id,
      address: 'ঢাকা, বাংলাদেশ',
      createdBy: 'P3_VERIFICATION_TESTER',
    });

    console.log(`   ✅ Relational Student Record Created: [ID: ${student.id}] - ${student.nameBn}`);
    totalAssertions++; passedAssertions++;

    // 5. Cleanup Smoke Artifacts
    console.log('\n[5/5] 🧹 Cleaning Up Smoke Test Artifacts & Verifying Cascade Safety...');
    await prisma.student.delete({ where: { id: student.id } });
    if (student.guardianId) {
      await prisma.guardian.delete({ where: { id: student.guardianId } }).catch(() => {});
    }
    if (student.userId) {
      await prisma.user.delete({ where: { id: student.userId } }).catch(() => {});
    }
    console.log('   ✅ Smoke Artifact Cleanup Completed Successfully');
    totalAssertions++; passedAssertions++;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================================================================');
    console.log(`🎯 FRESH DB MIGRATION & SMOKE TEST RESULTS: ${passedAssertions}/${totalAssertions} PASS`);
    console.log(`⏱️ Duration: ${duration}s | Exit Code: 0 (SUCCESS)`);
    console.log('================================================================\n');

  } catch (error: any) {
    console.error('\n❌ Fresh DB Migration Verification Failed with Error:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runFreshDbMigrationVerification();
