import { chromium, Browser, Page } from "playwright";
import * as path from "path";
import * as fs from "fs";

interface AuditResult {
  tab: string;
  url: string;
  status: "OK" | "WARNING" | "ERROR";
  consoleErrors: string[];
  failedRequests: string[];
  renderTimeMs: number;
  screenshotName: string;
  notes: string[];
}

async function auditAdminPanel() {
  console.log("=== STARTING DEEP COMPREHENSIVE ADMIN PANEL AUDIT ===");

  const artifactDir = "C:\\Users\\shsai\\.gemini\\antigravity-ide\\brain\\a302c1d8-8f71-4669-890c-eb5900716e1d";
  const screenshotsDir = path.join(artifactDir, "audit_screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page: Page = await context.newPage();

  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(`[Console Error]: ${msg.text()}`);
    }
  });

  page.on("requestfailed", (req) => {
    // ignore favicon or analytics
    if (!req.url().includes("favicon")) {
      failedRequests.push(`[Request Failed]: ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    }
  });

  // 1. Login
  console.log("\n[1] Logging into Admin Panel...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.fill('input[type="text"], input[name="identifier"], input[placeholder*="ইমেইল"]', "admin@ehrj.edu.bd");
  await page.fill('input[type="password"]', "Saiful018228222@@##");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin**", { timeout: 15000 });
  console.log("✓ Logged in successfully. Current URL:", page.url());

  const auditLog: AuditResult[] = [];

  // All Admin Tabs to systematically probe
  const tabsToAudit = [
    { id: "DASHBOARD", name: "ড্যাশবোর্ড (Dashboard)" },
    { id: "TEACHERS", name: "উস্তাদ ও শিক্ষকবৃন্দ (Teachers)" },
    { id: "STUDENTS", name: "শিক্ষার্থী তালিকা (Students)" },
    { id: "ADMISSION", name: "ভর্তি আবেদন ও ডেস্ক (Admissions)" },
    { id: "ACADEMIC", name: "একাডেমিক ও জামাত (Academics)" },
    { id: "ATTENDANCE", name: "হাজিরা ককপিট (Attendance)" },
    { id: "EXAMINATION", name: "পরীক্ষা ও ফলাফল (Exams)" },
    { id: "FINANCE", name: "হিসাব ও ফি কালেকশন (Finance)" },
    { id: "DONATIONS", name: "অনলাইন দান ও যাকাত (Donations)" },
    { id: "PAYMENTS", name: "পেমেন্ট মেথড কনসোল (Payment Methods)" },
    { id: "BUDGETS", name: "ইনস্টিটিউশনাল বাজেট (Budgets)" },
    { id: "PROCUREMENT", name: "প্রকিউরমেন্ট ও সরবরাহকারী (Procurement)" },
    { id: "DOCUMENTS", name: "সনদ ও প্রত্যয়নপত্র (Document Factory)" },
    { id: "COMMUNICATION", name: "বার্তা ও নোটিফিকেশন (Communication)" },
    { id: "CMS", name: "ওয়েবসাইট CMS ও নোটিশ (CMS & Notices)" },
    { id: "LIBRARY", name: "কিতাবখানা ও লাইব্রেরি (Library)" },
    { id: "HOSTEL", name: "হোস্টেল ও আবাসন (Hostel)" },
    { id: "TRANSPORT", name: "পরিবহন ব্যবস্থাপনা (Transport)" },
    { id: "INVENTORY", name: "ইনভেন্টরি ও সম্পদ (Inventory)" },
    { id: "HR", name: "এইচআর ও শিক্ষক স্টাফ (HR)" },
    { id: "HELPDESK", name: "হেল্পডেস্ক ও অভিযোগ (Helpdesk)" },
    { id: "REPORTS", name: "রিপোর্ট ও অ্যানালিটিক্স (Reports)" },
    { id: "OPERATIONS", name: "সিস্টেম অপারেশন ও ব্যাকআপ (Operations)" },
    { id: "USERS", name: "ইউজার ও উস্তাদ অ্যাকাউন্ট (Users)" },
    { id: "SETTINGS", name: "প্রতিষ্ঠান সেটিংস (Settings)" },
  ];

  for (let i = 0; i < tabsToAudit.length; i++) {
    const tab = tabsToAudit[i];
    console.log(`\n[${i + 2}/${tabsToAudit.length + 1}] Auditing Module: ${tab.name} (${tab.id})...`);
    
    // Clear per-tab error tracking
    const currentTabConsoleErrors: string[] = [];
    const currentTabFailedRequests: string[] = [];

    const consoleHandler = (msg: any) => {
      if (msg.type() === "error") {
        currentTabConsoleErrors.push(`[Console Error]: ${msg.text()}`);
      }
    };
    const requestFailedHandler = (req: any) => {
      if (!req.url().includes("favicon")) {
        currentTabFailedRequests.push(`[Request Failed]: ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
      }
    };

    page.on("console", consoleHandler);
    page.on("requestfailed", requestFailedHandler);

    const startTime = Date.now();
    try {
      await page.goto(`http://localhost:3000/admin?tab=${tab.id}`, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(1200); // Allow dynamic rendering and animations to settle
    } catch (err: any) {
      console.error(`Error navigating to ${tab.id}:`, err.message);
      currentTabFailedRequests.push(`Navigation error: ${err.message}`);
    }
    const renderTimeMs = Date.now() - startTime;

    const screenshotFileName = `audit_tab_${tab.id.toLowerCase()}.png`;
    const screenshotFilePath = path.join(screenshotsDir, screenshotFileName);
    await page.screenshot({ path: screenshotFilePath, fullPage: false });

    // Collect notes and DOM checks
    const notes: string[] = [];

    // Check if error boundary or empty state appears
    const hasCrashError = await page.locator('text="Application error"').count() > 0;
    const hasServerError = await page.locator('text="Internal Server Error"').count() > 0;
    const hasChunkError = await page.locator('text="ChunkLoadError"').count() > 0;

    if (hasCrashError || hasServerError || hasChunkError) {
      notes.push("CRITICAL: Page crashed or displayed error boundary.");
    }

    // Check module interactive presence
    const buttonsCount = await page.locator("button").count();
    const tablesCount = await page.locator("table").count();
    const inputsCount = await page.locator("input, select, textarea").count();
    const cardsCount = await page.locator(".rounded-xl, .rounded-2xl, .card").count();
    notes.push(`Interactive density: ${buttonsCount} buttons, ${tablesCount} tables, ${inputsCount} form inputs, ${cardsCount} container cards`);

    // Status determined
    let status: "OK" | "WARNING" | "ERROR" = "OK";
    if (hasCrashError || hasServerError || hasChunkError) {
      status = "ERROR";
    } else if (currentTabConsoleErrors.length > 0 || currentTabFailedRequests.length > 0) {
      status = "WARNING";
    }

    auditLog.push({
      tab: tab.id,
      url: page.url(),
      status,
      consoleErrors: [...currentTabConsoleErrors],
      failedRequests: [...currentTabFailedRequests],
      renderTimeMs,
      screenshotName: screenshotFileName,
      notes,
    });

    page.off("console", consoleHandler);
    page.off("requestfailed", requestFailedHandler);

    console.log(`✓ ${tab.id} rendered in ${renderTimeMs}ms. Status: ${status} (Console Errors: ${currentTabConsoleErrors.length}, Failed Reqs: ${currentTabFailedRequests.length})`);
  }

  // Mobile Responsiveness Test (390 x 844)
  console.log("\n[Mobile Test] Testing Admin Dashboard on Mobile Viewport (iPhone 14 - 390x844)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/admin?tab=DASHBOARD", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, "audit_mobile_dashboard.png") });
  console.log("✓ Saved audit_mobile_dashboard.png");

  // Mobile Hamburger Menu Test
  const hamburgerBtn = page.locator('button[title*="মেনু"]').first();
  if (await hamburgerBtn.isVisible()) {
    await hamburgerBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, "audit_mobile_sidebar_open.png") });
    console.log("✓ Saved audit_mobile_sidebar_open.png");
  }

  // Tablet Viewport (768 x 1024)
  console.log("\n[Tablet Test] Testing Admin Dashboard on Tablet Viewport (iPad - 768x1024)...");
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("http://localhost:3000/admin?tab=TEACHERS", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(screenshotsDir, "audit_tablet_teachers.png") });
  console.log("✓ Saved audit_tablet_teachers.png");

  await browser.close();

  // Write audit json
  const auditReportPath = path.join(artifactDir, "audit_full_results.json");
  fs.writeFileSync(auditReportPath, JSON.stringify(auditLog, null, 2), "utf-8");
  console.log(`\n✓ Audit report successfully written to ${auditReportPath}`);
  console.log("=== COMPREHENSIVE AUDIT EXECUTION FINISHED ===");
}

auditAdminPanel().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
