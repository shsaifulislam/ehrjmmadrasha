import { PrismaClient as DefaultPrismaClient, type PrismaClient } from "@prisma/client";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const isPostgresStaging =
    process.env.USE_POSTGRES_STAGING === "true" ||
    process.env.DATABASE_PROVIDER === "postgresql";

  if (isPostgresStaging) {
    try {
      const stagingClientPath = path.resolve(process.cwd(), "scratch", "prisma-staging-client");
      const nativeRequire =
        typeof (globalThis as any).__non_webpack_require__ !== "undefined"
          ? (globalThis as any).__non_webpack_require__
          : eval("require");
      const { PrismaClient: StagingClient } = nativeRequire(stagingClientPath);
      return new StagingClient({
        datasources: {
          db: {
            url: process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL,
          },
        },
        log: ["warn", "error"],
      }) as PrismaClient;
    } catch (err) {
      console.error("[Prisma Staging] Error loading PostgreSQL staging client:", err);
      throw err;
    }
  }

  return new DefaultPrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;

/**
 * Institutional Reliability Initializer:
 * Enforces Write-Ahead Logging (WAL) and busy timeout for SQLite.
 * Safely bypassed when running against PostgreSQL staging.
 */
export async function initializeDatabasePragmas(): Promise<void> {
  const isPostgresStaging =
    process.env.USE_POSTGRES_STAGING === "true" ||
    process.env.DATABASE_PROVIDER === "postgresql";

  if (isPostgresStaging) {
    return;
  }

  try {
    await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;");
    await prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
  } catch (err) {
    console.warn("[Prisma Pragmas] Failed to apply SQLite optimization pragmas:", err);
  }
}

