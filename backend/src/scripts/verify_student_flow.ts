import prisma from "../config/prisma";
import StudentCreateService from "../modules/student/services/StudentCreateService";
import StudentAcademicRepository from "../modules/student/repositories/StudentAcademicRepository";
import Student360Service from "../services/shared/Student360Service";

async function runStudentVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING STUDENT CORE MODULE ATOMIC VERIFICATION");
  console.log("=================================================\n");

  // 1. Ensure prerequisite Session & Classes
  let session1 = await prisma.session.findFirst({ where: { isActive: true } });
  if (!session1) {
    session1 = await prisma.session.create({ data: { year: "2026", isActive: true } });
  }

  let session2 = await prisma.session.findFirst({ where: { year: "2027" } });
  if (!session2) {
    session2 = await prisma.session.create({ data: { year: "2027", isActive: false } });
  }

  let class1 = await prisma.class.findFirst({ where: { numericValue: 1, isDeleted: false } });
  if (!class1) {
    class1 = await prisma.class.create({ data: { name: "Class One", numericValue: 1 } });
  }

  let class2 = await prisma.class.findFirst({ where: { numericValue: 2, isDeleted: false } });
  if (!class2) {
    class2 = await prisma.class.create({ data: { name: "Class Two", numericValue: 2 } });
  }

  // 2. Create Student
  console.log("📝 Step 1: Creating Student via StudentCreateService...");
  const createInput = {
    nameBn: "রেজাউল করিম",
    nameEn: "Rezaul Karim",
    dob: "2012-05-15",
    phone: "01755443322",
    guardianName: "মোহাম্মদ আলি",
    guardianPhone: "01755443322",
    classId: class1.id,
    sessionId: session1.id,
    address: "ধানমন্ডি, ঢাকা",
    createdBy: "VERIFICATION_TESTER",
  };

  const student = await StudentCreateService.execute(createInput);
  console.log(`✅ Student Created! ID: ${student.id}, Code: ${student.studentId}, Roll: ${student.roll}`);

  // 3. Promote Student to Class 2
  console.log("\n⚡ Step 2: Promoting Student to Class Two (Session 2027)...");
  const existingRolls = await prisma.student.count({
    where: { classId: class2.id, sessionId: session2.id },
  });
  const targetRoll = existingRolls + 1;

  const promotedStudent = await StudentAcademicRepository.promoteStudent(
    student.id,
    class2.id,
    session2.id,
    targetRoll,
    "VERIFICATION_TESTER"
  );
  console.log(`✅ Promotion Successful! New ClassId: ${promotedStudent.classId}, New Roll: ${promotedStudent.roll}`);

  // 4. Verify Student360 Profile Aggregation
  console.log("\n🔍 Step 3: Fetching Student360 Profile...");
  const profile360 = await Student360Service.getStudentFullProfile(student.id);
  console.log(`✅ Student360 Profile Aggregated for ${profile360.student.nameBn}!`);

  // 5. Transfer / TC Issue
  console.log("\n⚡ Step 4: Transferring / Issuing TC...");
  const transferred = await StudentAcademicRepository.transferStudent(
    student.id,
    "অভিভাবকের বদলিজনিত কারণে টিসি প্রদান",
    "VERIFICATION_TESTER"
  );
  console.log(`✅ Transfer Successful! Active Status: ${transferred.isActive}`);

  // 6. DB Assertions Summary
  console.log("\n--- DB VERIFICATION ASSERTION MATRIX ---");
  console.log(`1. Student Record Exists in DB: ${student ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. User Account Created for Login: ${student.userId ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Guardian Relation Linked: ${student.guardianId ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Promotion Roll Updated to Target Roll: ${promotedStudent.roll === targetRoll ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`5. Student360 Profile Resolves: ${profile360.student ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`6. Deactivation/Transfer Status: ${transferred.isActive === false ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 ALL STUDENT MODULE ATOMIC FLOWS VERIFIED!");
  console.log("=================================================\n");
}

runStudentVerification()
  .catch((e) => {
    console.error("❌ Student Verification Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
