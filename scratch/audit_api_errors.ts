import fs from "fs";
import path from "path";

const apiDir = path.join(process.cwd(), "src", "app", "api");

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else if (file === "route.ts" || file === "route.js") {
      results.push(fullPath);
    }
  }
  return results;
}

const routes = getAllFiles(apiDir);

interface RouteAudit {
  file: string;
  hasUnwrappedJson: boolean;
  missingTryCatch: string[];
  swallowedErrors: boolean;
  prismaWithoutTryCatch: boolean;
  rawSql: boolean;
}

const results: RouteAudit[] = [];

routes.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  const rel = file.replace(/.*src[\\\/]app[\\\/]api[\\\/]/, "").replace(/\\/g, "/");

  // Check exported methods
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const missingTryCatch: string[] = [];

  methods.forEach((m) => {
    const regex = new RegExp(`export\\s+async\\s+function\\s+${m}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)(export|$)`);
    const match = content.match(regex);
    if (match) {
      const funcBody = match[1];
      if (!funcBody.includes("try {") || !funcBody.includes("catch")) {
        missingTryCatch.push(m);
      }
    }
  });

  const hasUnwrappedJson = /await\s+(req|request)\.json\(\)/.test(content) && !/try\s*\{[\s\S]*?await\s+(req|request)\.json\(\)[\s\S]*?\}\s*catch/.test(content);
  const swallowedErrors = /catch\s*\([^)]*\)\s*\{\s*\}/.test(content) || /catch\s*\{\s*\}/.test(content);
  const prismaWithoutTryCatch = content.includes("prisma.") && missingTryCatch.length > 0;
  const rawSql = content.includes("$queryRaw") || content.includes("$executeRaw");

  if (missingTryCatch.length > 0 || hasUnwrappedJson || swallowedErrors || rawSql) {
    results.push({
      file: rel,
      hasUnwrappedJson,
      missingTryCatch,
      swallowedErrors,
      prismaWithoutTryCatch,
      rawSql,
    });
  }
});

console.log(`Routes with potential error handling issues: ${results.length}`);
console.log(`- Completely missing try/catch in method: ${results.filter(r => r.missingTryCatch.length > 0).length}`);
console.log(`- Unwrapped await req.json(): ${results.filter(r => r.hasUnwrappedJson).length}`);
console.log(`- Swallowed catch blocks: ${results.filter(r => r.swallowedErrors).length}`);
console.log(`- Prisma queries in method missing try/catch: ${results.filter(r => r.prismaWithoutTryCatch).length}`);
console.log(`- Raw SQL queries: ${results.filter(r => r.rawSql).length}`);

results.forEach(r => {
  if (r.missingTryCatch.length > 0) {
    console.log(`[NO_TRY_CATCH] ${r.file} in methods: [${r.missingTryCatch.join(", ")}]`);
  }
  if (r.swallowedErrors) {
    console.log(`[SWALLOWED_ERROR] ${r.file}`);
  }
  if (r.rawSql) {
    console.log(`[RAW_SQL] ${r.file}`);
  }
});
