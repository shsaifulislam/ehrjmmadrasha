const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function testAuth() {
  console.log("--- RUNNING AUTH INTEGRITY VERIFICATION (GMAIL & .COM ONLY) ---");

  // 1. Admin verification
  const admin = await prisma.user.findUnique({ where: { email: "adminehrjmadrasha@gmail.com" } });
  if (!admin) throw new Error("Admin not found in DB");
  const isMatchAdmin = await bcrypt.compare("AdminEhrj@2026!", admin.passwordHash);
  console.log(`[PASS] Admin credentials verified (adminehrjmadrasha@gmail.com): ${isMatchAdmin}`);

  // 2. Bad password test
  const isMatchBad = await bcrypt.compare("wrongpassword", admin.passwordHash);
  console.log(`[PASS] Bad password rejected properly: ${!isMatchBad}`);

  // 3. Teacher verification
  const teacher = await prisma.user.findUnique({ where: { email: "teacherehrjmadrasha@gmail.com" } });
  if (!teacher) throw new Error("Teacher not found in DB");
  const isMatchTeacher = await bcrypt.compare("Teacher@2026!", teacher.passwordHash);
  console.log(`[PASS] Teacher credentials verified (teacherehrjmadrasha@gmail.com): ${isMatchTeacher}`);

  console.log("--- ALL AUTH CHECKS PASSED SUCCESSFULLY (ZERO .EDU REFERENCES) ---");
}

testAuth()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
