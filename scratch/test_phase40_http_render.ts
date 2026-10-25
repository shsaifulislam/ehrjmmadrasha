import { createSessionToken } from "../src/lib/auth";

async function main() {
  console.log("==================================================================");
  console.log("  PHASE 40 LIVE HTTP ROUTE RENDERING VERIFICATION");
  console.log("==================================================================");

  const token = await createSessionToken(
    {
      userId: "4c5e1400-f60d-48a6-b322-849a46eceae7",
      role: "PRINCIPAL",
      name: "মুহতামিম সাহেব",
      username: "principal",
      email: "principal@ehrj.edu.bd",
    },
    { persist: false }
  );

  const routes = [
    { path: "/admin/vendors", label: "Vendor Directory" },
    { path: "/admin/vendors/new", label: "New Vendor Onboarding" },
    { path: "/admin/procurement", label: "Procurement Cockpit" },
    { path: "/admin/contracts", label: "Contract Register" },
    { path: "/admin/contracts/renewals", label: "Contract Renewals" },
    { path: "/admin/procurement/quotations", label: "Quotations Management" },
    { path: "/admin/procurement/evaluations", label: "Procurement Committee Evaluations" },
  ];

  let passed = 0;

  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r.path}`, {
        headers: { Cookie: `ehrj_session=${token}` },
      });
      const html = await res.text();
      const statusOk = res.status === 200;
      const hasContent =
        html.includes("ইলিয়টগঞ্জ") ||
        html.includes("মাদরাসা") ||
        html.includes("ভেন্ডর") ||
        html.includes("চুক্তি") ||
        html.includes("দরপত্র") ||
        html.includes("EHRJ");

      if (statusOk && hasContent) {
        console.log(`  ✅ [PASS] ${r.label} (${r.path}) -> Status: ${res.status} OK | Size: ${html.length} chars`);
        passed++;
      } else {
        console.error(`  ❌ [FAIL] ${r.label} (${r.path}) -> Status: ${res.status} | Content OK: ${hasContent}`);
      }
    } catch (err: any) {
      console.error(`  ❌ [ERROR] ${r.label} (${r.path}): ${err.message}`);
    }
  }

  console.log("==================================================================");
  console.log(`  LIVE RENDERING RESULTS: ${passed} / ${routes.length} ROUTES VERIFIED 200 OK`);
  console.log("==================================================================");

  if (passed === routes.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
