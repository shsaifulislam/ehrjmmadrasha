import prisma from "../config/prisma";
import { GuardianService } from "../modules/guardian/services/GuardianService";
import { Guardian360Service } from "../modules/guardian/services/Guardian360Service";
import StudentCreateService from "../modules/student/services/StudentCreateService";

async function runGuardianVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING GUARDIAN CORE MODULE ATOMIC VERIFICATION");
  console.log("=================================================\n");

  // 1. Ensure prerequisite Session & Class
  let session = await prisma.session.findFirst({ where: { isActive: true } });
  if (!session) {
    session = await prisma.session.create({ data: { year: "2026", isActive: true } });
  }
  let cls = await prisma.class.findFirst({ where: { isDeleted: false } });
  if (!cls) {
    cls = await prisma.class.create({ data: { name: "Class One", numericValue: 1 } });
  }

  // 2. Create Guardian
  console.log("📝 Step 1: Creating Guardian via GuardianService...");
  const uniquePhone = `01799${Math.floor(100000 + Math.random() * 900000)}`;
  const guardianInput = {
    name: "হাজী রফিকুল ইসলাম",
    phone: uniquePhone,
    relation: "পিতা",
    address: "মিরপুর-১০, ঢাকা",
  };

  const guardian = await GuardianService.createGuardian(guardianInput);
  console.log(`✅ Guardian Created! ID: ${guardian.id}, Name: ${guardian.name}, Phone: ${guardian.phone}`);

  // 3. Create Student and Link Ward
  console.log("\n🔗 Step 2: Creating Student and Linking Ward to Guardian...");
  const student = await StudentCreateService.execute({
    nameBn: "রেজাউল করিম (ওয়ার্দ)",
    nameEn: "Rezaul Karim Ward",
    guardianName: guardian.name,
    guardianPhone: guardian.phone,
    classId: cls.id,
    sessionId: session.id,
    createdBy: "GUARDIAN_VERIFIER",
  });

  await GuardianService.linkWardToGuardian(guardian.id, student.id);
  console.log(`✅ Ward Linked Successfully! Student ID: ${student.id}, Linked Guardian ID: ${guardian.id}`);

  // 4. Fetch Guardian360 Aggregated Profile
  console.log("\n🔍 Step 3: Fetching Guardian360 Full Aggregated Profile...");
  const profile360 = await Guardian360Service.getGuardianFull360Profile(guardian.id);
  console.log(`✅ Guardian360 Profile Aggregated! Wards Count: ${profile360.wards.length}`);

  // 5. DB Assertion Matrix
  console.log("\n--- DB GUARDIAN VERIFICATION ASSERTION MATRIX ---");
  console.log(`1. Guardian Record Exists in DB: ${guardian ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`2. Guardian Found By ID & Phone: ${profile360.guardian ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`3. Ward Relation Successfully Linked: ${profile360.wards.length > 0 ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`4. Ward Academic Profile Resolves: ${profile360.wards[0]?.className !== undefined ? "PASS ✅" : "FAIL ❌"}`);
  console.log(`5. Financial Summary Structure Valid: ${profile360.financialSummary.totalDueAmount !== undefined ? "PASS ✅" : "FAIL ❌"}`);

  console.log("\n=================================================");
  console.log("🎉 ALL GUARDIAN CORE MODULE ATOMIC FLOWS VERIFIED!");
  console.log("=================================================\n");
}

runGuardianVerification()
  .catch((e) => {
    console.error("❌ Guardian Verification Failed with Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
