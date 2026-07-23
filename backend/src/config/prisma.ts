import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ehrjmadrasha_erp';

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
