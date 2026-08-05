import prisma from "../config/prisma";
import StudentCreateService from "../modules/student/services/StudentCreateService";
import { GuardianService } from "../modules/guardian/services/GuardianService";
import { Guardian360Service } from "../modules/guardian/services/Guardian360Service";
import { RoutineAssignmentService } from "../modules/academic/services/RoutineAssignmentService";
import { AttendanceService } from "../modules/attendance/attendance.service";
import { FinanceService } from "../modules/finance/finance.service";
import { ExamService } from "../modules/exam/exam.service";
import { HostelService } from "../modules/hostel/hostel.service";
import { BazarService } from "../modules/bazar/bazar.service";
import { PayrollService } from "../modules/payroll/payroll.service";
import { NoticeService } from "../modules/notice/notice.service";
import { NotificationService } from "../modules/notification/notification.service";
import { InventoryService } from "../modules/inventory/inventory.service";

async function runFullSystemRegressionR2() {
  console.log("=================================================");
  console.log("🚀 STARTING CORE ERP FULL-SYSTEM REGRESSION (SPRINT R2.1)");
  console.log("=================================================\n");

  const uniqueSuffix = Date.now().toString().slice(-4);
  const guardianPhone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;

  // ─── 1. Academic Setup ─────────────────────────────
  console.log("📌 Step 1: Setting up Master Academic Prerequisites...");
  let session = await prisma.session.findFirst({ where: { isActive: true } });
  if (!session) {
    session = await prisma.session.create({ data: { year: "2026", isActive: true } });
  }

  let cls = await prisma.class.findFirst({ where: { numericValue: 1, isDeleted: false } });
  if (!cls) {
    cls = await prisma.class.create({ data: { name: "Class One", numericValue: 1 } });
  }

  let subject = await prisma.subject.findFirst({ where: { classId: cls.id } });
  if (!subject) {
    subject = await prisma.subject.create({
      data: { name: "আল-কুরআন ও তাজবীদ", classId: cls.id, fullMarks: 100, passMarks: 33 },
    });
  }

  let feeType = await prisma.feeType.findFirst({ where: { isDeleted: false } });
  if (!feeType) {
    feeType = await prisma.feeType.create({ data: { name: "মাসিক বেতন", defaultAmount: 1500 } });
  }

  let user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: `reg_r2_user_${uniqueSuffix}`,
        passwordHash: "dummyhash",
        role: { create: { name: `ROLE_R2_${uniqueSuffix}` } },
      },
    });
  }

  const staffUser = await prisma.user.create({
    data: {
      username: `r2_tch_user_${uniqueSuffix}`,
      passwordHash: "dummyhash",
      role: { create: { name: `ROLE_R2_TCH_${uniqueSuffix}` } },
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: staffUser.id,
      teacherId: `TCH-R2-${uniqueSuffix}`,
      nameBn: "মাওলানা আব্দুল করিম (R2)",
      phone: `017${Math.floor(10000000 + Math.random() * 90000000)}`,
    },
  });

  // ─── 2. Student & Guardian ──────────────────────────
  console.log("\n📌 Step 2: Creating Student & Guardian Link...");
  const guardian = await GuardianService.createGuardian({
    name: "হাজী রফিকুল ইসলাম (R2)",
    phone: guardianPhone,
    relation: "পিতা",
    address: "মিরপুর-১২, ঢাকা",
  });

  const student = await StudentCreateService.execute({
    nameBn: "মাহমুদুল হাসান (R2 স্টুডেন্ট)",
    guardianName: guardian.name,
    guardianPhone: guardian.phone,
    classId: cls.id,
    sessionId: session.id,
    createdBy: "REGRESSION_R2_RUNNER",
  });

  await GuardianService.linkWardToGuardian(guardian.id, student.id);
  const guardian360 = await Guardian360Service.getGuardianFull360Profile(guardian.id);
  console.log(`✅ Student & Guardian Linked! Ward Count: ${guardian360.wards.length}`);

  // ─── 3. Academic Routine & Conflict Engine ─────────
  console.log("\n📌 Step 3: Verifying Routine Slot & Conflict Engine...");
  await prisma.classRoutine.deleteMany({ where: { dayOfWeek: "TUESDAY" } });

  const slot1 = await RoutineAssignmentService.assignRoutineSlot({
    classId: cls.id,
    subjectId: subject.id,
    teacherId: teacher.id,
    dayOfWeek: "TUESDAY",
    startTime: "10:00",
    endTime: "10:45",
    roomNo: "201",
  });

  let conflictCaught = false;
  try {
    await RoutineAssignmentService.assignRoutineSlot({
      classId: cls.id,
      subjectId: subject.id,
      teacherId: teacher.id,
      dayOfWeek: "TUESDAY",
      startTime: "10:15",
      endTime: "11:00",
      roomNo: "202",
    });
  } catch (err: any) {
    conflictCaught = true;
  }
  console.log(`✅ Routine Slot Assigned! ID: ${slot1.id}, Conflict Caught: ${conflictCaught}`);

  // ─── 4. Attendance & SMS Dispatch ───────────────────
  console.log("\n📌 Step 4: Marking Attendance & Verifying Absence SMS Dispatch...");
  const attendanceService = new AttendanceService();
  const todayStr = new Date().toISOString().split("T")[0];

  await attendanceService.bulkSaveAttendance(
    {
      classId: cls.id,
      date: todayStr,
      attendances: [{ studentId: student.id, status: "ABSENT" }],
    },
    user.id
  );

  await new Promise((res) => setTimeout(res, 500));
  const searchPhone = guardianPhone.replace(/^0/, "");
  const absenceLogs = await prisma.notificationLog.findMany({
    where: { recipientPhone: { contains: searchPhone } },
  });
  console.log(`✅ Attendance Saved! Absence Notification Logged: ${absenceLogs.length > 0}`);

  // ─── 5. Finance & Fee Collection ───────────────────
  console.log("\n📌 Step 5: Finance Invoice Creation & Fee Collection...");
  const financeService = new FinanceService();
  const invoice = await financeService.createInvoice(
    {
      studentId: student.id,
      year: 2026,
      month: 9,
      type: "TUITION",
      items: [{ feeTypeId: feeType.id, amount: 1500 }],
    },
    user.id
  );

  const paymentResult = await financeService.collectPayment(
    {
      invoiceId: invoice.id,
      amountPaid: 1500,
      method: "CASH",
    },
    user.id
  );
  console.log(
    `✅ Fee Payment Collected! Receipt: ${paymentResult.receipt.receiptNumber}, Status: ${paymentResult.newStatus}`
  );

  // ─── 6. Exam & Result Engine ───────────────────────
  console.log("\n📌 Step 6: Exam Creation, Marks Entry & Report Card...");
  const examService = new ExamService();
  const exam = await examService.createExam(
    {
      name: `মেধাক্রম পরীক্ষা R2 ${uniqueSuffix}`,
      sessionId: session.id,
      isPublished: true,
    },
    user.id
  );

  await examService.bulkSaveMarks(
    {
      examId: exam.id,
      classId: cls.id,
      subjectId: subject.id,
      marks: [{ studentId: student.id, marks: 95 }],
    },
    user.id
  );

  const reportCard = await examService.getStudentResultCard(exam.id, student.id);
  console.log(
    `✅ Report Card Generated! GPA: ${reportCard.summary.gpa}, Grade: ${reportCard.summary.finalGrade}`
  );

  // ─── 7. Hostel & Bazar Engine ───────────────────────
  console.log("\n📌 Step 7: Hostel Building, Room & Bed Allocation...");
  const building = await HostelService.createBuilding({
    name: `হোস্টেল আর২ ভবন ${uniqueSuffix}`,
    code: `HBLD-${uniqueSuffix}`,
    createdById: user.id,
  });

  const room = await HostelService.createRoom({
    buildingId: building.id,
    roomNumber: `301_${uniqueSuffix}`,
    totalBeds: 2,
    monthlyRent: 2500,
    createdById: user.id,
  });

  const bedAllocation = await HostelService.allocateBed({
    studentId: student.id,
    bedId: room.beds[0].id,
    monthlyFee: 2500,
    createdById: user.id,
  });

  const bazarPurchase = await BazarService.recordBazarPurchase({
    invoiceNumber: `R2-BAZAR-${uniqueSuffix}`,
    paymentMethod: "CASH",
    items: [{ itemName: "দেশি মুসুরি ডাল", quantity: 15, unit: "KG", unitPrice: 140 }],
    createdById: user.id,
  });

  console.log(
    `✅ Hostel Bed Allocated! Status: ${bedAllocation.status}, Bazar Purchase: ৳${Number(bazarPurchase.totalAmount)}`
  );

  // ─── 8. Staff Payroll Engine ───────────────────────
  console.log("\n📌 Step 8: Staff Salary Breakdown & Monthly Payroll Disbursal...");
  const struct = await PayrollService.setSalaryStructure({
    teacherId: teacher.id,
    basicSalary: 30000,
    houseRent: 6000,
    actorId: user.id,
  });

  await prisma.salaryPayment.deleteMany({ where: { payrollRecord: { payrollMonth: { year: 2026, month: 12 } } } });
  await prisma.payrollRecord.deleteMany({ where: { payrollMonth: { year: 2026, month: 12 } } });
  await prisma.payrollMonth.deleteMany({ where: { year: 2026, month: 12 } });

  const pMonth = await PayrollService.generateMonthlyPayroll(2026, 12, user.id);
  const pRecord = pMonth.records.find((r: any) => r.teacherId === teacher.id);

  let salaryPayResult: any = null;
  if (pRecord) {
    salaryPayResult = await PayrollService.processSalaryPayment({
      payrollRecordId: pRecord.id,
      amountPaid: Number(pRecord.netPayable),
      paymentMethod: "CASH",
      paidById: user.id,
    });
  }
  console.log(`✅ Staff Payroll Disbursed! Voucher: ${salaryPayResult?.voucherNumber || "N/A"}`);

  // ─── 9. Notice Board & Communication Engine ───────
  console.log("\n📌 Step 9: Notice Board Engine & Broadcast SMS Audit...");
  const noticeService = new NoticeService();
  const notice = await noticeService.createNotice(
    {
      title: `মাদরাসা রিলিজ ক্যান্ডিডেট কনফারেন্স ${uniqueSuffix}`,
      content: "সকল ছাত্র ও অভিভাবকদের অবহিত করা হচ্ছে যে মাদরাসার পোর্টাল সফলভাবে হালনাগাদ করা হয়েছে।",
      type: "URGENT",
      isPublished: true,
    },
    user.id
  );

  const notificationService = new NotificationService();
  await notificationService.dispatchSingleNotification({
    eventType: "BULK_NOTICE" as any,
    recipientPhone: guardianPhone,
    recipientName: guardian.name,
    message: notice.content,
    referenceId: notice.id,
  });

  await new Promise((r) => setTimeout(r, 500));
  const noticeSmsLog = await prisma.notificationLog.findFirst({
    where: { recipientPhone: { contains: searchPhone } },
    orderBy: { createdAt: "desc" },
  });

  console.log(`✅ Notice Board Item Published & Broadcast SMS Logged! Status: ${noticeSmsLog?.status}`);

  // ─── 10. Inventory & Asset Engine ───────────────────
  console.log("\n📌 Step 10: Inventory Category, Stock In & Out Engine...");
  const invCat = await InventoryService.createCategory({
    name: "ল্যাব ও কম্পিউটার সরঞ্জাম",
    code: `ICAT-${uniqueSuffix}`,
    createdById: user.id,
  });

  const invItem = await InventoryService.createItem({
    categoryId: invCat.id,
    name: "ডেল মনিটর ২২ ইঞ্চি",
    code: `IITM-${uniqueSuffix}`,
    unitPrice: 12000,
    createdById: user.id,
  });

  await InventoryService.recordStockMovement({
    itemId: invItem.id,
    movementType: "STOCK_IN",
    quantity: 5,
    createdById: user.id,
  });

  await InventoryService.recordStockMovement({
    itemId: invItem.id,
    movementType: "STOCK_OUT",
    quantity: 2,
    createdById: user.id,
  });

  const finalInvItem = await prisma.inventoryItem.findUnique({ where: { id: invItem.id } });
  console.log(`✅ Inventory Stock In & Out Complete! Remaining Stock: ${finalInvItem?.currentStock}`);

  // ─── SPRINT R2 FULL SYSTEM REGRESSION MATRIX ──────
  console.log("\n=================================================");
  console.log("📋 SPRINT R2 FULL-SYSTEM REGRESSION ASSERTION MATRIX");
  console.log("=================================================");
  console.log(`1. Student & Guardian Link: ${guardian360.wards.length > 0 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Routine Assignment & Conflict Engine: ${conflictCaught ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Attendance & Absence SMS Trigger: ${absenceLogs.length > 0 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Finance Receipt & Payment Cashbook: ${paymentResult.newStatus === "PAID" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`5. Exam Auto-Grading & GPA Calculation: ${reportCard.summary.gpa === 5 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`6. Hostel Bed Allocation & Occupancy: ${bedAllocation.status === "ACTIVE" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`7. Staff Payroll Disbursal Ledger: ${salaryPayResult ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`8. Notice Board & SMS Broadcast Audit: ${noticeSmsLog?.status === "SENT" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`9. Inventory Stock In/Out Net Balance: ${finalInvItem?.currentStock === 3 ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 CORE ERP SPRINT R2.1 FULL SYSTEM REGRESSION COMPLETED!");
  console.log("=================================================\n");
}

runFullSystemRegressionR2()
  .catch((e) => {
    console.error("❌ Full System Regression R2 Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
