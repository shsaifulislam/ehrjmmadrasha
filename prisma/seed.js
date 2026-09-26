const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding EHRJ Madrasha Database with verified institution records...");

  // 1. Core Users (Admin & Teacher - Single unified admin panel, NO super admin)
  const passwordAdmin = await bcrypt.hash("AdminEhrj@2026!", 12);
  const passwordTeacher = await bcrypt.hash("Teacher@2026!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "adminehrjmadrasha@gmail.com" },
    update: {
      passwordHash: passwordAdmin,
      name: "প্রধান অ্যাডমিন (মাদরাসা প্রশাসন)",
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "প্রধান অ্যাডমিন (মাদরাসা প্রশাসন)",
      username: "adminehrj",
      email: "adminehrjmadrasha@gmail.com",
      phone: "01845162664",
      passwordHash: passwordAdmin,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // Remove any legacy .edu user
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: "teacher@ehrjmadrasha.edu.bd" },
        { phone: "01826416696" }
      ]
    }
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacherehrjmadrasha@gmail.com" },
    update: {
      passwordHash: passwordTeacher,
      role: "TEACHER",
      status: "ACTIVE",
    },
    create: {
      name: "মাওলানা আহমাদ উল্লাহ (সিনিয়র উস্তাদ)",
      username: "teacher1",
      email: "teacherehrjmadrasha@gmail.com",
      phone: "01826416696",
      passwordHash: passwordTeacher,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  // 2. Current Academic Session
  const session = await prisma.academicSession.upsert({
    where: { name: "২০২৫-২০২৬" },
    update: {},
    create: {
      name: "২০২৫-২০২৬",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2026-12-31"),
      isCurrent: true,
    },
  });

  // 3. Jamats & Classes (Dynamic Academic Structure)
  const classesData = [
    { nameBn: "শিশু শ্রেণি", nameEn: "Pre-Primary / Shishu", code: "SHISHU", genderType: "COMBINED", sortOrder: 1 },
    { nameBn: "১ম শ্রেণি", nameEn: "Class 1", code: "CLS-1", genderType: "COMBINED", sortOrder: 2 },
    { nameBn: "২য় শ্রেণি", nameEn: "Class 2", code: "CLS-2", genderType: "COMBINED", sortOrder: 3 },
    { nameBn: "৩য় শ্রেণি", nameEn: "Class 3", code: "CLS-3", genderType: "COMBINED", sortOrder: 4 },
    { nameBn: "নূরানী ও নাযেরা বিভাগ", nameEn: "Noorani & Najera", code: "NOORANI", genderType: "BOYS", sortOrder: 5 },
    { nameBn: "তাহফীজুল কুরআন (হিফজ বিভাগ)", nameEn: "Tahfeez-ul-Quran (Hifz)", code: "HIFZ", genderType: "BOYS", sortOrder: 6 },
    { nameBn: "মিযান জামাত", nameEn: "Mizan", code: "MIZAN", genderType: "BOYS", sortOrder: 7 },
    { nameBn: "নাহবেমীর জামাত", nameEn: "Nahwemir", code: "NAHWEMIR", genderType: "BOYS", sortOrder: 8 },
    { nameBn: "হেদায়েতুন্নাহু জামাত", nameEn: "Hidayatun Nahw", code: "HIDAYAT", genderType: "BOYS", sortOrder: 9 },
    { nameBn: "কাফিয়া জামাত", nameEn: "Kafia", code: "KAFIA", genderType: "BOYS", sortOrder: 10 },
    { nameBn: "শরহে বেকায়া জামাত", nameEn: "Sharhe Beqaya", code: "BEQAYA", genderType: "BOYS", sortOrder: 11 },
    { nameBn: "জালালাইন জামাত", nameEn: "Jalalayn", code: "JALALAYN", genderType: "BOYS", sortOrder: 12 },
    { nameBn: "মেশকাত জামাত", nameEn: "Mishkat", code: "MISHKAT", genderType: "BOYS", sortOrder: 13 },
    { nameBn: "দাওরায়ে হাদীস (মাস্টার্স সমমান)", nameEn: "Dawra-e-Hadith", code: "DAWRA", genderType: "BOYS", sortOrder: 14 },
    { nameBn: "ইফতা ও উচ্চতর ইসলামি গবেষণা", nameEn: "Darul Ifta", code: "IFTA", genderType: "BOYS", sortOrder: 15 },
  ];

  for (const c of classesData) {
    const jamat = await prisma.jamatClass.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });

    const existingSec = await prisma.section.findFirst({ where: { classId: jamat.id } });
    if (!existingSec) {
      await prisma.section.create({
        data: {
          classId: jamat.id,
          nameBn: "ক শাখা",
          nameEn: "Section A",
          maxCapacity: 60,
        },
      });
    }
  }

  // 4. Sample Students for Zero-Friction Student/Guardian Portal
  const nooraniClass = await prisma.jamatClass.findUnique({ where: { code: "NOORANI" } });
  const hifzClass = await prisma.jamatClass.findUnique({ where: { code: "HIFZ" } });
  const nooraniSec = await prisma.section.findFirst({ where: { classId: nooraniClass.id } });
  const hifzSec = await prisma.section.findFirst({ where: { classId: hifzClass.id } });

  // Student 1
  const student1 = await prisma.student.upsert({
    where: { studentIdNumber: "EHRJ-2026-0001" },
    update: {},
    create: {
      studentIdNumber: "EHRJ-2026-0001",
      fullNameBn: "মুহাম্মদ আব্দুল্লাহ আল মামুন",
      fullNameEn: "MUHAMMAD ABDULLAH AL MAMUN",
      dateOfBirth: new Date("2017-01-15"),
      gender: "MALE",
      bloodGroup: "B+",
      fatherNameBn: "মাওলানা রফিকুল ইসলাম",
      fatherPhone: "01845162664",
      motherNameBn: "মোসাঃ মারিয়াম খাতুন",
      presentAddress: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      permanentAddress: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      residentialStatus: "NON_RESIDENTIAL",
      isOrphan: false,
      status: "ACTIVE",
    },
  });

  await prisma.enrollment.upsert({
    where: {
      sessionId_classId_sectionId_rollNumber: {
        sessionId: session.id,
        classId: nooraniClass.id,
        sectionId: nooraniSec.id,
        rollNumber: 1,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      sessionId: session.id,
      classId: nooraniClass.id,
      sectionId: nooraniSec.id,
      rollNumber: 1,
      status: "ACTIVE",
    },
  });

  // Student 2
  const student2 = await prisma.student.upsert({
    where: { studentIdNumber: "EHRJ-2026-0002" },
    update: {},
    create: {
      studentIdNumber: "EHRJ-2026-0002",
      fullNameBn: "মুহাম্মদ আব্দুর রহমান",
      fullNameEn: "MUHAMMAD ABDUR RAHMAN",
      dateOfBirth: new Date("2015-08-20"),
      gender: "MALE",
      bloodGroup: "O+",
      fatherNameBn: "মাওলানা আব্দুল হক",
      fatherPhone: "01826416696",
      motherNameBn: "মোসাঃ ফাতেমা আক্তার",
      presentAddress: "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      permanentAddress: "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      residentialStatus: "RESIDENTIAL",
      isOrphan: true,
      status: "ACTIVE",
    },
  });

  await prisma.enrollment.upsert({
    where: {
      sessionId_classId_sectionId_rollNumber: {
        sessionId: session.id,
        classId: hifzClass.id,
        sectionId: hifzSec.id,
        rollNumber: 2,
      },
    },
    update: {},
    create: {
      studentId: student2.id,
      sessionId: session.id,
      classId: hifzClass.id,
      sectionId: hifzSec.id,
      rollNumber: 2,
      status: "ACTIVE",
    },
  });

  // Sample Fee Invoices
  await prisma.feeInvoice.upsert({
    where: { invoiceNumber: "INV-2026-0001" },
    update: {},
    create: {
      invoiceNumber: "INV-2026-0001",
      studentId: student1.id,
      sessionId: session.id,
      title: "মার্চ ২০২৬ বেতন ও পরীক্ষার ফি",
      dueDate: new Date("2026-04-10"),
      totalAmount: 1200,
      discountAmount: 0,
      waiverAmount: 0,
      netAmount: 1200,
      paidAmount: 1200,
      dueAmount: 0,
      status: "PAID",
    },
  });

  await prisma.feeInvoice.upsert({
    where: { invoiceNumber: "INV-2026-0002" },
    update: {},
    create: {
      invoiceNumber: "INV-2026-0002",
      studentId: student2.id,
      sessionId: session.id,
      title: "মার্চ ২০২৬ খাবার ও বোর্ডিং চার্জ",
      dueDate: new Date("2026-04-10"),
      totalAmount: 1500,
      discountAmount: 0,
      waiverAmount: 700,
      netAmount: 800,
      paidAmount: 0,
      dueAmount: 800,
      status: "UNPAID",
    },
  });

  // Sample Exam & Results
  const exam = await prisma.exam.upsert({
    where: { id: "exam-term-1-2026" },
    update: {},
    create: {
      id: "exam-term-1-2026",
      sessionId: session.id,
      nameBn: "১ম সাময়িক মূল্যায়ন পরীক্ষা ২০২৬",
      nameEn: "1st Term Evaluation Exam 2026",
      examType: "FIRST_TERM",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-10"),
      isPublished: true,
    },
  });

  await prisma.result.upsert({
    where: {
      examId_studentId: {
        examId: exam.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      examId: exam.id,
      studentId: student1.id,
      totalMarks: 275,
      percentage: 91.6,
      finalGradeBn: "মুমতাজ (Mumtaz / A+)",
      rankInClass: 1,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  // 5. Fee Categories
  const feeCategories = [
    { nameBn: "মাসিক বেতন", nameEn: "Monthly Tuition Fee", code: "MONTHLY_TUITION", defaultAmount: 800, isRecurring: true },
    { nameBn: "ভর্তি ফি", nameEn: "Admission Fee", code: "ADMISSION_FEE", defaultAmount: 2500, isRecurring: false },
    { nameBn: "আবাসিক ও লিল্লাহ বোর্ডিং ফি", nameEn: "Residential Boarding Fee", code: "BOARDING_FEE", defaultAmount: 2200, isRecurring: true },
    { nameBn: "সাময়িক ও বার্ষিক পরীক্ষার ফি", nameEn: "Examination Fee", code: "EXAM_FEE", defaultAmount: 500, isRecurring: false },
    { nameBn: "কিতাব ও পাঠ্যপুস্তক চার্জ", nameEn: "Books Charge", code: "BOOKS_FEE", defaultAmount: 1200, isRecurring: false },
  ];

  for (const fc of feeCategories) {
    await prisma.feeCategory.upsert({
      where: { code: fc.code },
      update: {},
      create: fc,
    });
  }

  // 6. Cash Funds
  const funds = [
    { nameBn: "সাধারণ প্রশাসনিক তহবিল", nameEn: "General Fund", code: "GENERAL", currentBalance: 250000 },
    { nameBn: "লিল্লাহ বোর্ডিং ও খাদ্য তহবিল", nameEn: "Lillah Boarding Fund", code: "LILLAH", currentBalance: 380000 },
    { nameBn: "যাকাত ও দরিদ্র কল্যাণ তহবিল", nameEn: "Zakat & Poor Welfare Fund", code: "ZAKAT", currentBalance: 520000 },
    { nameBn: "মাদরাসা ও মসজিদ নির্মাণ তহবিল", nameEn: "Construction & Development Fund", code: "CONSTRUCTION", currentBalance: 450000 },
    { nameBn: "এতিম ছাত্র স্পন্সরশিপ ফান্ড", nameEn: "Orphan Support Fund", code: "ORPHAN_SUPPORT", currentBalance: 190000 },
  ];

  for (const f of funds) {
    await prisma.cashFund.upsert({
      where: { code: f.code },
      update: {},
      create: f,
    });
  }

  // 7. Verified Principal Profile
  const existingProfile = await prisma.principalProfile.findFirst();
  if (existingProfile) {
    await prisma.principalProfile.update({
      where: { id: existingProfile.id },
      data: {
        fullNameBn: "মাওলানা মহা. আবুল কালাম সরকার",
        fullNameEn: "Maulana Md. Abul Kalam Sarkar",
        designationBn: "মুহতামিম ও অধ্যক্ষ",
        designationEn: "Principal & Shaykhul Hadith",
        photoUrl: "/images/principal.jpg",
        bioBn: "সুদীর্ঘ অভিজ্ঞ আলেমে দ্বীন, মুহতামিম ও অধ্যক্ষ — ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (স্থাপিত: ২০২১ইং)।",
        officialMessageBn: "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ। আমাদের লক্ষ্য শুধু কিতাবি জ্ঞান নয়, বরং আমলে পরিপূর্ণ এক আদর্শ প্রজন্ম তৈরি করা। আল্লাহ তায়ালা এই প্রতিষ্ঠানকে কিয়ামত পর্যন্ত দ্বীনের জন্য কবুল করুন। আমিন।",
      },
    });
  } else {
    await prisma.principalProfile.create({
      data: {
        fullNameBn: "মাওলানা মহা. আবুল কালাম সরকার",
        fullNameEn: "Maulana Md. Abul Kalam Sarkar",
        designationBn: "মুহতামিম ও অধ্যক্ষ",
        designationEn: "Principal & Shaykhul Hadith",
        photoUrl: "/images/principal.jpg",
        bioBn: "সুদীর্ঘ অভিজ্ঞ আলেমে দ্বীন, মুহতামিম ও অধ্যক্ষ — ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (স্থাপিত: ২০২১ইং)।",
        officialMessageBn: "বিসমিল্লাহির রাহমানির রাহিম। ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কুরআন-সুন্নাহর সঠিক প্রচার ও চরিত্রবান আদর্শ নাগরিক গড়ার একটি অন্যতম শ্রেষ্ঠ মারকাজ। আমাদের লক্ষ্য শুধু কিতাবি জ্ঞান নয়, বরং আমলে পরিপূর্ণ এক আদর্শ প্রজন্ম তৈরি করা। আল্লাহ তায়ালা এই প্রতিষ্ঠানকে কিয়ামত পর্যন্ত দ্বীনের জন্য কবুল করুন। আমিন।",
      },
    });
  }

  console.log("Database seeded successfully with verified records!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
