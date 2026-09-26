const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const applications = await prisma.application.findMany();
  console.log("PERSISTED_APPLICATIONS_COUNT:", applications.length);
  for (const app of applications) {
    console.log(`- [${app.applicationNumber}] ${app.studentNameBn} | ${app.guardianPhone} | Status: ${app.status} | Orphan: ${app.isOrphan}`);
  }

  const auditLogs = await prisma.auditLog.findMany();
  console.log("PERSISTED_AUDIT_LOGS_COUNT:", auditLogs.length);
  for (const log of auditLogs) {
    console.log(`- Action: ${log.action} | Entity: ${log.entityType} | Time: ${log.createdAt}`);
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
