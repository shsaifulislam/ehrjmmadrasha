import { chromium } from 'playwright';
import fs from 'fs';

async function runRuntimeAudit() {
  console.log("=================================================");
  console.log("PHASE 29: PLAYWRIGHT RUNTIME ERROR REGRESSION");
  console.log("=================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Phase29Audit",
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const uncaughtErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out benign favicon or hydration warnings if any
      consoleErrors.push(text);
      console.log(`[Browser Console Error]: ${text}`);
    }
  });

  page.on('pageerror', err => {
    uncaughtErrors.push(err.message);
    console.log(`[Uncaught Page Error]: ${err.message}`);
  });

  page.on('requestfailed', req => {
    // Ignore external analytics / CDNs / font fallbacks if offline
    if (req.url().includes('localhost:3000')) {
      failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
      console.log(`[Failed Request]: ${req.url()} - ${req.failure()?.errorText}`);
    }
  });

  const testReport = [];

  async function checkPage(urlPath, pageName) {
    console.log(`\nTesting page: ${pageName} (${urlPath})...`);
    const initialConsoleCount = consoleErrors.length;
    const initialUncaughtCount = uncaughtErrors.length;

    const response = await page.goto(`http://localhost:3000${urlPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    await page.waitForTimeout(2000);

    const status = response?.status() || 0;
    const pageErrors = uncaughtErrors.slice(initialUncaughtCount);
    const newConsoleErrors = consoleErrors.slice(initialConsoleCount);

    const hasCriticalRuntimeError = pageErrors.some(e => 
      e.includes("Cannot read properties of undefined") || 
      e.includes("ReactCurrentDispatcher") ||
      e.includes("ChunkLoadError")
    );

    const passed = status === 200 && !hasCriticalRuntimeError;

    console.log(`  -> Status: ${status} | Uncaught Errors: ${pageErrors.length} | Console Errors: ${newConsoleErrors.length}`);
    testReport.push({
      pageName,
      urlPath,
      status,
      passed,
      pageErrors,
      newConsoleErrors,
    });

    return passed;
  }

  try {
    // 1. Public Pages
    await checkPage('/', 'Home Landing Page');
    await checkPage('/app', 'Campus Web Application');
    await checkPage('/admission', 'Online Admission');
    await checkPage('/results', 'Public Results Portal');
    await checkPage('/login', 'Universal Login Portal');

    // 2. Language Switcher Regression Test
    console.log("\n--- Testing Language Switcher (Bangla <-> English) ---");
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Initial Lang
    const initialLang = await page.getAttribute('html', 'lang');
    console.log(`Initial documentElement lang: '${initialLang}'`);

    // Find language switcher button
    const langBtn = await page.$('button:has-text("EN"), button:has-text("বাং"), button[aria-label*="ভাষা"], button[aria-label*="language"]');
    
    let langTogglePassed = false;
    let switchedLang = initialLang;
    let revertedLang = initialLang;

    if (langBtn) {
      console.log("Found language switch button. Clicking to toggle language...");
      await langBtn.click();
      await page.waitForTimeout(1500);

      switchedLang = await page.getAttribute('html', 'lang');
      console.log(`After 1st toggle documentElement lang: '${switchedLang}'`);

      // Toggle back
      const langBtn2 = await page.$('button:has-text("EN"), button:has-text("বাং"), button[aria-label*="ভাষা"], button[aria-label*="language"]');
      if (langBtn2) {
        await langBtn2.click();
        await page.waitForTimeout(1500);
        revertedLang = await page.getAttribute('html', 'lang');
        console.log(`After 2nd toggle documentElement lang: '${revertedLang}'`);
      }

      langTogglePassed = switchedLang !== initialLang && revertedLang === initialLang;
    } else {
      console.log("Could not find standard language button selector.");
    }

    testReport.push({
      test: "Language Switcher Toggle Verification",
      passed: langTogglePassed || (switchedLang !== initialLang),
      initialLang,
      switchedLang,
      revertedLang,
    });

    console.log(`Language Switcher Invariant: ${langTogglePassed ? 'PASS' : 'WARN'}`);

  } finally {
    await browser.close();

    const summary = {
      timestamp: new Date().toISOString(),
      totalConsoleErrors: consoleErrors.length,
      totalUncaughtErrors: uncaughtErrors.length,
      totalFailedRequests: failedRequests.length,
      criticalRuntimeErrorCount: uncaughtErrors.filter(e => 
        e.includes("Cannot read properties of undefined") || 
        e.includes("ReactCurrentDispatcher")
      ).length,
      pages: testReport,
    };

    fs.writeFileSync('scratch/runtime_regression_report.json', JSON.stringify(summary, null, 2));
    console.log("\n=================================================");
    console.log(`RUNTIME REGRESSION TEST COMPLETE:`);
    console.log(`  Uncaught Runtime Exceptions: ${summary.totalUncaughtErrors}`);
    console.log(`  Critical Dispatcher / Call Failures: ${summary.criticalRuntimeErrorCount}`);
    console.log(`  Failed Internal Chunks/Requests: ${summary.totalFailedRequests}`);
    console.log("=================================================\n");
  }
}

runRuntimeAudit().catch(err => {
  console.error("Runtime Audit Failed:", err);
  process.exit(1);
});
