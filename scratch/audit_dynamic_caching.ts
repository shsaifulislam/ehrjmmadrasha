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
const staticDbGetRoutes: { path: string; accessesReq: boolean; accessesDynamicAuth: boolean }[] = [];

routes.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  const rel = file.replace(/.*src[\\\/]app[\\\/]api[\\\/]/, "").replace(/[\\\/]route\.(ts|js)$/, "").replace(/\\/g, "/");

  const hasGet = /export\s+async\s+function\s+GET\b|export\s+function\s+GET\b/.test(content);
  const hasDynamic = content.includes('dynamic = "force-dynamic"') || content.includes("dynamic = 'force-dynamic'");
  const hasPrisma = content.includes("prisma.");

  if (hasGet && hasPrisma && !hasDynamic) {
    // Check if GET accesses request URL, headers, or cookies
    const accessesReq = /searchParams|req\.headers|req\.cookies|cookies\(\)|headers\(\)|request\.headers|request\.cookies|request\.nextUrl/.test(content);
    const accessesDynamicAuth = /getSessionUser|getCurrentUser|requireAdminAuth|requireAuth/.test(content);
    staticDbGetRoutes.push({
      path: rel,
      accessesReq,
      accessesDynamicAuth,
    });
  }
});

console.log(`Total GET routes with Prisma lacking force-dynamic: ${staticDbGetRoutes.length}`);
staticDbGetRoutes.forEach((r) => {
  console.log(`- ${r.path} (accessesReq: ${r.accessesReq}, dynamicAuth: ${r.accessesDynamicAuth})`);
});
