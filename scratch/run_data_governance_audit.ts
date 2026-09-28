import { prisma } from "../src/lib/prisma";

export interface AuditAnomaly {
  domain: string;
  entity: string;
  rule: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  count: number;
  details: any[];
}

async function runComprehensiveAudit() {
  console.log("=== EXECUTING COMPREHENSIVE DATA GOVERNANCE & QUALITY AUDIT ===");
  const anomalies: AuditAnomaly[] = [];

  // -------------------------------------------------------------
  // 1. STUDENT IDENTITY & LIFECYCLE
  // -------------------------------------------------------------
  // A. Active students without active enrollment
  const currentSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } }) || 
                         await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
  
  const activeStudents = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    include: {
      enrollments: {
        where: currentSession ? { sessionId: currentSession.id, status: "ACTIVE" } : { status: "ACTIVE" }
      }
    }
  });

  const studentsWithoutEnrollment = activeStudents.filter(s => s.enrollments.length === 0);
  if (studentsWithoutEnrollment.length > 0) {
    anomalies.push({
      domain: "STUDENT",
      entity: "Student",
      rule: "ACTIVE_STUDENT_MUST_HAVE_ACTIVE_ENROLLMENT",
      severity: "HIGH",
      count: studentsWithoutEnrollment.length,
      details: studentsWithoutEnrollment.map(s => ({ id: s.id, studentIdNumber: s.studentIdNumber, name: s.fullNameBn }))
    });
  }

  // B. Multiple active enrollments in the same session
  const multiEnrollmentStudents = activeStudents.filter(s => s.enrollments.length > 1);
  if (multiEnrollmentStudents.length > 0) {
    anomalies.push({
      domain: "STUDENT",
      entity: "Enrollment",
      rule: "SINGLE_ACTIVE_ENROLLMENT_PER_SESSION",
      severity: "HIGH",
      count: multiEnrollmentStudents.length,
      details: multiEnrollmentStudents.map(s => ({ id: s.id, studentIdNumber: s.studentIdNumber, activeEnrollments: s.enrollments.length }))
    });
  }

  // C. Potential Duplicate Students (Fuzzy match on Phone + DOB or Normalized Name)
  const allStudents = await prisma.student.findMany({
    select: { id: true, studentIdNumber: true, fullNameBn: true, fatherPhone: true, dateOfBirth: true, birthCertificateNo: true, nidNo: true }
  });
  
  const duplicateCandidates: any[] = [];
  for (let i = 0; i < allStudents.length; i++) {
    for (let j = i + 1; j < allStudents.length; j++) {
      const s1 = allStudents[i];
      const s2 = allStudents[j];
      const samePhone = s1.fatherPhone && s2.fatherPhone && s1.fatherPhone.trim() === s2.fatherPhone.trim();
      const sameDob = s1.dateOfBirth && s2.dateOfBirth && s1.dateOfBirth.toISOString().split("T")[0] === s2.dateOfBirth.toISOString().split("T")[0];
      const sameName = s1.fullNameBn.trim() === s2.fullNameBn.trim();
      const sameBirthCert = s1.birthCertificateNo && s2.birthCertificateNo && s1.birthCertificateNo.trim() === s2.birthCertificateNo.trim();

      if (sameBirthCert) {
        duplicateCandidates.push({ s1: s1.studentIdNumber, s2: s2.studentIdNumber, reason: "Identical Birth Certificate", confidence: "CRITICAL" });
      } else if (samePhone && sameDob) {
        duplicateCandidates.push({ s1: s1.studentIdNumber, s2: s2.studentIdNumber, reason: "Same Father Phone & Same DOB", confidence: "HIGH" });
      } else if (sameName && sameDob) {
        duplicateCandidates.push({ s1: s1.studentIdNumber, s2: s2.studentIdNumber, reason: "Same Bangla Name & Same DOB", confidence: "MEDIUM" });
      }
    }
  }

  if (duplicateCandidates.length > 0) {
    anomalies.push({
      domain: "STUDENT",
      entity: "Student",
      rule: "POTENTIAL_DUPLICATE_STUDENT_RECORDS",
      severity: "HIGH",
      count: duplicateCandidates.length,
      details: duplicateCandidates
    });
  }

  // -------------------------------------------------------------
  // 2. GUARDIAN & RELATIONSHIP INTEGRITY
  // -------------------------------------------------------------
  // Students without a primary guardian link
  const studentsWithoutGuardian = await prisma.student.findMany({
    where: {
      status: "ACTIVE",
      guardianLinks: { none: { isPrimary: true } }
    },
    select: { id: true, studentIdNumber: true, fullNameBn: true }
  });

  if (studentsWithoutGuardian.length > 0) {
    anomalies.push({
      domain: "GUARDIAN",
      entity: "GuardianStudent",
      rule: "STUDENT_MUST_HAVE_PRIMARY_GUARDIAN",
      severity: "MEDIUM",
      count: studentsWithoutGuardian.length,
      details: studentsWithoutGuardian
    });
  }

  // Duplicate Guardians by Phone
  const guardians = await prisma.guardian.findMany({ select: { id: true, phone: true, fullNameBn: true } });
  const phoneMap: Record<string, typeof guardians> = {};
  for (const g of guardians) {
    const p = g.phone.trim();
    if (!phoneMap[p]) phoneMap[p] = [];
    phoneMap[p].push(g);
  }
  const duplicateGuardians = Object.entries(phoneMap).filter(([_, list]) => list.length > 1);
  if (duplicateGuardians.length > 0) {
    anomalies.push({
      domain: "GUARDIAN",
      entity: "Guardian",
      rule: "UNIQUE_GUARDIAN_PHONE",
      severity: "HIGH",
      count: duplicateGuardians.length,
      details: duplicateGuardians.map(([phone, list]) => ({ phone, count: list.length, names: list.map(x => x.fullNameBn) }))
    });
  }

  // -------------------------------------------------------------
  // 3. ACADEMIC & ENROLLMENT INTEGRITY
  // -------------------------------------------------------------
  // Roll number uniqueness within (session, class, section)
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, sessionId: true, classId: true, sectionId: true, rollNumber: true, studentId: true }
  });
  const rollMap: Record<string, string[]> = {};
  for (const enr of enrollments) {
    const key = `${enr.sessionId}_${enr.classId}_${enr.sectionId || "NO_SEC"}_${enr.rollNumber}`;
    if (!rollMap[key]) rollMap[key] = [];
    rollMap[key].push(enr.studentId);
  }
  const duplicateRolls = Object.entries(rollMap).filter(([_, list]) => list.length > 1);
  if (duplicateRolls.length > 0) {
    anomalies.push({
      domain: "ACADEMIC",
      entity: "Enrollment",
      rule: "UNIQUE_ROLL_IN_SESSION_CLASS_SECTION",
      severity: "HIGH",
      count: duplicateRolls.length,
      details: duplicateRolls.map(([k, list]) => ({ scope: k, studentCount: list.length }))
    });
  }

  // -------------------------------------------------------------
  // 4. FINANCE & CASH RECONCILIATION
  // -------------------------------------------------------------
  const invoices = await prisma.feeInvoice.findMany({
    include: { receipts: true, items: true, refunds: true }
  });

  const invoiceMathMismatches: any[] = [];
  const invoicePaidMismatches: any[] = [];

  for (const inv of invoices) {
    // Check netAmount calculation
    const calculatedNet = inv.totalAmount - inv.discountAmount - inv.waiverAmount + inv.lateFeeAmount;
    if (Math.abs(inv.netAmount - calculatedNet) > 0.01) {
      invoiceMathMismatches.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        netAmount: inv.netAmount,
        expected: calculatedNet
      });
    }

    // Check receipts sum vs inv.paidAmount
    const totalReceipts = inv.receipts
      .filter(r => r.paymentStatus === "SUCCESSFUL")
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalRefunds = inv.refunds.reduce((sum, ref) => sum + ref.amount, 0);
    const netPaid = totalReceipts - totalRefunds;

    if (Math.abs(inv.paidAmount - netPaid) > 0.01) {
      invoicePaidMismatches.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invPaid: inv.paidAmount,
        receiptsSum: totalReceipts,
        refundsSum: totalRefunds,
        netPaid
      });
    }
  }

  if (invoiceMathMismatches.length > 0) {
    anomalies.push({
      domain: "FINANCE",
      entity: "FeeInvoice",
      rule: "INVOICE_NET_AMOUNT_INTEGRITY",
      severity: "CRITICAL",
      count: invoiceMathMismatches.length,
      details: invoiceMathMismatches
    });
  }

  if (invoicePaidMismatches.length > 0) {
    anomalies.push({
      domain: "FINANCE",
      entity: "FeeInvoice",
      rule: "INVOICE_PAID_AMOUNT_RECEIPT_RECONCILIATION",
      severity: "CRITICAL",
      count: invoicePaidMismatches.length,
      details: invoicePaidMismatches
    });
  }

  // CashFund Reconciliation (Sum of Transactions vs currentBalance)
  const cashFunds = await prisma.cashFund.findMany({
    include: { transactions: true }
  });
  const fundReconciliationMismatches: any[] = [];
  for (const cf of cashFunds) {
    let calculated = 0;
    for (const tx of cf.transactions) {
      if (tx.type === "INCOME") calculated += tx.amount;
      else if (tx.type === "EXPENSE") calculated -= tx.amount;
    }
    if (Math.abs(cf.currentBalance - calculated) > 0.01) {
      fundReconciliationMismatches.push({
        fundCode: cf.code,
        fundName: cf.nameBn,
        recordedBalance: cf.currentBalance,
        calculatedFromLedger: calculated,
        difference: cf.currentBalance - calculated
      });
    }
  }

  if (fundReconciliationMismatches.length > 0) {
    anomalies.push({
      domain: "FINANCE",
      entity: "CashFund",
      rule: "FUND_BALANCE_LEDGER_RECONCILIATION",
      severity: "CRITICAL",
      count: fundReconciliationMismatches.length,
      details: fundReconciliationMismatches
    });
  }

  // -------------------------------------------------------------
  // 5. ATTENDANCE INTEGRITY
  // -------------------------------------------------------------
  const attendances = await prisma.attendance.findMany({
    take: 500,
    include: { student: { select: { id: true, status: true } } }
  });
  const attendanceForInactive = attendances.filter(a => a.student.status !== "ACTIVE");
  if (attendanceForInactive.length > 0) {
    anomalies.push({
      domain: "ATTENDANCE",
      entity: "Attendance",
      rule: "NO_ATTENDANCE_FOR_INACTIVE_STUDENTS",
      severity: "MEDIUM",
      count: attendanceForInactive.length,
      details: attendanceForInactive.map(a => ({ id: a.id, studentId: a.studentId, date: a.date }))
    });
  }

  // -------------------------------------------------------------
  // 6. RESULT & EXAM INTEGRITY
  // -------------------------------------------------------------
  const results = await prisma.result.findMany({
    include: {
      exam: {
        include: {
          examMarks: true
        }
      }
    }
  });

  const marksMismatches: any[] = [];
  for (const res of results) {
    const studentMarks = res.exam.examMarks.filter(m => m.studentId === res.studentId);
    if (studentMarks.length > 0) {
      const calculatedSum = studentMarks.reduce((acc, m) => acc + (m.marksObtained || 0), 0);
      if (Math.abs(res.totalObtained - calculatedSum) > 0.01 && res.totalObtained > 0) {
        marksMismatches.push({
          resultId: res.id,
          studentId: res.studentId,
          recordedTotal: res.totalObtained,
          calculatedFromMarks: calculatedSum
        });
      }
    }
  }

  if (marksMismatches.length > 0) {
    anomalies.push({
      domain: "EXAM_RESULT",
      entity: "Result",
      rule: "RESULT_TOTAL_OBTAINED_SUM_OF_MARKS",
      severity: "HIGH",
      count: marksMismatches.length,
      details: marksMismatches
    });
  }

  // -------------------------------------------------------------
  // 7. CERTIFICATE & DOCUMENT INTEGRITY
  // -------------------------------------------------------------
  const certificates = await prisma.certificate.findMany({
    select: { id: true, certificateNumber: true, verificationCode: true, isRevoked: true, status: true }
  });
  const revokedStatusMismatches = certificates.filter(c => c.isRevoked && c.status !== "REVOKED");
  if (revokedStatusMismatches.length > 0) {
    anomalies.push({
      domain: "DOCUMENT",
      entity: "Certificate",
      rule: "REVOKED_CERTIFICATE_STATUS_CONSISTENCY",
      severity: "HIGH",
      count: revokedStatusMismatches.length,
      details: revokedStatusMismatches
    });
  }

  // -------------------------------------------------------------
  // 8. LIBRARY INTEGRITY
  // -------------------------------------------------------------
  const libraryIssues = await prisma.libraryIssue.findMany({
    include: { copy: true }
  });
  const doubleIssuedCopies: any[] = [];
  const activeIssues = libraryIssues.filter(i => i.status === "ISSUED" || i.status === "OVERDUE");
  const copyMap: Record<string, string[]> = {};
  for (const ai of activeIssues) {
    if (!copyMap[ai.copyId]) copyMap[ai.copyId] = [];
    copyMap[ai.copyId].push(ai.id);
  }
  for (const [copyId, issueIds] of Object.entries(copyMap)) {
    if (issueIds.length > 1) {
      doubleIssuedCopies.push({ copyId, issueIds });
    }
  }
  if (doubleIssuedCopies.length > 0) {
    anomalies.push({
      domain: "LIBRARY",
      entity: "LibraryIssue",
      rule: "BOOK_COPY_CANNOT_BE_ISSUED_MULTIPLE_TIMES",
      severity: "CRITICAL",
      count: doubleIssuedCopies.length,
      details: doubleIssuedCopies
    });
  }

  // -------------------------------------------------------------
  // 9. INVENTORY INTEGRITY
  // -------------------------------------------------------------
  const balances = await prisma.inventoryStockBalance.findMany({
    where: { currentBalance: { lt: 0 } },
    include: { item: true }
  });
  if (balances.length > 0) {
    anomalies.push({
      domain: "INVENTORY",
      entity: "InventoryStockBalance",
      rule: "NON_NEGATIVE_STOCK_BALANCE",
      severity: "HIGH",
      count: balances.length,
      details: balances.map(b => ({ itemId: b.itemId, itemName: b.item.nameBn, quantity: b.currentBalance }))
    });
  }

  // -------------------------------------------------------------
  // 10. HR & PAYROLL INTEGRITY
  // -------------------------------------------------------------
  const payrolls = await prisma.payrollRecord.findMany();
  const payrollMathMismatches: any[] = [];
  for (const pr of payrolls) {
    const calcNet = pr.baseSalary + pr.allowances - pr.deductions - pr.advanceDeduction;
    if (Math.abs(pr.netSalary - calcNet) > 0.01) {
      payrollMathMismatches.push({
        id: pr.id,
        voucherNumber: pr.voucherNumber,
        netSalary: pr.netSalary,
        expected: calcNet
      });
    }
  }
  if (payrollMathMismatches.length > 0) {
    anomalies.push({
      domain: "HR",
      entity: "PayrollRecord",
      rule: "PAYROLL_NET_SALARY_INTEGRITY",
      severity: "HIGH",
      count: payrollMathMismatches.length,
      details: payrollMathMismatches
    });
  }

  console.log("=== COMPREHENSIVE AUDIT ANOMALIES FOUND ===");
  console.log(JSON.stringify(anomalies, null, 2));

  return anomalies;
}

runComprehensiveAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
