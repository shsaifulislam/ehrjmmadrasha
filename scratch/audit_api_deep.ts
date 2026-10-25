import fs from "fs";
import path from "path";

// 1. Map all API routes and their exported methods, parameters, and auth implementations
const apiDir = path.join(process.cwd(), "src", "app", "api");
const srcDir = path.join(process.cwd(), "src");

function getAllFiles(dir: string, extFilter: (f: string) => boolean): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extFilter));
    } else if (extFilter(file)) {
      results.push(fullPath);
    }
  }
  return results;
}

const routeFiles = getAllFiles(apiDir, (f) => f === "route.ts" || f === "route.js");
console.log(`Loaded ${routeFiles.length} API route files.`);

interface RouteInfo {
  file: string;
  endpoint: string; // e.g. /api/admin/users
  methods: string[];
  dynamic?: string;
  hasAuth: boolean;
  hasAdmin: boolean;
  hasRateLimit: boolean;
  content: string;
}

const routeMap = new Map<string, RouteInfo>();

routeFiles.forEach((file) => {
  const rel = file.replace(/.*src[\\\/]app/, "").replace(/[\\\/]route\.(ts|js)$/, "").replace(/\\/g, "/");
  const content = fs.readFileSync(file, "utf-8");
  const methods: string[] = [];
  ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].forEach((m) => {
    if (new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(content) || new RegExp(`export\\s+function\\s+${m}\\b`).test(content)) {
      methods.push(m);
    }
  });

  const hasAuth = /getCurrentUser|getSessionUser|requireAdminAuth|requireAuth|verifySessionToken|authMiddleware/.test(content);
  const hasAdmin = /requireAdminAuth|role\s*===\s*['"]ADMIN['"]|role\s*!==\s*['"]ADMIN['"]/.test(content);
  const hasRateLimit = /rateLimit|checkRateLimit|applyRateLimit/.test(content);

  routeMap.set(rel, {
    file,
    endpoint: rel,
    methods,
    hasAuth,
    hasAdmin,
    hasRateLimit,
    content,
  });
});

// 2. Scan all frontend and UI files for fetch calls
const uiFiles = getAllFiles(srcDir, (f) => /\.(tsx|ts|jsx|js)$/.test(f) && !f.includes("src[\\/]app[\\/]api"));

interface FetchCall {
  file: string;
  line: number;
  urlRaw: string;
  method: string;
  resolvedPattern: string;
}

const fetchCalls: FetchCall[] = [];

uiFiles.forEach((file) => {
  if (file.includes(path.join("src", "app", "api"))) return;
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    // Look for fetch("/api/..." or fetch(`/api/...`
    const fetchMatches = line.matchAll(/fetch\s*\(\s*[`"'](\/api\/[^`"'\?]+)([^`"']*)?[`"']/g);
    for (const match of fetchMatches) {
      const urlRaw = match[1];
      // Try to determine method if on same line or nearby
      let method = "GET";
      const surrounding = lines.slice(idx, idx + 8).join(" ");
      const methodMatch = surrounding.match(/method\s*:\s*['"](POST|PUT|PATCH|DELETE|GET)['"]/i);
      if (methodMatch) {
        method = methodMatch[1].toUpperCase();
      }
      fetchCalls.push({
        file,
        line: idx + 1,
        urlRaw,
        method,
        resolvedPattern: urlRaw,
      });
    }
  });
});

console.log(`Found ${fetchCalls.length} fetch() invocations in frontend code.`);

// 3. Match fetch calls against routeMap
const brokenFetches: any[] = [];
const methodMismatches: any[] = [];

function matchRoute(calledUrl: string): RouteInfo | undefined {
  // exact match
  if (routeMap.has(calledUrl)) return routeMap.get(calledUrl);

  // parameter match: e.g. /api/admin/users/123 -> /api/admin/users/[id]
  for (const [endpoint, info] of routeMap.entries()) {
    const parts = endpoint.split("/");
    const calledParts = calledUrl.split("/");
    if (parts.length !== calledParts.length) continue;

    let matched = true;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith("[") && parts[i].endsWith("]")) {
        continue; // wild-card matches param
      }
      if (parts[i] !== calledParts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return info;
  }
  return undefined;
}

fetchCalls.forEach((fc) => {
  const matched = matchRoute(fc.urlRaw);
  if (!matched) {
    brokenFetches.push(fc);
  } else {
    if (!matched.methods.includes(fc.method)) {
      methodMismatches.push({
        ...fc,
        routeFile: matched.file,
        availableMethods: matched.methods,
      });
    }
  }
});

console.log(`Broken Fetches (404s): ${brokenFetches.length}`);
brokenFetches.slice(0, 20).forEach((bf) => {
  console.log(`  [404] ${bf.file.replace(/.*src[\\\/]/, "")}:${bf.line} calls ${bf.urlRaw} [${bf.method}]`);
});

console.log(`Method Mismatches (405s): ${methodMismatches.length}`);
methodMismatches.forEach((mm) => {
  console.log(`  [405] ${mm.file.replace(/.*src[\\\/]/, "")}:${mm.line} calls ${mm.urlRaw} with ${mm.method}, but route only provides [${mm.availableMethods.join(",")}]`);
});

// 4. Audit Webhook Security & Signatures
const webhookRoutes = Array.from(routeMap.entries()).filter(([ep]) => ep.includes("webhook"));
console.log(`\nWebhook routes: ${webhookRoutes.length}`);
webhookRoutes.forEach(([ep, info]) => {
  const hasSignature = /signature|crypto|verify|hmac|secret/i.test(info.content);
  console.log(`  ${ep}: hasSignatureCheck=${hasSignature}`);
});

// 5. Audit Public Routes & Mutating Routes without Auth
console.log("\nAuditing Public Mutating Endpoints:");
Array.from(routeMap.entries()).forEach(([ep, info]) => {
  const hasMutate = info.methods.some((m) => ["POST", "PUT", "PATCH", "DELETE"].includes(m));
  if (hasMutate && !info.hasAuth) {
    const isPublicIntended = /login|register|forgot-password|admission|verify|feedback|contact|search|apply/i.test(ep);
    console.log(`  Mutating without auth: ${ep} (intended public: ${isPublicIntended})`);
  }
});
