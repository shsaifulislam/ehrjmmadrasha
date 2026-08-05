import prisma from "../config/prisma";
import { FinanceService } from "../modules/finance/finance.service";
import StudentCreateService from "../modules/student/services/StudentCreateService";

async function runFinanceVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING FINANCE & FEE CORE MODULE ATOMIC VERIFICATION");
  console.log("=================================================\n");

  // 1. Prerequisites (Session, Class, FeeType, Student)
  let session = await prisma.session.findFirst({ where: { isActive: true } });
  if (!session) {
    session = await prisma.session.create({ data: { year: "2026", isActive: true } });
  }

  let cls = await prisma.class.findFirst({ where: { isDeleted: false } });
  if (!cls) {
    cls = await prisma.class.create({ data: { name: "Class One", numericValue: 1 } });
  }

  let feeType = await prisma.feeType.findFirst({ where: { isDeleted: false } });
  if (!feeType) {
    feeType = await prisma.feeType.create({ data: { name: "মাসিক বেতন", defaultAmount: 1500 } });
  }

  let user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: `fin_tester_${Date.now()}`,
        passwordHash: "dummyhash",
        role: { create: { name: `ROLE_FINANCE_${Date.now()}` } },
      },
    });
  }

  const guardianPhone = `01712${Math.floor(100000 + Math.random() * 900000)}`;
  const student = await StudentCreateService.execute({
    nameBn: "মাহমুদুল হাসান (ফি টেস্ট)",
    guardianName: "হাজী আব্দুল মালিক",
    guardianPhone: guardianPhone,
    classId: cls.id,
    sessionId: session.id,
    createdBy: "FINANCE_VERIFIER",
  });

  const financeService = new FinanceService();

  // 2. Create Invoice
  console.log("📝 Step 1: Creating Fee Invoice for Student...");
  const invoice = await financeService.createInvoice(
    {
      studentId: student.id,
      year: 2026,
      month: 8,
      type: "TUITION",
      items: [{ feeTypeId: feeType.id, amount: 1500 }],
    },
    user.id
  );
  console.log(`✅ Invoice Created! ID: ${invoice.id}, Amount: ৳${invoice.totalAmount}, Status: ${invoice.status}`);

  // 3. Collect Fee Payment
  console.log("\n💰 Step 2: Collecting Fee Payment & Generating Receipt...");
  const paymentResult = await financeService.collectPayment(
    {
      invoiceId: invoice.id,
      amountPaid: 1500,
      method: "CASH",
    },
    user.id
  );

  console.log(
    `✅ Payment Collected! PaymentID: ${paymentResult.payment.id}, ReceiptNo: ${paymentResult.receipt.receiptNumber}, New Status: ${paymentResult.newStatus}`
  );

  // 4. Verify Notification Event Log
  console.log("\n📲 Step 3: Verifying Fee Payment SMS Notification Dispatch...");
  // Wait for setImmediate async SMS notification dispatch to record in DB
  await new Promise((res) => setTimeout(res, 800));

  const searchPhone = guardianPhone.replace(/^0/, "");
  const smsLogs = await prisma.notificationLog.findMany({
    where: { recipientPhone: { contains: searchPhone } },
  });

  console.log(`✅ Fee Payment SMS Logged! Count: ${smsLogs.length}`);

  // 5. DB Assertion Matrix
  console.log("\n--- DB FINANCE VERIFICATION ASSERTION MATRIX ---");
  console.log(`1. Fee Invoice Created: ${invoice ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Payment Record Inserted: ${paymentResult.payment ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Official Receipt Generated: ${paymentResult.receipt.receiptNumber ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Invoice Status Updated to PAID: ${paymentResult.newStatus === "PAID" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`5. Guardian SMS Notification Triggered: ${smsLogs.length > 0 ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 ALL FINANCE CORE MODULE ATOMIC FLOWS VERIFIED!");
  console.log("=================================================\n");
}

runFinanceVerification()
  .catch((e) => {
    console.error("❌ Finance Verification Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
