const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test exam, subjects, routine, and student marks...");

  // 1. Get active session
  let session = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
  });
  if (!session) {
    session = await prisma.academicSession.findFirst();
  }
  if (!session) {
    session = await prisma.academicSession.create({
      data: {
        name: "২০২৬",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        isCurrent: true,
        status: "ACTIVE",
      },
    });
  }
  console.log("Using session:", session.name, session.id);

  // 2. Find a class with enrollments
  let enrollments = await prisma.enrollment.findMany({
    where: { sessionId: session.id, status: "ACTIVE" },
    include: { jamatClass: true, student: true },
  });

  if (enrollments.length === 0) {
    enrollments = await prisma.enrollment.findMany({
      include: { jamatClass: true, student: true },
      take: 10,
    });
  }

  if (enrollments.length === 0) {
    console.log("No enrollments found! Creating a test class and 3 students...");
    let jClass = await prisma.jamatClass.findFirst();
    if (!jClass) {
      jClass = await prisma.jamatClass.create({
        data: {
          nameBn: "ইবতেদায়ী ১ম",
          nameEn: "Ibtidai 1",
          code: "IBT-1",
        },
      });
    }

    const s1 = await prisma.student.create({
      data: {
        studentIdNumber: "STD-2026-001",
        fullNameBn: "মুহাম্মদ আব্দুল্লাহ",
        fullNameEn: "Muhammad Abdullah",
        dateOfBirth: new Date("2018-05-10"),
        gender: "MALE",
        guardianNameBn: "মোঃ রফিকুল ইসলাম",
        guardianPhone: "01811223344",
      },
    });

    const s2 = await prisma.student.create({
      data: {
        studentIdNumber: "STD-2026-002",
        fullNameBn: "মুহাম্মদ আব্দুর রহমান",
        fullNameEn: "Muhammad Abdur Rahman",
        dateOfBirth: new Date("2018-03-12"),
        gender: "MALE",
        guardianNameBn: "মোঃ শফিকুল ইসলাম",
        guardianPhone: "01811223355",
      },
    });

    const s3 = await prisma.student.create({
      data: {
        studentIdNumber: "STD-2026-003",
        fullNameBn: "মুহাম্মদ সালমান ফারসি",
        fullNameEn: "Muhammad Salman Farsi",
        dateOfBirth: new Date("2018-07-20"),
        gender: "MALE",
        guardianNameBn: "মোঃ কামাল হোসেন",
        guardianPhone: "01811223366",
      },
    });

    const e1 = await prisma.enrollment.create({
      data: {
        studentId: s1.id,
        sessionId: session.id,
        classId: jClass.id,
        rollNumber: 1,
        status: "ACTIVE",
      },
      include: { jamatClass: true, student: true },
    });

    const e2 = await prisma.enrollment.create({
      data: {
        studentId: s2.id,
        sessionId: session.id,
        classId: jClass.id,
        rollNumber: 2,
        status: "ACTIVE",
      },
      include: { jamatClass: true, student: true },
    });

    const e3 = await prisma.enrollment.create({
      data: {
        studentId: s3.id,
        sessionId: session.id,
        classId: jClass.id,
        rollNumber: 3,
        status: "ACTIVE",
      },
      include: { jamatClass: true, student: true },
    });

    enrollments = [e1, e2, e3];
  }

  const targetClassId = enrollments[0].classId;
  console.log("Target Class ID:", targetClassId, "with", enrollments.length, "students");

  // 3. Ensure exam type exists
  let examType = await prisma.examType.findFirst({ where: { code: "TERM_1" } });
  if (!examType) {
    examType = await prisma.examType.create({
      data: {
        code: "TERM_1",
        nameBn: "১ম সাময়িক",
        nameEn: "1st Term",
        sortOrder: 1,
        isActive: true,
      },
    });
  }

  // 4. Create Exam
  let exam = await prisma.exam.findFirst({
    where: { sessionId: session.id, nameBn: "১ম সাময়িক পরীক্ষা ২০২৬" },
  });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        sessionId: session.id,
        examTypeId: examType.id,
        examType: "TERM_1",
        nameBn: "১ম সাময়িক পরীক্ষা ২০২৬",
        nameEn: "1st Term Examination 2026",
        startDate: new Date("2026-04-10"),
        endDate: new Date("2026-04-25"),
        instructions: "সকাল ৯:০০ টায় উপস্থিত বাধ্যতামূলক।",
        status: "RUNNING",
      },
    });
  }
  console.log("Exam created/found:", exam.nameBn, exam.id);

  // 5. Ensure Subjects exist for this class
  const subjectList = [
    { code: "QRN-101", nameBn: "কুরআন মাজীদ ও তাজবীদ", nameEn: "Quran Majeed & Tajweed", full: 100, pass: 33 },
    { code: "AQD-102", nameBn: "আকাইদ ও ফিকহ", nameEn: "Aqaid & Fiqh", full: 100, pass: 33 },
    { code: "ARB-103", nameBn: "আরবি সাহিত্য ও ব্যাকরণ", nameEn: "Arabic Literature & Grammar", full: 100, pass: 33 },
  ];

  const dbSubjects = [];
  for (const s of subjectList) {
    let sub = await prisma.subject.findFirst({
      where: { classId: targetClassId, code: s.code },
    });
    if (!sub) {
      sub = await prisma.subject.create({
        data: {
          classId: targetClassId,
          code: s.code,
          nameBn: s.nameBn,
          nameEn: s.nameEn,
          fullMarks: s.full,
          passMarks: s.pass,
          isOptional: false,
        },
      });
    }
    dbSubjects.push(sub);

    // Link ExamSubject
    let es = await prisma.examSubject.findFirst({
      where: { examId: exam.id, classId: targetClassId, subjectId: sub.id },
    });
    if (!es) {
      es = await prisma.examSubject.create({
        data: {
          examId: exam.id,
          classId: targetClassId,
          subjectId: sub.id,
          fullMarks: s.full,
          passMarks: s.pass,
          examDate: new Date("2026-04-12"),
          startTime: "09:30 AM",
          endTime: "12:30 PM",
        },
      });
    }

    // Link ExamRoutine
    let er = await prisma.examRoutine.findFirst({
      where: { examId: exam.id, classId: targetClassId, subjectId: sub.id },
    });
    if (!er) {
      await prisma.examRoutine.create({
        data: {
          examId: exam.id,
          classId: targetClassId,
          subjectId: sub.id,
          examDate: new Date("2026-04-12"),
          startTime: "09:30 AM",
          endTime: "12:30 PM",
          roomNo: "১০১",
          status: "PUBLISHED",
        },
      });
    }
  }

  // 6. Enter marks for students
  const sampleMarks = [
    [92, 88, 95], // Student 1 (Mumtaz A+)
    [75, 78, 80], // Student 2 (Jayyid Jiddan A)
    [62, 58, 65], // Student 3 (Jayyid B)
  ];

  for (let i = 0; i < enrollments.length; i++) {
    const en = enrollments[i];
    const marks = sampleMarks[i % sampleMarks.length];

    for (let j = 0; j < dbSubjects.length; j++) {
      const sub = dbSubjects[j];
      const obtained = marks[j];

      await prisma.examMark.upsert({
        where: {
          examId_studentId_subjectId: {
            examId: exam.id,
            studentId: en.studentId,
            subjectId: sub.id,
          },
        },
        create: {
          examId: exam.id,
          studentId: en.studentId,
          subjectId: sub.id,
          classId: targetClassId,
          marksObtained: obtained,
          isAbsent: false,
          isExempt: false,
        },
        update: {
          marksObtained: obtained,
          isAbsent: false,
          isExempt: false,
        },
      });
    }
  }

  console.log("Seeding complete! Marks recorded for all candidates.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
