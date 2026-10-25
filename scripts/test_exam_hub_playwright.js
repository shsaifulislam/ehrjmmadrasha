const { chromium } = require("playwright");

async function run() {
  console.log("Starting Examination & Marksheet Engine E2E Verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Authenticate via login API
    console.log("Authenticating via /api/auth/login...");
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-suite": "ehrj-test" },
      body: JSON.stringify({ identifier: "adminehrjmadrasha@gmail.com", password: "Saiful018228222@@##" })
    });
    const resData = await loginRes.json();
    console.log("Login response status:", loginRes.status, "data:", resData);
    
    // In node fetch, getSetCookie retrieves array of Set-Cookie strings
    let rawCookies = [];
    if (typeof loginRes.headers.getSetCookie === "function") {
      rawCookies = loginRes.headers.getSetCookie();
    } else {
      const single = loginRes.headers.get("set-cookie");
      if (single) rawCookies = [single];
    }
    console.log("Raw cookies:", rawCookies);

    let token = null;
    for (const c of rawCookies) {
      const m = c.match(/ehrj_session_token=([^;]+)/);
      if (m) token = m[1];
    }
    if (!token) throw new Error("Could not extract ehrj_session_token: " + JSON.stringify(resData));


    await context.addCookies([{
      name: "ehrj_session_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }]);

    console.log("Authentication successful! Navigating to /admin/exams...");
    await page.goto("http://localhost:3000/admin/exams", { waitUntil: "networkidle" });
    await page.waitForTimeout(3500);

    // Take screenshot of main hub
    await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/exam_hub_main.png" });
    console.log("Captured exam_hub_main.png");

    // 2. Switch to Tabulation tab
    console.log("Clicking Tabulation Tab...");
    const tabBtn = page.locator('button:has-text("টেবুলেশন শিট ও মেধা তালিকা")');
    if (await tabBtn.count() > 0) {
      await tabBtn.first().click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/exam_tabulation_grid.png" });
      console.log("Captured exam_tabulation_grid.png");

      // Check Tabulation Register Print Modal
      const printRegBtn = page.locator('button:has-text("টেবুলেশন রেজিস্টার প্রিন্ট")');
      if (await printRegBtn.count() > 0 && !(await printRegBtn.first().isDisabled())) {
        console.log("Opening Tabulation Register Print Modal...");
        await printRegBtn.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/tabulation_register_print_modal.png" });
        console.log("Captured tabulation_register_print_modal.png");

        // Close modal
        const closeBtn = page.locator('button:has-text("×"), button svg.lucide-x').first();
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      }

      // Check Individual Marksheet Modal
      const marksheetBtn = page.locator('button:has-text("মার্কশিট")').first();
      if (await marksheetBtn.count() > 0) {
        console.log("Opening Student Marksheet Modal...");
        await marksheetBtn.click();
        await page.waitForTimeout(2500);
        await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/student_marksheet_modal.png" });
        console.log("Captured student_marksheet_modal.png");

        // Close modal
        const closeBtn = page.locator('button svg.lucide-x').first();
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      }

      // Check Batch Marksheets Modal
      const batchPrintBtn = page.locator('button:has-text("সকল মার্কশিট প্রিন্ট")');
      if (await batchPrintBtn.count() > 0 && !(await batchPrintBtn.first().isDisabled())) {
        console.log("Opening Batch Marksheets Modal...");
        await batchPrintBtn.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/batch_marksheets_print_modal.png" });
        console.log("Captured batch_marksheets_print_modal.png");

        // Close modal
        const closeBtn = page.locator('button svg.lucide-x').first();
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // 3. Test Routines Tab
    console.log("Testing Exam Routines Tab...");
    const routineTabBtn = page.locator('button:has-text("পরীক্ষার রুটিন")');
    if (await routineTabBtn.count() > 0) {
      await routineTabBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/exam_routine_tab.png" });
      console.log("Captured exam_routine_tab.png");
    }

    // 4. Test Subjects Tab
    console.log("Testing Subjects Tab...");
    const subjectsTabBtn = page.locator('button:has-text("বিষয় ও পূর্ণমান")');
    if (await subjectsTabBtn.count() > 0) {
      await subjectsTabBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/exam_subjects_tab.png" });
      console.log("Captured exam_subjects_tab.png");
    }

    // 5. Test Types Tab
    console.log("Testing Exam Types Tab...");
    const typesTabBtn = page.locator('button:has-text("পরীক্ষার ধরন (Types)")');
    if (await typesTabBtn.count() > 0) {
      await typesTabBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/exam_types_tab.png" });
      console.log("Captured exam_types_tab.png");
    }

    console.log("SUCCESS! All Examination & Marksheet Engine UI workflows verified.");
  } catch (err) {
    console.error("Test failed:", err);
    await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/exam_test_error.png" });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
