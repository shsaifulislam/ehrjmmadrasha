const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const phone = "01811223344";
  const email = "guardian_ui_demo@ehrj.local";
  const password = "Guardian@2026!";
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Ensure user
  let user = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }, { username: "guardian_ui_demo" }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username: "guardian_ui_demo",
        name: "জনাব মো: আবদুল্লাহ আল মামুন",
        email,
        phone,
        passwordHash,
        role: "GUARDIAN",
        status: "ACTIVE",
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: "ACTIVE",
        role: "GUARDIAN",
        phone,
      },
    });
  }

  // 2. Ensure Guardian record
  let guardian = await prisma.guardian.findFirst({
    where: { OR: [{ userId: user.id }, { phone }] },
  });

  if (!guardian) {
    guardian = await prisma.guardian.create({
      data: {
        userId: user.id,
        fullNameBn: "জনাব মো: আবদুল্লাহ আল মামুন",
        relation: "FATHER",
        phone,
        email,
      },
    });
  } else {
    guardian = await prisma.guardian.update({
      where: { id: guardian.id },
      data: { userId: user.id, phone, email },
    });
  }

  // 3. Find or create student
  let student = await prisma.student.findFirst();
  if (!student) {
    student = await prisma.student.create({
      data: {
        studentIdNumber: "EHRJ-DEMO-01",
        fullNameBn: "মুহাম্মদ উসামা মামুন",
        fullNameEn: "Muhammad Usama Mamun",
        fatherNameBn: "জনাব মো: আবদুল্লাহ আল মামুন",
        motherNameBn: "মোসাঃ রহিমা খাতুন",
        presentAddress: "ইলিয়টগঞ্জ, চান্দিনা, কুমিল্লা",
        permanentAddress: "ইলিয়টগঞ্জ, চান্দিনা, কুমিল্লা",
        dateOfBirth: new Date("2013-05-10"),
        gender: "MALE",
        bloodGroup: "A_POSITIVE",
        status: "ACTIVE",
      },
    });
  }

  // Link guardian to student
  const link = await prisma.guardianStudent.findFirst({
    where: { guardianId: guardian.id, studentId: student.id },
  });
  if (!link) {
    await prisma.guardianStudent.create({
      data: {
        guardianId: guardian.id,
        studentId: student.id,
        isPrimary: true,
      },
    });
  }

  // 4. Ensure academic session
  let session = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
  if (!session) {
    session = await prisma.academicSession.create({
      data: {
        name: "২০২৫-২০২৬",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        isCurrent: true,
        status: "ACTIVE",
      },
    });
  }

  // 5. Ensure an unpaid fee invoice exists for this student
  let invoice = await prisma.feeInvoice.findFirst({
    where: { studentId: student.id, status: "UNPAID" },
  });

  if (!invoice) {
    invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber: `INV-DEMO-${Date.now().toString().slice(-6)}`,
        studentId: student.id,
        sessionId: session.id,
        feeType: "TUITION",
        title: "মাসিক বেতন ও পরীক্ষার ফি - মার্চ ২০২৬",
        dueDate: new Date("2026-03-31"),
        totalAmount: 1500,
        netAmount: 1500,
        paidAmount: 0,
        dueAmount: 1500,
        status: "UNPAID",
        fundCode: "GENERAL",
      },
    });
  }

  console.log("DEMO GUARDIAN CREATED/READY:");
  console.log("Phone:", phone);
  console.log("Password:", password);
  console.log("Student:", student.fullNameBn);
  console.log("Unpaid Invoice:", invoice.invoiceNumber, "Amount: ৳" + invoice.dueAmount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
