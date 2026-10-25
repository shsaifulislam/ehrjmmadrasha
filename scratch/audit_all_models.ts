import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const schemaContent = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf-8');
  const modelRegex = /^model\s+(\w+)\s+\{/gm;
  const models: string[] = [];
  let match;
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    models.push(match[1]);
  }

  console.log(`Found ${models.length} models in schema.prisma.`);
  console.log('=== DATABASE AUDIT: prisma/dev.db ===\n');

  const populated: { model: string; count: number }[] = [];
  const empty: string[] = [];
  const errors: { model: string; error: string }[] = [];

  for (const m of models) {
    const propertyName = m.charAt(0).toLowerCase() + m.slice(1);
    try {
      if ((prisma as any)[propertyName]) {
        const count = await (prisma as any)[propertyName].count();
        if (count > 0) {
          populated.push({ model: m, count });
        } else {
          empty.push(m);
        }
      } else {
        errors.push({ model: m, error: 'Property not found on PrismaClient' });
      }
    } catch (e: any) {
      errors.push({ model: m, error: e.message });
    }
  }

  console.log('POPULATED MODELS:');
  populated.sort((a, b) => b.count - a.count).forEach(item => {
    console.log(`  - ${item.model}: ${item.count} rows`);
  });

  console.log(`\nEMPTY MODELS (${empty.length}):`);
  console.log('  ' + empty.join(', '));

  if (errors.length > 0) {
    console.log(`\nERRORS (${errors.length}):`);
    errors.forEach(err => console.log(`  - ${err.model}: ${err.error}`));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
