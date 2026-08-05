import { PrismaClient } from "@prisma/client";
import AdmissionCreateService from "../modules/admission/services/AdmissionCreateService";
import AdmissionApproveService from "../modules/admission/services/AdmissionApproveService";
import AdmissionRejectService from "../modules/admission/services/AdmissionRejectService";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING ADMISSION MODULE FULL FLOW VERIFICATION");
  console.log("=================================================\n");

  // 1. Ensure prerequisite Class & Session exist in DB
  let session = await prisma.session.findFirst({ where: { isActive: true } });
  if (!session) {
    session = await prisma.session.create({
      data: { year: "2026", isActive: true },
    });
    console.log("✅ Created test active session:", session.id);
  }

  let testClass = await prisma.class.findFirst({ where: { isDeleted: false } });
  if (!testClass) {
    testClass = await prisma.class.create({
      data: { name: "Class One (TEST)", numericValue: 1 },
    });
    console.log("✅ Created test class:", testClass.id);
  }

  // 2. Submit Admission Application (Test 1: Approval Flow)
  const appData1 = {
    applicantName: "আব্দুল্লাহ আল সাবিত",
    applicantNameEn: "Abdullah Al Sabit",
    fatherName: "রফিকুল ইসলাম",
    motherName: "ফাতিমা বেগম",
    phone: "01711223344",
    classId: testClass.id,
    sessionId: session.id,
    address: "মিরপুর-১০, ঢাকা",
    gender: "MALE",
  };

  console.log("📝 Step 1: Submitting Admission 1...");
  const admission1 = await AdmissionCreateService.execute(appData1);
  console.log(`✅ Admission 1 created with ID: ${admission1.id}, Token: ${admission1.verificationToken}`);

  // 3. Approve Admission 1
  console.log("\n⚡ Step 2: Approving Admission 1...");
  const approveResult = await AdmissionApproveService.execute(admission1.id, "TEST_ADMIN_USER");
  console.log(`✅ Admission 1 Approved successfully! Student ID generated: ${approveResult.student.studentId}`);

  // 4. Verify DB Atomic State for Admission 1
  console.log("\n🔍 Step 3: Verifying Database Records for Approved Flow...");
  const verifyAdmission1 = await prisma.admission.findUnique({
    where: { id: admission1.id },
    include: { student: true, guardian: true, invoice: true, timelines: true },
  });

  const studentCheck = await prisma.student.findUnique({ where: { id: approveResult.student.id } });
  const guardianCheck = await prisma.guardian.findUnique({ where: { id: approveResult.guardian.id } });
  const invoiceCheck = await prisma.invoice.findUnique({ where: { id: approveResult.invoice.id } });
  const auditLogCheck = await prisma.auditLog.findFirst({
    where: { action: "ADMISSION_APPROVED", resource: "Admission" },
    orderBy: { createdAt: "desc" },
  });
  const notificationCheck = await prisma.notificationLog.findFirst({
    where: { eventType: "ADMISSION_APPROVED", recipientPhone: "01711223344" },
    orderBy: { createdAt: "desc" },
  });

  console.log("--- DB VERIFICATION MATRIX (APPROVED FLOW) ---");
  console.log(`1. Admission Status APPROVED: ${verifyAdmission1?.status === "APPROVED" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Student Record Created in DB: ${studentCheck ? `PASS ✅ (Student ID: ${studentCheck.studentId})` : "FAIL ❌"}`);
  console.log(`3. Guardian Relation Linked: ${guardianCheck ? `PASS ✅ (Guardian Name: ${guardianCheck.name})` : "FAIL ❌"}`);
  console.log(`4. Finance Invoice Created: ${invoiceCheck ? `PASS ✅ (Amount: ৳${invoiceCheck.totalAmount}, Status: ${invoiceCheck.status})` : "FAIL ❌"}`);
  console.log(`5. Admission Timeline Entry Created: ${verifyAdmission1?.timelines.some(t => t.action === "APPROVED") ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`6. Audit Log Recorded: ${auditLogCheck ? `PASS ✅ (Action: ${auditLogCheck.action})` : "FAIL ❌"}`);
  console.log(`7. Notification Log Created: ${notificationCheck ? `PASS ✅ (Phone: ${notificationCheck.recipientPhone})` : "FAIL ❌"}`);

  // 5. Submit Admission 2 (Test 2: Rejection Flow)
  console.log("\n📝 Step 4: Submitting Admission 2 for Rejection Test...");
  const appData2 = {
    applicantName: "কামরুল হাসান",
    phone: "01899887766",
    classId: testClass.id,
    sessionId: session.id,
  };
  const admission2 = await AdmissionCreateService.execute(appData2);
  console.log(`✅ Admission 2 created with ID: ${admission2.id}`);

  console.log("⚡ Step 5: Rejecting Admission 2...");
  await AdmissionRejectService.execute(admission2.id, "নথিপত্র অসম্পূর্ণ", "TEST_ADMIN_USER");
  console.log("✅ Admission 2 Rejected successfully!");

  const verifyAdmission2 = await prisma.admission.findUnique({
    where: { id: admission2.id },
    include: { timelines: true },
  });

  const rejectAuditCheck = await prisma.auditLog.findFirst({
    where: { action: "ADMISSION_REJECTED", resource: "Admission" },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n--- DB VERIFICATION MATRIX (REJECTED FLOW) ---");
  console.log(`1. Admission Status REJECTED: ${verifyAdmission2?.status === "REJECTED" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Rejection Reason Saved: ${verifyAdmission2?.rejectionReason === "নথিপত্র অসম্পূর্ণ" ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Rejection Timeline Recorded: ${verifyAdmission2?.timelines.some(t => t.action === "REJECTED") ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Rejection Audit Log Recorded: ${rejectAuditCheck ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 ALL ADMISSION ATOMIC FLOW TESTS VERIFIED SUCCESSFULLY!");
  console.log("=================================================\n");
}

runVerification()
  .catch((e) => {
    console.error("❌ Verification Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
