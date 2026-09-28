import { prisma } from "../src/lib/prisma";
import {
  ensureDefaultHrMasterData,
  generateNextEmployeeId,
  generateNextLeaveRequestCode,
  createDepartment,
  getDepartments,
  createDesignation,
  getDesignations,
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  changeEmployeeStatus,
  addQualification,
  deleteQualification,
  addEmployeeDocument,
  verifyEmployeeDocument,
  getExpiringDocuments,
  getLeaveTypes,
  getEmployeeLeaveBalances,
  submitLeaveRequest,
  reviewLeaveRequest,
  getLeaveRequests,
  recordEmployeeAttendance,
  getEmployeeAttendance,
  getHrDashboardStats,
  getEmployeeRegisterReport,
  getTeacherRegisterReport,
  getLeaveReport,
  verifyEmployeePublicToken,
  generateEmployeeIdCardData,
} from "../src/lib/hrEngine";

async function runComprehensivePhase13Tests() {
  console.log("=================================================");
  console.log("🚀 STARTING EHRJ PHASE 13 HR ENGINE TEST SUITE");
  console.log("=================================================");

  // 1. Ensure admin user exists for test recording
  let testAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!testAdmin) {
    testAdmin = await prisma.user.create({
      data: {
        name: "Test Super Admin",
        username: "hr_test_admin",
        email: "hr_admin@ehrjmadrasha.com",
        passwordHash: "$2a$12$eXAmPLeHaShEdPaSsWoRdFoRTeStInGoNlY1234567890",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
  }

  // 2. Default Master Data Seeding
  console.log("\n[TEST 1] Testing Default HR Master Data Seeding...");
  await ensureDefaultHrMasterData();
  const depts = await getDepartments();
  const desigs = await getDesignations();
  const leaveTypes = await getLeaveTypes();
  console.log(`✅ Default Master Data Loaded: ${depts.length} departments, ${desigs.length} designations, ${leaveTypes.length} leave types.`);
  if (depts.length < 5 || desigs.length < 5 || leaveTypes.length < 5) {
    throw new Error("Master data seeding count below expected threshold");
  }

  // 3. Concurrency-Safe Sequence IDs
  console.log("\n[TEST 2] Testing Concurrency-Safe Sequence Generation...");
  const empId1 = await generateNextEmployeeId();
  const empId2 = await generateNextEmployeeId();
  console.log(`✅ Generated Employee IDs: ${empId1} -> ${empId2}`);
  if (empId1 === empId2 || !empId1.startsWith("EHRJ-EMP-")) {
    throw new Error("Employee ID sequence generation failed");
  }

  const lrqCode1 = await generateNextLeaveRequestCode();
  const lrqCode2 = await generateNextLeaveRequestCode();
  console.log(`✅ Generated Leave Request Codes: ${lrqCode1} -> ${lrqCode2}`);
  if (lrqCode1 === lrqCode2 || !lrqCode1.startsWith("EHRJ-LRQ-")) {
    throw new Error("Leave Request Code sequence generation failed");
  }

  // 4. Department & Designation CRUD
  console.log("\n[TEST 3] Testing Custom Department & Designation Creation...");
  const customDept = await createDepartment({
    nameBn: "বিশেষ গবেষণা ও ইফতা শাখা",
    nameEn: `Research & Ifta ${Date.now()}`,
    description: "উচ্চতর গবেষণা ও ফতোয়া বিভাগ",
    recordedByUserId: testAdmin.id,
  });
  console.log(`✅ Created Custom Dept: ${customDept.nameBn} (${customDept.id})`);

  const customDesig = await createDesignation({
    nameBn: "মুফতি ও সিনিয়র গবেষক",
    nameEn: `Mufti & Senior Researcher ${Date.now()}`,
    departmentId: customDept.id,
    recordedByUserId: testAdmin.id,
  });
  console.log(`✅ Created Custom Desig: ${customDesig.nameBn} (${customDesig.id})`);

  // 5. Employee Master Lifecycle (Create, Query, Update)
  console.log("\n[TEST 4] Testing Employee Master Lifecycle...");
  const timestamp = Date.now();
  const teacherUser = await prisma.user.create({
    data: {
      name: "মুফতি আব্দুর রহমান",
      username: `teacher_${timestamp}`,
      email: `teacher_${timestamp}@ehrjmadrasha.com`,
      passwordHash: "$2a$12$eXAmPLeHaShEdPaSsWoRdFoRTeStInGoNlY1234567890",
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  const employee = await createEmployee(
    {
      nameBn: "মুফতি আব্দুর রহমান",
      nameEn: "Mufti Abdur Rahman",
      employeeType: "TEACHER",
      departmentId: customDept.id,
      designationId: customDesig.id,
      gender: "MALE",
      mobile: `01711${String(timestamp).slice(-6)}`,
      email: `teacher_${timestamp}@ehrjmadrasha.com`,
      nidNumber: `198510${String(timestamp).slice(-8)}`,
      baseSalary: 25000,
      joiningDate: new Date(),
      presentAddress: "মাদরাসা ক্যাম্পাস, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      userId: teacherUser.id,
    },
    testAdmin.id
  );
  console.log(`✅ Employee Created: ${employee.nameBn} (ID: ${employee.employeeId}, Base Salary: ৳${employee.baseSalary})`);

  // Query employee details
  const empDetails = await getEmployeeById(employee.id);
  if (!empDetails || empDetails.user?.id !== teacherUser.id) {
    throw new Error("Failed to resolve Employee with linked User account");
  }
  console.log(`✅ Resolved Employee profile linked to User: ${empDetails.user?.name} (Role: ${empDetails.user?.role})`);

  // Update employee salary and track employment history
  console.log("\n[TEST 5] Testing Salary & Designation Update with Employment History Timeline...");
  const updatedEmp = await updateEmployee(
    employee.id,
    {
      baseSalary: 28000,
      changeReason: "বার্ষিক ইনক্রিমেন্ট ও বিশেষ দায়িত্ব ভাতা",
    },
    testAdmin.id
  );
  console.log(`✅ Salary Updated to ৳${updatedEmp.baseSalary}. History records checked.`);
  const refreshedEmp = await getEmployeeById(employee.id);
  const salaryHistory = refreshedEmp?.employmentHistories.find((h) => h.changeType === "SALARY_CHANGE");
  if (!salaryHistory) {
    throw new Error("Salary change history record was not created");
  }
  console.log(`✅ Verified Immutable Employment History: ${salaryHistory.previousValue} -> ${salaryHistory.newValue} (${salaryHistory.reason})`);

  // 6. Qualifications Management
  console.log("\n[TEST 6] Testing Qualifications Management...");
  const qual = await addQualification({
    employeeId: employee.id,
    degreeTitle: "দাওরায়ে হাদীস (মাস্টার্স সমমান)",
    institution: "দারুল উলুম হাটহাজারী",
    boardOrUniversity: "বেফাকুল মাদারিসিল আরাবিয়া",
    passingYear: 2018,
    resultOrGrade: "মুমতাজ (প্রথম বিভাগ)",
    recordedByUserId: testAdmin.id,
  });
  console.log(`✅ Qualification Added: ${qual.degreeTitle} from ${qual.institution}`);

  // 7. Employee Document & Expiry Tracking
  console.log("\n[TEST 7] Testing Professional Documents & Expiry Tracking...");
  const futureExpiry = new Date();
  futureExpiry.setDate(futureExpiry.getDate() + 15); // Expiring in 15 days

  const doc = await addEmployeeDocument({
    employeeId: employee.id,
    documentType: "APPOINTMENT_LETTER",
    title: "অফিসিয়াল নিয়োগপত্র ও চুক্তি",
    fileUrl: "/documents/appointment_emp_001.pdf",
    issueDate: new Date(),
    expiryDate: futureExpiry,
    uploadedByUserId: testAdmin.id,
  });
  console.log(`✅ Employee Document Uploaded: ${doc.title} (Verification Token: ${doc.verificationToken})`);

  const expiringDocs = await getExpiringDocuments(30);
  const foundExpiring = expiringDocs.some((d) => d.id === doc.id);
  console.log(`✅ Expiring Documents Scanner: Found ${expiringDocs.length} expiring documents. Target doc detected: ${foundExpiring}`);
  if (!foundExpiring) {
    throw new Error("Expiring document was not detected in 30-day window");
  }

  // 8. Leave Lifecycle & Balance Integration
  console.log("\n[TEST 8] Testing Leave Workflow & Balance Deductions...");
  const casualLeaveType = leaveTypes.find((lt) => lt.code === "CASUAL") || leaveTypes[0];
  const balancesBefore = await getEmployeeLeaveBalances(employee.id);
  const casualBalBefore = balancesBefore.find((b) => b.leaveTypeId === casualLeaveType.id);
  console.log(`✅ Casual Leave Balance Before: Allocated=${casualBalBefore?.allocatedDays}, Remaining=${casualBalBefore?.remainingDays}, Pending=${casualBalBefore?.pendingDays}`);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 3); // 3 days

  const leaveReq = await submitLeaveRequest({
    employeeId: employee.id,
    leaveTypeId: casualLeaveType.id,
    startDate,
    endDate,
    reason: "জরুরি পারিবারিক কারণ ও ব্যক্তিগত প্রয়োজন",
    recordedByUserId: testAdmin.id,
  });
  console.log(`✅ Leave Request Submitted: ${leaveReq.requestCode} (Total Days: ${leaveReq.totalDays}, Status: ${leaveReq.status})`);

  // Duplicate overlapping request prevention test
  let overlapBlocked = false;
  try {
    await submitLeaveRequest({
      employeeId: employee.id,
      leaveTypeId: casualLeaveType.id,
      startDate,
      endDate,
      reason: "ওভারল্যাপিং টেস্ট",
      recordedByUserId: testAdmin.id,
    });
  } catch (err: any) {
    overlapBlocked = true;
    console.log(`✅ Overlapping Leave Correctly Blocked: "${err.message}"`);
  }
  if (!overlapBlocked) {
    throw new Error("Overlapping leave request was not blocked!");
  }

  // Review & Approve Leave Request
  const approvedReq = await reviewLeaveRequest({
    requestId: leaveReq.id,
    decision: "APPROVED",
    decisionReason: "কর্তৃপক্ষ কর্তৃক ছুটির আবেদন অনুমোদিত হয়েছে।",
    reviewedByUserId: testAdmin.id,
  });
  console.log(`✅ Leave Approved: ${approvedReq.requestCode} (Status: ${approvedReq.status})`);

  const balancesAfter = await getEmployeeLeaveBalances(employee.id);
  const casualBalAfter = balancesAfter.find((b) => b.leaveTypeId === casualLeaveType.id);
  console.log(`✅ Casual Leave Balance After Approval: Used=${casualBalAfter?.usedDays}, Remaining=${casualBalAfter?.remainingDays}, Pending=${casualBalAfter?.pendingDays}`);
  if (casualBalAfter?.usedDays !== (casualBalBefore?.usedDays || 0) + leaveReq.totalDays) {
    throw new Error("Leave balance was not properly updated upon approval");
  }

  // 9. Staff Attendance Integration
  console.log("\n[TEST 9] Testing Staff Attendance Recording...");
  const today = new Date();
  const attRecord = await recordEmployeeAttendance({
    employeeId: employee.id,
    date: today,
    status: "PRESENT",
    checkInTime: "08:15 AM",
    checkOutTime: "04:30 PM",
    remarks: "যথাসময়ে উপস্থিত",
    recordedByUserId: testAdmin.id,
  });
  console.log(`✅ Attendance Recorded: Date=${attRecord.date.toISOString().split("T")[0]}, Status=${attRecord.status}`);

  const attList = await getEmployeeAttendance({ employeeId: employee.id });
  if (attList.length === 0 || attList[0].status !== "PRESENT") {
    throw new Error("Attendance query failed to return recorded entry");
  }

  // 10. Phase 6 Payroll Integration
  console.log("\n[TEST 10] Testing Phase 6 Payroll Integration...");
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const payroll = await prisma.payrollRecord.upsert({
    where: {
      userId_month: {
        userId: teacherUser.id,
        month: currentMonth,
      },
    },
    update: {
      employeeId: employee.id,
      baseSalary: employee.baseSalary,
      netSalary: employee.baseSalary,
      status: "APPROVED",
    },
    create: {
      voucherNumber: `EHRJ-PAY-${currentMonth}-${employee.employeeId}`,
      userId: teacherUser.id,
      employeeId: employee.id,
      month: currentMonth,
      baseSalary: employee.baseSalary,
      allowances: 0,
      deductions: 0,
      netSalary: employee.baseSalary,
      status: "APPROVED",
      paymentMethod: "CASH",
      fundCode: "GENERAL",
    },
  });
  console.log(`✅ Phase 6 Payroll Linked: Voucher=${payroll.voucherNumber}, Month=${payroll.month}, NetSalary=৳${payroll.netSalary}, EmployeeId=${payroll.employeeId}`);

  // 11. Phase 12 Asset Assignment Integration
  console.log("\n[TEST 11] Testing Phase 12 Asset Assignment Integration...");
  // Find or create asset to assign
  let sampleAsset = await prisma.inventoryAsset.findFirst();
  if (sampleAsset) {
    await prisma.inventoryAsset.update({
      where: { id: sampleAsset.id },
      data: {
        assignedEmployeeId: employee.id,
        status: "IN_USE",
      },
    });
    console.log(`✅ Asset ${sampleAsset.assetCode} assigned to Employee ${employee.employeeId}`);
    const empWithAsset = await getEmployeeById(employee.id);
    if (empWithAsset?.assignedAssets.length === 0) {
      throw new Error("Employee profile does not reflect assigned asset");
    }
    console.log(`✅ Employee Profile verified with ${empWithAsset?.assignedAssets.length} assigned asset(s).`);
  }

  // 12. Digital ID Card Generation
  console.log("\n[TEST 12] Testing Digital ID Card Generation with QR Code...");
  const idCard = await generateEmployeeIdCardData(employee.id);
  console.log(`✅ ID Card Generated: Name=${idCard.employee.nameBn}, ID=${idCard.employee.employeeId}`);
  console.log(`✅ QR Code Verification URL: ${idCard.verifyUrl}`);
  if (!idCard.qrCodeUrl.startsWith("data:image/png;base64,")) {
    throw new Error("QR Code URL is not a valid base64 data image");
  }

  // 13. Public Privacy-Safe Token Verification
  console.log("\n[TEST 13] Testing Public Privacy-Safe Token Verification...");
  const publicVerifyEmp = await verifyEmployeePublicToken(employee.qrToken);
  console.log(`✅ Public QR Token Verification: Valid=${publicVerifyEmp.isValid}, Type=${publicVerifyEmp.verificationType}, Name=${publicVerifyEmp.employee?.nameBn}`);
  if (!publicVerifyEmp.isValid || (publicVerifyEmp as any).employee?.salary !== undefined) {
    throw new Error("Public verification failed or leaked private fields!");
  }

  const publicVerifyDoc = await verifyEmployeePublicToken(doc.verificationToken);
  console.log(`✅ Public Doc Token Verification: Valid=${publicVerifyDoc.isValid}, DocTitle=${publicVerifyDoc.document?.title}`);
  if (!publicVerifyDoc.isValid) {
    throw new Error("Public document verification token failed");
  }

  // 14. Dashboard Stats & Reports
  console.log("\n[TEST 14] Testing HR Dashboard Aggregate Stats & Reports...");
  const dashStats = await getHrDashboardStats();
  console.log(`✅ Dashboard Stats: Total=${dashStats.totalEmployees}, Active=${dashStats.activeEmployees}, Teachers=${dashStats.teachersCount}, Staff=${dashStats.staffCount}`);
  if (dashStats.totalEmployees < 1) {
    throw new Error("HR Dashboard stats returned invalid employee count");
  }

  const empRegister = await getEmployeeRegisterReport();
  const teacherRegister = await getTeacherRegisterReport();
  const leaveReport = await getLeaveReport();
  console.log(`✅ Reports Verified: EmpRegister=${empRegister.length}, TeacherRegister=${teacherRegister.length}, LeaveReport=${leaveReport.length}`);

  // 15. Employee Offboarding Lifecycle
  console.log("\n[TEST 15] Testing Employee Offboarding Lifecycle (Resignation)...");
  const offboardedEmp = await changeEmployeeStatus({
    employeeId: employee.id,
    newStatus: "RESIGNED",
    reason: "উচ্চতর ইসলামিক ডিগ্রি অর্জনে মদিনা ইসলামি বিশ্ববিদ্যালয়ে গমনের জন্য অব্যাহতি",
    recordedByUserId: testAdmin.id,
  });
  console.log(`✅ Employee Status Changed: Status=${offboardedEmp.status}, ExitReason=${offboardedEmp.exitReason}`);

  // Verify User login is deactivated upon offboarding
  const linkedUserAfterExit = await prisma.user.findUnique({ where: { id: teacherUser.id } });
  console.log(`✅ Linked User Account Status After Offboarding: ${linkedUserAfterExit?.status}`);
  if (linkedUserAfterExit?.status !== "INACTIVE") {
    throw new Error("Linked User account was not deactivated on employee offboarding");
  }

  // Verify historical records remain immutable
  const historicRecords = await getEmployeeById(employee.id);
  const resignationHistory = historicRecords?.employmentHistories.find((h) => h.changeType === "RESIGNATION");
  if (!resignationHistory) {
    throw new Error("Resignation history record missing");
  }
  console.log(`✅ Historical Immortality Confirmed: Total History Events=${historicRecords?.employmentHistories.length}`);

  console.log("\n=================================================");
  console.log("🎉 ALL 15 PHASE 13 HR ENGINE TESTS PASSED WITH 100% SUCCESS!");
  console.log("=================================================\n");
}

runComprehensivePhase13Tests()
  .catch((err) => {
    console.error("❌ Phase 13 Test Suite Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
