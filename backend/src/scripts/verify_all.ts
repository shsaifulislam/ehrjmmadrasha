import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function runMasterVerificationSuite() {
  const startTime = Date.now();
  console.log("=================================================");
  console.log("🏆 STARTING CONSOLIDATED ERP MASTER VERIFICATION SUITE (ALL MODULES)");
  console.log("=================================================\n");

  const scripts = [
    { name: "Student Core", file: "src/scripts/verify_student_flow.ts", assertions: 4 },
    { name: "Guardian Core", file: "src/scripts/verify_guardian_flow.ts", assertions: 4 },
    { name: "Academic & Routine", file: "src/scripts/verify_academic_flow.ts", assertions: 4 },
    { name: "Finance & Fee Core", file: "src/scripts/verify_finance_flow.ts", assertions: 5 },
    { name: "Exam & Result Engine", file: "src/scripts/verify_exam_flow.ts", assertions: 4 },
    { name: "Hostel, Bazar & Meal", file: "src/scripts/verify_hostel_bazar_flow.ts", assertions: 4 },
    { name: "Staff & Payroll Core", file: "src/scripts/verify_staff_payroll_flow.ts", assertions: 4 },
    { name: "Notice, Event & SMS", file: "src/scripts/verify_notice_event_flow.ts", assertions: 4 },
    { name: "Inventory & Asset", file: "src/scripts/verify_inventory_flow.ts", assertions: 4 },
    { name: "System Regression R1", file: "src/scripts/verify_full_system_regression.ts", assertions: 7 },
  ];

  let passedCount = 0;
  let failedCount = 0;
  let totalPassedAssertions = 0;
  const totalTargetAssertions = scripts.reduce((sum, s) => sum + s.assertions, 0);

  const results: { name: string; status: "PASS ✅" | "FAIL ❌"; error?: string }[] = [];

  const tsNodeBin = process.platform === "win32"
    ? ".\\node_modules\\.bin\\ts-node.cmd"
    : "./node_modules/.bin/ts-node";

  for (const s of scripts) {
    console.log(`⏳ Executing: ${s.name} (${s.file})...`);
    try {
      execSync(`${tsNodeBin} ${s.file}`, {
        cwd: process.cwd(),
        env: process.env,
        stdio: "inherit",
      });
      results.push({ name: s.name, status: "PASS ✅" });
      passedCount++;
      totalPassedAssertions += s.assertions;
    } catch (err: any) {
      const errDetail = err.stderr ? err.stderr.toString() : (err.message || String(err));
      console.error(`❌ Verification Failed for ${s.name}:`, errDetail);
      results.push({ name: s.name, status: "FAIL ❌", error: errDetail });
      failedCount++;
    }
  }

  const durationSec = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(durationSec / 60).toString().padStart(2, "0");
  const seconds = (durationSec % 60).toString().padStart(2, "0");

  console.log("\n====================================");
  console.log("MASTER ERP VERIFICATION SUMMARY");
  console.log("====================================\n");

  results.forEach((r) => {
    const padName = r.name.padEnd(23, ".");
    console.log(`${padName}${r.status}`);
  });

  console.log("\n------------------------------------");
  console.log(`Assertions: ${totalPassedAssertions} / ${totalTargetAssertions} PASS`);
  console.log(`Duration: 00:${minutes}:${seconds}`);
  console.log(`Exit Code: ${failedCount === 0 ? 0 : 1}`);
  console.log("====================================\n");

  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      const summaryText = [
        `### 🧪 Master ERP Verification Suite Diagnostics Summary`,
        `- **Assertions Passed:** ${totalPassedAssertions} / ${totalTargetAssertions}`,
        `- **Failed Modules:** ${failedCount}`,
        `- **Execution Duration:** 00:${minutes}:${seconds}`,
        `\n| Module Name | Verification Status | Detailed Error Log |`,
        `| --- | --- | --- |`,
        ...results.map(r => `| **${r.name}** | ${r.status} | \`${(r.error || 'None').replace(/\n/g, ' ')}\` |`)
      ].join('\n') + '\n';
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryText);
    } catch (summaryErr) {
      console.error("Failed to write to GITHUB_STEP_SUMMARY:", summaryErr);
    }
  }

  if (failedCount > 0) {
    process.exit(1);
  }
}

runMasterVerificationSuite();
