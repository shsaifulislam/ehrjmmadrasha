import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE AUDIT: prisma/dev.db ===');
  const counts: Record<string, number> = {};
  
  const tables = [
    'user',
    'student',
    'teacher',
    'guardian',
    'jamatClass',
    'section',
    'subject',
    'attendance',
    'examMark',
    'studentInvoice',
    'donation',
    'gatepass',
    'notice',
    'admissionApplication',
    'systemSetting',
    'book',
    'residentialEnrollment',
    'transportRoute',
    'loginHistory'
  ];

  for (const table of tables) {
    try {
      // @ts-ignore
      const count = await (prisma as any)[table].count();
      counts[table] = count;
      console.log(`- ${table}: ${count} rows`);
    } catch (e: any) {
      console.log(`- ${table}: Error (${e.message})`);
    }
  }

  console.log('\nAudit complete.');
  await prisma.$disconnect();
}

main().catch(console.error);
