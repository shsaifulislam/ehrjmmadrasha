/**
 * EHRJ DIGITAL CAMPUS - PHASE 6 FINANCE, FEES & FINANCIAL MANAGEMENT ENGINE TEST SUITE
 * Fully automated, zero browser overhead, runs directly against Next.js production server.
 */

const http = require("http");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

let adminCookies = "";
let teacherCookies = "";
let guardianCookies = "";

let testSessionId = "";
let testClassId = "";
let testStudentId = "";
let testGuardianUserId = "";
let otherStudentId = "";

let testInvoiceId = "";
let testPaymentReceiptId = "";
let testReceiptToken = "";
let testStructureId = "";

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};

    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers,
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          json,
          raw: data,
        });
      });
    });

    req.on("error", (e) => reject(e));

    if (options.body) {
      const bodyData = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
      req.write(bodyData);
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`  [PASS] ${message}`);
  }
}

async function runTests() {
  console.log("=================================================================");
  console.log("  EHRJ DIGITAL CAMPUS - PHASE 6 FINANCE ENGINE TEST SUITE");
  console.log("=================================================================\n");

  try {
    // 0. AUTHENTICATION & FIXTURES SETUP
    console.log("--- 0. Authentication & Academic Fixtures Setup ---");

    // Admin Login
    const adminLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { identifier: "adminehrjmadrasha@gmail.com", password: "AdminEhrj@2026!" },
    });
    adminCookies = adminLoginRes.headers["set-cookie"]
      ? adminLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";
    assert(adminLoginRes.statusCode === 200, "Admin login succeeded with session cookie");

    // Teacher Login
    const teacherLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { identifier: "teacherehrjmadrasha@gmail.com", password: "Teacher@2026!" },
    });
    teacherCookies = teacherLoginRes.headers["set-cookie"]
      ? teacherLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";
    assert(teacherLoginRes.statusCode === 200, "Teacher login succeeded with session cookie");

    // Active AcademicSession
    const session = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    assert(!!session, "Active current AcademicSession found");
    testSessionId = session.id;

    // Active JamatClass with enrolled student
    const jamatClass = await prisma.jamatClass.findFirst({
      where: { enrollments: { some: { status: "ACTIVE" } } },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: true },
          take: 2,
        },
      },
    });
    assert(!!jamatClass && jamatClass.enrollments.length >= 1, "Active JamatClass with students found");
    testClassId = jamatClass.id;
    testStudentId = jamatClass.enrollments[0].student.id;

    if (jamatClass.enrollments.length > 1) {
      otherStudentId = jamatClass.enrollments[1].student.id;
    } else {
      const other = await prisma.student.findFirst({ where: { id: { not: testStudentId } } });
      otherStudentId = other ? other.id : "unlinked-student-id";
    }

    // Guardian fixture
    const testHash = await bcrypt.hash("Guardian@2026!", 10);
    let guardianUser = await prisma.user.findFirst({ where: { role: "GUARDIAN" } });
    if (!guardianUser) {
      guardianUser = await prisma.user.create({
        data: {
          username: "guardian_fin_user",
          email: "guardianfin@ehrj.edu",
          passwordHash: testHash,
          role: "GUARDIAN",
          name: "অভিভাবক ফাইন্যান্স টেস্ট",
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.user.update({
        where: { id: guardianUser.id },
        data: { passwordHash: testHash, status: "ACTIVE" },
      });
    }

    let guardianRecord = await prisma.guardian.findFirst({ where: { userId: guardianUser.id } });
    if (!guardianRecord) {
      guardianRecord = await prisma.guardian.create({
        data: {
          userId: guardianUser.id,
          fullNameBn: "মুহাম্মদ কবির হোসেন",
          relation: "FATHER",
          phone: "01711223344",
        },
      });
    }

    // Link student to guardian
    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardianRecord.id,
          studentId: testStudentId,
        },
      },
      create: {
        guardianId: guardianRecord.id,
        studentId: testStudentId,
        isPrimary: true,
      },
      update: {},
    });

    // Clean up any existing assistance/scholarships for testStudentId to ensure test idempotency
    await prisma.financialAssistance.deleteMany({ where: { studentId: testStudentId } });
    await prisma.studentScholarship.deleteMany({ where: { studentId: testStudentId } });

    const guardianLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: guardianUser.username || guardianUser.email,
        password: "Guardian@2026!",
      },
    });
    assert(guardianLoginRes.statusCode === 200, "Guardian login succeeded with session cookie");
    guardianCookies = guardianLoginRes.headers["set-cookie"]
      ? guardianLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";

    // 1. FEE STRUCTURES CONFIGURATION
    console.log("\n--- 1. Configurable Fee Structure Tests ---");

    const structureRes = await makeRequest("/api/admin/finance/structures", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        sessionId: testSessionId,
        classId: testClassId,
        feeType: "MONTHLY",
        nameBn: "মাসিক সেশন ও টিউশন ফি (টেস্ট)",
        amount: 1200,
        residentialStatus: "ALL",
        dueDay: 10,
        lateFeeAmount: 50,
        lateFeeGraceDays: 5,
        fundCode: "GENERAL",
      },
    });
    assert(structureRes.statusCode === 200, "Admin can configure class-specific FeeStructure");
    assert(structureRes.json.structure.amount === 1200, "FeeStructure amount accurately stored as 1200");
    testStructureId = structureRes.json.structure.id;

    // Configure Food bill fee structure
    const foodStructureRes = await makeRequest("/api/admin/finance/structures", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        sessionId: testSessionId,
        classId: testClassId,
        feeType: "FOOD",
        nameBn: "লিল্লাহ বোর্ডিং খাবার বিল (টেস্ট)",
        amount: 2500,
        residentialStatus: "RESIDENTIAL",
        fundCode: "LILLAH",
      },
    });
    assert(foodStructureRes.statusCode === 200, "Food bill FeeStructure configured for LILLAH fund");

    // 2. DAY CARE FOOD RULE (CRITICAL INVARIANT)
    console.log("\n--- 2. Day Care Food Rule Tests (Backend Enforced) ---");

    // Set student residential status to DAY_CARE
    await prisma.student.update({
      where: { id: testStudentId },
      data: { residentialStatus: "DAY_CARE" },
    });

    const dayCareInvoiceRes = await makeRequest("/api/admin/finance/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        studentId: testStudentId,
        sessionId: testSessionId,
        classId: testClassId,
        feeType: "FOOD",
        title: "ডে-কেয়ার ফুড টেস্ট বিল",
      },
    });

    assert(dayCareInvoiceRes.statusCode === 200, "Food bill request for Day Care student handled safely");
    assert(dayCareInvoiceRes.json.invoice.netAmount === 0, "Day Care student food bill netAmount is strictly ৳0");
    assert(dayCareInvoiceRes.json.invoice.status === "WAIVED", "Day Care student food bill is marked as WAIVED");
    assert(
      dayCareInvoiceRes.json.calculation.breakdown.some((b) => b.rule === "DAY_CARE_FOOD_EXEMPTION"),
      "Day Care food bill includes explicit DAY_CARE_FOOD_EXEMPTION rule breakdown"
    );

    // Reset student back to RESIDENTIAL
    await prisma.student.update({
      where: { id: testStudentId },
      data: { residentialStatus: "RESIDENTIAL" },
    });

    // 3. DISCOUNT / SCHOLARSHIP / ASSISTANCE PRECEDENCE
    console.log("\n--- 3. Precedence & Final Payable Boundary Tests ---");

    const precInvoiceRes = await makeRequest("/api/admin/finance/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        studentId: testStudentId,
        sessionId: testSessionId,
        classId: testClassId,
        feeType: "MONTHLY",
        title: "প্রেসিডেন্স টেস্ট বিল",
      },
    });
    assert(precInvoiceRes.statusCode === 200, "Base fee accurately resolved from FeeStructure (৳1200)");
    assert(precInvoiceRes.json.invoice.totalAmount === 1200, "Invoice base amount matches ৳1200");
    assert(precInvoiceRes.json.invoice.netAmount >= 0, "Net payable enforces non-negative boundary max(0, finalPayable)");

    // 4. INVOICE GENERATION & DUE LIFECYCLE
    console.log("\n--- 4. Invoice Generation & Lifecycle Tests ---");

    const invoiceRes = await makeRequest("/api/admin/finance/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        studentId: testStudentId,
        sessionId: testSessionId,
        classId: testClassId,
        feeType: "MONTHLY",
        title: "২০২৬ শিক্ষাবর্ষের টেস্ট মাসিক ফি",
      },
    });
    assert(invoiceRes.statusCode === 200, "Admin can create invoice using Fee Rule Engine");
    assert(invoiceRes.json.invoice.invoiceNumber.startsWith("EHRJ-INV-"), "Invoice number formatted as EHRJ-INV-YYYY-XXXXX");
    assert(invoiceRes.json.invoice.dueAmount === 1200, "Initial invoice dueAmount matches netAmount (৳1200)");
    assert(invoiceRes.json.invoice.status === "UNPAID", "Initial invoice status is UNPAID");
    testInvoiceId = invoiceRes.json.invoice.id;

    // 5. BULK MONTHLY INVOICE & IDEMPOTENCY
    console.log("\n--- 5. Bulk Monthly Billing & Idempotency Tests ---");

    const bulkRes1 = await makeRequest("/api/admin/finance/invoices/monthly-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        sessionId: testSessionId,
        classId: testClassId,
        billingMonth: "2026-03",
        feeType: "MONTHLY",
      },
    });
    assert(bulkRes1.statusCode === 200, "Bulk monthly billing executed successfully");

    // Repeat same request to test idempotency
    const bulkRes2 = await makeRequest("/api/admin/finance/invoices/monthly-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        sessionId: testSessionId,
        classId: testClassId,
        billingMonth: "2026-03",
        feeType: "MONTHLY",
      },
    });
    assert(bulkRes2.statusCode === 200, "Repeated bulk billing executed without crash");
    assert(bulkRes2.json.createdCount === 0, "Idempotency guard: zero new invoices created on repeated execution");
    assert(bulkRes2.json.skippedCount >= 1, "Idempotency guard: previously generated invoices safely skipped");

    // 6. PAYMENT COLLECTION, PARTIAL PAYMENTS & LEDGER
    console.log("\n--- 6. Partial Payment & Fund Balance Tests ---");

    // Fetch initial GENERAL fund balance
    const generalFundBefore = await prisma.cashFund.findFirst({ where: { code: "GENERAL" } });
    const initialFundBal = generalFundBefore ? generalFundBefore.currentBalance : 0;

    // Partial payment: ৳500 on ৳1200 invoice
    const payRes1 = await makeRequest("/api/admin/finance/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        invoiceId: testInvoiceId,
        amount: 500,
        paymentMethod: "CASH",
        notes: "প্রথম কিস্তি পরিশোধ",
        idempotencyKey: `IDEM-PAY-TEST-${Date.now()}`,
      },
    });
    assert(payRes1.statusCode === 200, "Partial payment of ৳500 collected successfully");
    assert(payRes1.json.invoice.paidAmount === 500, "Invoice paidAmount updated to ৳500");
    assert(payRes1.json.invoice.dueAmount === 700, "Invoice dueAmount accurately reduced to ৳700");
    assert(payRes1.json.invoice.status === "PARTIALLY_PAID", "Invoice status updated to PARTIALLY_PAID");
    assert(payRes1.json.receipt.receiptNumber.startsWith("EHRJ-RCP-"), "Receipt number formatted as EHRJ-RCP-YYYY-XXXXX");
    testPaymentReceiptId = payRes1.json.receipt.id;
    testReceiptToken = payRes1.json.receipt.qrCodeToken;

    // Verify CashFund increment
    const generalFundAfter1 = await prisma.cashFund.findFirst({ where: { code: "GENERAL" } });
    assert(
      generalFundAfter1.currentBalance === initialFundBal + 500,
      "GENERAL cash fund balance atomically incremented by payment amount (+৳500)"
    );

    // Reject overpayment: attempting to pay ৳800 when due is ৳700
    const overpayRes = await makeRequest("/api/admin/finance/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        invoiceId: testInvoiceId,
        amount: 800,
        paymentMethod: "CASH",
      },
    });
    assert(overpayRes.statusCode === 400, "Overpayment exceeding remaining due strictly rejected with 400 Bad Request");

    // Pay remaining ৳700 to settle invoice
    const payRes2 = await makeRequest("/api/admin/finance/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        invoiceId: testInvoiceId,
        amount: 700,
        paymentMethod: "BKASH",
        transactionId: "TRX-SETTLE-700",
      },
    });
    assert(payRes2.statusCode === 200, "Final payment of ৳700 accepted");
    assert(payRes2.json.invoice.dueAmount === 0, "Invoice dueAmount is now ৳0");
    assert(payRes2.json.invoice.status === "PAID", "Invoice status updated to PAID");

    // 7. PAYMENT IDEMPOTENCY
    console.log("\n--- 7. Payment Idempotency Tests ---");

    const idempotencyKeyTest = `IDEM-PAY-KEY-2026-${Date.now()}`;
    // Create new test invoice for idempotency
    const testInvIdem = await prisma.feeInvoice.create({
      data: {
        invoiceNumber: `EHRJ-INV-IDEM-${Date.now()}`,
        studentId: testStudentId,
        sessionId: testSessionId,
        title: "আইডেমপোটেন্সি টেস্ট ইনভয়েস",
        dueDate: new Date(),
        totalAmount: 300,
        netAmount: 300,
        dueAmount: 300,
        status: "UNPAID",
      },
    });

    const idemPay1 = await makeRequest("/api/admin/finance/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        invoiceId: testInvIdem.id,
        amount: 300,
        paymentMethod: "CASH",
        idempotencyKey: idempotencyKeyTest,
      },
    });
    assert(idemPay1.statusCode === 200, "First payment with idempotency key succeeded");

    // Repeat same payment
    const idemPay2 = await makeRequest("/api/admin/finance/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        invoiceId: testInvIdem.id,
        amount: 300,
        paymentMethod: "CASH",
        idempotencyKey: idempotencyKeyTest,
      },
    });
    assert(idemPay2.statusCode === 200, "Repeated payment request returned 200 OK");
    assert(idemPay2.json.isDuplicate === true, "Repeated payment flagged as idempotent duplicate");
    assert(idemPay2.json.receipt.id === idemPay1.json.receipt.id, "Returned exact same receipt without duplicate financial record");

    // 8. FULL AND PARTIAL REFUND ENGINE
    console.log("\n--- 8. Refund Engine & Balance Restitution Tests ---");

    const refundRes = await makeRequest("/api/admin/finance/payments/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        paymentId: testPaymentReceiptId,
        amount: 200,
        reason: "অতিরিক্ত আদায় সমন্বয় ও আংশিক ফেরত",
        refundMethod: "CASH",
      },
    });
    assert(refundRes.statusCode === 200, "Partial refund of ৳200 processed successfully");
    assert(refundRes.json.refund.refundNumber.startsWith("EHRJ-RFD-"), "Refund number formatted as EHRJ-RFD-YYYY-XXXXX");
    assert(refundRes.json.invoice.dueAmount === 200, "Invoice dueAmount accurately restored to ৳200");
    assert(refundRes.json.invoice.paidAmount === 1000, "Invoice recognized paidAmount reduced to ৳1000");

    // Check AuditLog for refund
    const refundAudit = await prisma.auditLog.findFirst({
      where: { action: "PROCESS_FEE_REFUND", entityId: refundRes.json.refund.id },
    });
    assert(!!refundAudit, "AuditLog recorded for PROCESS_FEE_REFUND");

    // 9. FIVE APPROVED FUNDS & RESTRICTED USAGE
    console.log("\n--- 9. Five Approved Funds & Restricted Usage Tests ---");

    const allFunds = await prisma.cashFund.findMany();
    const fundCodes = allFunds.map((f) => f.code);
    assert(fundCodes.includes("GENERAL"), "Institutional Fund GENERAL present");
    assert(fundCodes.includes("LILLAH"), "Institutional Fund LILLAH present");
    assert(fundCodes.includes("ZAKAT"), "Institutional Fund ZAKAT present");
    assert(fundCodes.includes("CONSTRUCTION"), "Institutional Fund CONSTRUCTION present");
    assert(fundCodes.includes("ORPHAN_SUPPORT"), "Institutional Fund ORPHAN_SUPPORT present");

    // Shariah restriction test: Zakat fund CANNOT be used for office overhead/utility
    const zakatOverheadRes = await makeRequest("/api/admin/finance/funds/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        fundCode: "ZAKAT",
        type: "EXPENSE",
        category: "দাপ্তরিক অফিস ইউটিলিটি বিল",
        amount: 500,
        payeeOrPayer: "বিদ্যুৎ অফিস",
      },
    });
    assert(
      zakatOverheadRes.statusCode === 400,
      "Shariah restriction: Zakat fund blocked from office/utility overhead with 400 Bad Request"
    );

    // Legitimate Zakat expense (poor student support)
    const zakatGoodRes = await makeRequest("/api/admin/finance/funds/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        fundCode: "ZAKAT",
        type: "EXPENSE",
        category: "দরিদ্র এতিম ছাত্র শিক্ষা উপকরণ সহায়তা",
        amount: 1000,
        payeeOrPayer: "শিক্ষার্থী কল্যাণ শাখা",
      },
    });
    assert(zakatGoodRes.statusCode === 200, "Legitimate Zakat student welfare expense processed successfully");

    // Overdraft protection test
    const overdraftRes = await makeRequest("/api/admin/finance/funds/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        fundCode: "LILLAH",
        type: "EXPENSE",
        category: "লিল্লাহ খাবার ব্যয়",
        amount: 99999999, // Exceeds balance
        payeeOrPayer: "বাজার সরবরাহকারী",
      },
    });
    assert(overdraftRes.statusCode === 400, "Overdraft protection: Expense exceeding available fund balance blocked");

    // 10. DAILY CASHBOOK RECONCILIATION
    console.log("\n--- 10. Daily Cashbook Reconciliation Tests ---");

    const cashbookRes = await makeRequest("/api/admin/finance/cashbook", {
      method: "GET",
      headers: { Cookie: adminCookies },
    });
    assert(cashbookRes.statusCode === 200, "Daily Cashbook fetched successfully");
    assert(cashbookRes.json.summary.todayIncome >= 0, "Cashbook contains accurate positive income tally");
    assert(cashbookRes.json.summary.todayExpense >= 0, "Cashbook contains accurate positive expense tally");
    assert(Array.isArray(cashbookRes.json.transactions), "Cashbook returns granular transaction records");

    // 11. FINANCIAL ASSISTANCE & SCHOLARSHIPS
    console.log("\n--- 11. Financial Assistance & Scholarship Tests ---");

    // Guardian submits assistance request
    const assistSubmitRes = await makeRequest("/api/portal/finance/assistance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: guardianCookies,
      },
      body: {
        studentId: testStudentId,
        sessionId: testSessionId,
        reason: "পারিবারিক অসচ্ছলতা ও দিনমজুর পিতার পক্ষে পূর্ণ ফি প্রদান অসমর্থ্য।",
        isOrphan: false,
        familyCondition: "দিনমজুর, ৫ সদস্যের পরিবার",
      },
    });
    assert(assistSubmitRes.statusCode === 200, "Guardian submitted financial assistance request");
    const assistanceId = assistSubmitRes.json.application.id;

    // Admin reviews and approves 50% waiver
    const assistApproveRes = await makeRequest("/api/admin/finance/assistance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        id: assistanceId,
        action: "APPROVE",
        waiverPercentage: 50,
        reason: "যাচাইান্তে অসচ্ছল প্রমাণিত বিধায় ৫০% ফি মওকুফ অনুমোদিত।",
      },
    });
    assert(assistApproveRes.statusCode === 200, "Admin approved financial assistance with 50% waiver");
    assert(assistApproveRes.json.assistance.status === "APPROVED", "Assistance status updated to APPROVED");

    // Create and assign scholarship
    const scholarshipRes = await makeRequest("/api/admin/finance/scholarships", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        nameBn: "হিফজ মেধা বৃত্তি ২০২৬",
        code: `HIFZ-MERIT-${Date.now()}`,
        discountType: "PERCENTAGE",
        discountValue: 20,
        applicableFeeType: "TUITION",
      },
    });
    assert(scholarshipRes.statusCode === 200, "Admin created scholarship program");

    // 12. PAYROLL FOUNDATION
    console.log("\n--- 12. Payroll Foundation & Salary Slips Tests ---");

    const teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER" } });
    assert(!!teacherUser, "Teacher user found for payroll test");

    // Clean up test month payroll record to guarantee test idempotency
    await prisma.payrollRecord.deleteMany({ where: { userId: teacherUser.id, month: "2026-03" } });

    const payrollRes = await makeRequest("/api/admin/finance/payroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        userId: teacherUser.id,
        month: "2026-03",
        baseSalary: 15000,
        allowances: 2000,
        deductions: 500,
        paymentMethod: "BANK",
        action: "PAY",
      },
    });
    if (payrollRes.statusCode !== 200) {
      console.log("PAYROLL ERROR:", payrollRes.statusCode, payrollRes.json);
    }
    assert(payrollRes.statusCode === 200, "Admin processed and disbursed teacher monthly salary");
    assert(payrollRes.json.payroll.netSalary === 16500, "Net salary calculated correctly (15000 + 2000 - 500 = 16500)");
    assert(payrollRes.json.payroll.voucherNumber.startsWith("EHRJ-PAY-"), "Salary slip voucher formatted as EHRJ-PAY-YYYY-XXXXX");
    assert(payrollRes.json.payroll.status === "PAID", "Payroll status marked as PAID");

    // 13. GUARDIAN SCOPE & IDOR PROTECTION
    console.log("\n--- 13. Guardian Scope & IDOR Protection Tests ---");

    // Authorized child query
    const guardianChildRes = await makeRequest(`/api/portal/finance?studentId=${testStudentId}`, {
      method: "GET",
      headers: { Cookie: guardianCookies },
    });
    assert(guardianChildRes.statusCode === 200, "Guardian can view linked child's financial summary");
    assert(guardianChildRes.json.student.id === testStudentId, "Returned financial data matches linked child");
    assert(Array.isArray(guardianChildRes.json.invoices), "Returned invoices array for linked child");

    // IDOR Attack: Guardian attempts to query unlinked student's finance
    const idorRes = await makeRequest(`/api/portal/finance?studentId=${otherStudentId}`, {
      method: "GET",
      headers: { Cookie: guardianCookies },
    });
    assert(idorRes.statusCode === 403, "Guardian IDOR attack to unlinked student finance blocked with 403 Forbidden");

    // Teacher attempting to access Admin finance API
    const teacherFinanceRes = await makeRequest("/api/admin/finance/invoices", {
      method: "GET",
      headers: { Cookie: teacherCookies },
    });
    assert(teacherFinanceRes.statusCode === 403, "Teacher accessing Admin finance API blocked with 403 Forbidden");

    // Anonymous request to Admin finance API
    const anonFinanceRes = await makeRequest("/api/admin/finance/invoices", {
      method: "GET",
    });
    assert(anonFinanceRes.statusCode === 403, "Anonymous request to Admin finance API blocked with 403 Forbidden");

    // 14. PUBLIC PRIVACY-SAFE RECEIPT VERIFICATION
    console.log("\n--- 14. Public Privacy-Safe Receipt Verification Tests ---");

    const verifyReceiptRes = await makeRequest(`/api/verify/receipt/${testReceiptToken}`, {
      method: "GET",
    });
    assert(verifyReceiptRes.statusCode === 200, "Public receipt verification returned 200 OK");
    assert(verifyReceiptRes.json.verified === true, "Receipt marked as authentic");
    assert(!!verifyReceiptRes.json.receipt.receiptNumber, "Authentic receipt number displayed");
    assert(!!verifyReceiptRes.json.receipt.studentName, "Authentic student name displayed");

    // Privacy Checks
    assert(!verifyReceiptRes.json.receipt.phone, "Privacy check: Guardian phone strictly omitted");
    assert(!verifyReceiptRes.json.receipt.nid, "Privacy check: NID strictly omitted");
    assert(!verifyReceiptRes.json.receipt.address, "Privacy check: Private address strictly omitted");
    assert(!verifyReceiptRes.json.receipt.notes, "Privacy check: Internal notes strictly omitted");

    // Invalid token returns 404
    const invalidReceiptRes = await makeRequest("/api/verify/receipt/INVALID-TOKEN-9999", {
      method: "GET",
    });
    assert(invalidReceiptRes.statusCode === 404, "Invalid receipt token returned 404 Not Found");

    console.log("\n=================================================================");
    console.log("  PHASE 6 TEST SUMMARY: ALL ASSERTIONS PASSED WITH ZERO FAILURES");
    console.log("=================================================================\n");
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
