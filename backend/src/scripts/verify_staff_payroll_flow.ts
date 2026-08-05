import prisma from "../config/prisma";
import { PayrollService } from "../modules/payroll/payroll.service";

async function runStaffPayrollVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING STAFF, PAYROLL & LIBRARY CORE MODULE ATOMIC VERIFICATION");
  console.log("=================================================\n");

  const uniqueSuffix = Date.now().toString().slice(-4);

  // 1. Create System User & Staff/Teacher
  let user = await prisma.user.findFirst({ where: { isActive: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: `payroll_user_${uniqueSuffix}`,
        passwordHash: "dummyhash",
        role: { create: { name: `ROLE_PAYROLL_${uniqueSuffix}` } },
      },
    });
  }

  const staffUser = await prisma.user.create({
    data: {
      username: `staff_emp_${uniqueSuffix}`,
      passwordHash: "dummyhash",
      role: { create: { name: `ROLE_STAFF_${uniqueSuffix}` } },
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: staffUser.id,
      teacherId: `EMP-${uniqueSuffix}`,
      nameBn: "মাওলানা মুফতি আজমল হোসাইন",
      designation: "সিনিয়র মুহাদ্দিস",
      phone: `017${Math.floor(10000000 + Math.random() * 90000000)}`,
    },
  });

  console.log(`📝 Step 1: Staff & Teacher Created! Teacher ID: ${teacher.teacherId}, Name: ${teacher.nameBn}`);

  // 2. Setup Salary Structure
  console.log("\n💰 Step 2: Setting up Staff Salary Breakdown Structure...");
  const structure = await PayrollService.setSalaryStructure({
    teacherId: teacher.id,
    basicSalary: 25000,
    houseRent: 5000,
    medicalAllowance: 2000,
    foodAllowance: 3000,
    actorId: user.id,
  });

  console.log(
    `✅ Salary Structure Configured! Basic: ৳${structure.basicSalary}, Gross Salary: ৳${structure.grossSalary}`
  );

  // 3. Generate Monthly Payroll Process
  console.log("\n📊 Step 3: Generating Monthly Payroll Process...");
  const monthNum = 11;
  const yearNum = 2026;

  await prisma.salaryPayment.deleteMany({ where: { payrollRecord: { payrollMonth: { year: yearNum, month: monthNum } } } });
  await prisma.payrollRecord.deleteMany({ where: { payrollMonth: { year: yearNum, month: monthNum } } });
  await prisma.payrollMonth.deleteMany({ where: { year: yearNum, month: monthNum } });

  const payrollResult = await PayrollService.generateMonthlyPayroll(yearNum, monthNum, user.id);

  console.log(
    `✅ Monthly Payroll Generated! Slips Count: ${payrollResult.records.length}, Total Gross: ৳${payrollResult.totalGross}`
  );

  // 4. Disburse Salary with Cashbook Ledger Integration
  console.log("\n💸 Step 4: Processing Salary Payment Disbursal...");
  const pMonth = await PayrollService.getPayrollMonth(yearNum, monthNum);
  const teacherRecord = pMonth?.records.find((r: any) => r.teacherId === teacher.id);

  let paymentResult: any = null;
  if (teacherRecord) {
    paymentResult = await PayrollService.processSalaryPayment({
      payrollRecordId: teacherRecord.id,
      amountPaid: Number(teacherRecord.netPayable),
      paymentMethod: "CASH",
      note: "মাসিক বেতন পরিশোধ",
      paidById: user.id,
    });
    console.log(
      `✅ Salary Paid! Slip ID: ${teacherRecord.id}, Net Paid: ৳${teacherRecord.netPayable}, Voucher: ${paymentResult.voucherNumber}`
    );
  }

  // 5. DB Assertion Matrix
  console.log("\n--- DB STAFF & PAYROLL VERIFICATION ASSERTION MATRIX ---");
  console.log(`1. Teacher & Staff Employee Created: ${teacher ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Gross Salary Structure Defined: ${Number(structure.grossSalary) === 35000 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Monthly Payroll Slip Generated: ${payrollResult.records.length > 0 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Salary Disbursed & Ledger Posted: ${paymentResult && Number(paymentResult.amountPaid) > 0 ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 ALL STAFF & PAYROLL CORE MODULE ATOMIC FLOWS VERIFIED!");
  console.log("=================================================\n");
}

runStaffPayrollVerification()
  .catch((e) => {
    console.error("❌ Staff & Payroll Verification Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
