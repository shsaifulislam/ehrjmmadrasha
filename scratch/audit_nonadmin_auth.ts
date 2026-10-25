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

const allRoutes = getAllFiles(apiDir);
const nonAdminFlagged: { path: string; methods: string[]; hasAuth: boolean }[] = [];

allRoutes.forEach((file) => {
  const rel = file.replace(/.*src[\\\/]app[\\\/]api[\\\/]/, "").replace(/\\/g, "/");
  if (rel.startsWith("admin/")) return; // already verified 0

  const content = fs.readFileSync(file, "utf-8");
  const methods: string[] = [];
  ["GET", "POST", "PUT", "PATCH", "DELETE"].forEach((m) => {
    if (new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(content) || new RegExp(`export\\s+function\\s+${m}\\b`).test(content)) {
      methods.push(m);
    }
  });

  const hasAuth = /getCurrentUser|getSessionUser|requireAdminAuth|requireAuth|verifySessionToken|authMiddleware/.test(content);
  
  // Exclude intended public endpoints:
  const isPublic = /^(auth\/|public\/|verify\/|certificates\/verify|admissions\/apply|admissions\/draft|admissions\/track|admissions\/check-duplicate|admissions\/resubmit|admissions$|students\/search)/.test(rel);

  if (!hasAuth && !isPublic) {
    nonAdminFlagged.push({
      path: rel,
      methods,
      hasAuth,
    });
  }
});

console.log(`Non-admin routes lacking in-handler auth check: ${nonAdminFlagged.length}`);
nonAdminFlagged.forEach((r) => {
  console.log(`- ${r.path} [${r.methods.join(", ")}]`);
});
