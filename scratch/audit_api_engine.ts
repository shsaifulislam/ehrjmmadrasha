import fs from "fs";
import path from "path";

interface ApiRouteAnalysis {
  filePath: string;
  relativePath: string;
  methods: string[];
  hasDynamic: boolean;
  hasAuthCheck: boolean;
  hasAdminCheck: boolean;
  hasTryCatch: boolean;
  hasPrisma: boolean;
  hasReqBody: boolean;
  hasValidation: boolean;
  issues: string[];
}

function scanDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath, fileList);
    } else if (file === "route.ts" || file === "route.js") {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function analyzeRoute(filePath: string): ApiRouteAnalysis {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = filePath.replace(/.*src[\\\/]app[\\\/]api[\\\/]/, "").replace(/[\\\/]route\.ts$/, "");

  const methods: string[] = [];
  ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].forEach((m) => {
    if (new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(content) || new RegExp(`export\\s+function\\s+${m}\\b`).test(content)) {
      methods.push(m);
    }
  });

  const hasDynamic = content.includes('export const dynamic = "force-dynamic"') || content.includes("export const dynamic = 'force-dynamic'");
  const hasAuthCheck = content.includes("getCurrentUser") || content.includes("getSessionUser") || content.includes("requireAdminAuth") || content.includes("requireAuth") || content.includes("verifySessionToken");
  const hasAdminCheck = content.includes("requireAdminAuth") || content.includes('role !== "ADMIN"') || content.includes("user.role === 'ADMIN'") || content.includes('role === "ADMIN"');
  const hasTryCatch = content.includes("try {") && content.includes("catch");
  const hasPrisma = content.includes("prisma.");
  const hasReqBody = content.includes(".json()");
  const hasValidation = content.includes(".validate") || content.includes(".parse") || content.includes("if (!") || content.includes("typeof ");

  const issues: string[] = [];

  // Check if it's an admin route
  const isAdminRoute = relativePath.startsWith("admin") || relativePath.includes("/admin");
  if (isAdminRoute && !hasAuthCheck && !hasAdminCheck) {
    issues.push("ADMIN_ROUTE_MISSING_EXPLICIT_AUTH_CHECK");
  }

  // Check if GET route with database access lacks force-dynamic
  if (methods.includes("GET") && hasPrisma && !hasDynamic) {
    issues.push("GET_ROUTE_WITH_DB_MISSING_FORCE_DYNAMIC");
  }

  // Check if request body parsing is unwrapped
  if (hasReqBody && !content.includes(".catch(") && !hasTryCatch) {
    issues.push("UNHANDLED_REQ_BODY_JSON_SYNTAX_ERROR");
  }

  // Check if DELETE/PUT/PATCH lacks auth check
  const hasMutatingMethod = methods.some((m) => ["POST", "PUT", "PATCH", "DELETE"].includes(m));
  const isPublicAllowed = relativePath.startsWith("auth/") || relativePath.startsWith("public/") || relativePath.startsWith("verify/") || relativePath.startsWith("admissions/apply") || relativePath.startsWith("v1/webhooks");
  if (hasMutatingMethod && !hasAuthCheck && !isPublicAllowed) {
    issues.push("MUTATING_ROUTE_WITHOUT_AUTH_CHECK");
  }

  // Check for any TODO or mock or placeholder
  if (content.includes("TODO") || content.includes("FIXME") || content.includes("dummy") || content.includes("mockData")) {
    issues.push("CONTAINS_TODO_OR_MOCK");
  }

  return {
    filePath,
    relativePath,
    methods,
    hasDynamic,
    hasAuthCheck,
    hasAdminCheck,
    hasTryCatch,
    hasPrisma,
    hasReqBody,
    hasValidation,
    issues,
  };
}

const apiRoot = path.join(process.cwd(), "src", "app", "api");
const routes = scanDir(apiRoot);
console.log(`Found ${routes.length} API route files.`);

const analyses = routes.map(analyzeRoute);
const flagged = analyses.filter((a) => a.issues.length > 0);

console.log(`Flagged ${flagged.length} routes with potential issues.`);

const issueGroups: Record<string, string[]> = {};
flagged.forEach((f) => {
  f.issues.forEach((iss) => {
    if (!issueGroups[iss]) issueGroups[iss] = [];
    issueGroups[iss].push(f.relativePath);
  });
});

Object.entries(issueGroups).forEach(([issue, routeList]) => {
  console.log(`\n=== [${issue}] (${routeList.length} routes) ===`);
  routeList.slice(0, 15).forEach((r) => console.log(` - ${r}`));
  if (routeList.length > 15) console.log(`   ...and ${routeList.length - 15} more`);
});
