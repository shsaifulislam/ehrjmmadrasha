import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== AVAILABLE PRISMA MODELS & CURRENT COUNTS ===");
  const keys = Object.keys(prisma).filter(k => !k.startsWith("$") && !k.startsWith("_"));
  console.log(`Found ${keys.length} models on prisma client:`);

  const results: Record<string, number> = {};
  for (const k of keys.sort()) {
    try {
      const model = (prisma as any)[k];
      if (model && typeof model.count === "function") {
        results[k] = await model.count();
      }
    } catch (e: any) {
      results[k] = -1;
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().finally(() => prisma.$disconnect());
