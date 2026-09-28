import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== INSPECTING CURRENT EHRJ DATABASE STATE ===");

  const counts: Record<string, number> = {};
  
  counts.User = await prisma.user.count();
  counts.Session = await prisma.session.count();
  counts.AcademicSession = await prisma.academicSession.count();
  counts.JamatClass = await prisma.jamatClass.count();
  counts.Section = await prisma.section.count();
  counts.Subject = await prisma.subject.count();
  counts.TeacherAssignment = await prisma.teacherAssignment.count();
  counts.Student = await prisma.student.count();
  counts.Guardian = await prisma.guardian.count();
  counts.GuardianStudent = await prisma.guardianStudent.count();
  counts.Enrollment = await prisma.enrollment.count();
  counts.Attendance = await prisma.attendance.count();
  counts.Exam = await prisma.exam.count();
  counts.ExamMark = await prisma.examMark.count();
  counts.Result = await prisma.result.count();
  counts.FeeCategory = await prisma.feeCategory.count();
  counts.FeeStructure = await prisma.feeStructure.count();
  counts.FeeInvoice = await prisma.feeInvoice.count();
  counts.InvoiceItem = await prisma.invoiceItem.count();
  counts.PaymentReceipt = await prisma.paymentReceipt.count();
  counts.Refund = await prisma.refund.count();
  counts.CashFund = await prisma.cashFund.count();
  counts.CashTransaction = await prisma.cashTransaction.count();
  counts.Certificate = await prisma.certificate.count();
  counts.DocumentRequest = await prisma.documentRequest.count();
  counts.StudentDocument = await prisma.studentDocument.count();
  counts.LibraryBook = await prisma.libraryBook.count();
  counts.LibraryIssue = await prisma.libraryIssue.count();
  counts.HostelBuilding = await prisma.hostelBuilding.count();
  counts.HostelRoom = await prisma.hostelRoom.count();
  counts.ResidentialEnrollment = await prisma.residentialEnrollment.count();
  counts.TransportRoute = await prisma.transportRoute.count();
  counts.TransportEnrollment = await prisma.transportEnrollment.count();
  counts.InventoryItem = await prisma.inventoryItem.count();
  counts.InventoryTransaction = await prisma.inventoryTransaction.count();
  counts.Employee = await prisma.employee.count();
  counts.PayrollRecord = await prisma.payrollRecord.count();
  counts.SupportRequest = await prisma.supportRequest.count();
  counts.SystemIncident = await prisma.systemIncident.count();

  console.log("Entity Counts:", JSON.stringify(counts, null, 2));

  // Check some specific potential integrity anomalies
  // 1. Students without enrollment
  const studentsWithoutEnrollment = await prisma.student.count({
    where: { enrollments: { none: {} }, status: "ACTIVE" }
  });
  console.log("Active Students without Enrollment:", studentsWithoutEnrollment);

  // 2. Invoices without Student
  const orphanedInvoices = await prisma.feeInvoice.count({
    where: { student: { is: null as any } }
  }).catch(() => "N/A foreign key enforced");
  console.log("Orphaned Invoices:", orphanedInvoices);

  // 3. Payments without invoice
  const orphanedPayments = await prisma.paymentReceipt.count({
    where: { invoice: { is: null as any } }
  }).catch(() => "N/A foreign key enforced");
  console.log("Orphaned Payments:", orphanedPayments);

  // 4. Duplicate Student Names or Phones
  const students = await prisma.student.findMany({
    select: { id: true, studentIdNumber: true, fullNameBn: true, fatherPhone: true, dateOfBirth: true }
  });
  console.log(`Total students to profile: ${students.length}`);

  // 5. CashFunds
  const funds = await prisma.cashFund.findMany();
  console.log("Funds in DB:", funds.map(f => ({ code: f.code, nameBn: f.nameBn, balance: f.currentBalance })));

  // 6. FeeStructures
  const feeStructures = await prisma.feeStructure.findMany();
  console.log(`Total fee structures: ${feeStructures.length}`);

  // 7. Results published vs draft
  const results = await prisma.result.findMany({
    select: { id: true, status: true, isPassed: true, verificationCode: true }
  });
  console.log(`Total results: ${results.length}`, results.map(r => ({ status: r.status, code: r.verificationCode })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
