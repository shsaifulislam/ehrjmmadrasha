import fs from "fs";
import path from "path";

const adminApiDir = path.join(process.cwd(), "src", "app", "api", "admin");

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

const adminRoutes = getAllFiles(adminApiDir);
const routesWithoutExplicitHandlerAuth: string[] = [];

adminRoutes.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  const rel = file.replace(/.*src[\\\/]app[\\\/]api[\\\/]/, "").replace(/\\/g, "/");

  const hasSessionCheck = /getCurrentUser|getSessionUser|requireAdminAuth|requireAuth|verifySessionToken/.test(content);
  if (!hasSessionCheck) {
    routesWithoutExplicitHandlerAuth.push(rel);
  }
});

console.log(`Admin routes without explicit handler auth check: ${routesWithoutExplicitHandlerAuth.length}`);
routesWithoutExplicitHandlerAuth.forEach((r) => console.log(` - ${r}`));
