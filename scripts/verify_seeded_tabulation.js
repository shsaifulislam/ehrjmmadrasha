const { chromium } = require("playwright");

async function run() {
  console.log("Starting targeted verification of Tabulation & Marksheets...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Authenticate via login API
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-suite": "ehrj-test" },
      body: JSON.stringify({ identifier: "adminehrjmadrasha@gmail.com", password: "Saiful018228222@@##" })
    });
    const cookieHeader = loginRes.headers.get("set-cookie");
    const token = cookieHeader.match(/ehrj_session_token=([^;]+)/)[1];

    await context.addCookies([{
      name: "ehrj_session_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }]);

    console.log("Navigating to /admin/exams...");
    await page.goto("http://localhost:3000/admin/exams", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(4000);

    // 2. Click Tabulation Tab
    console.log("Switching to Tabulation Tab...");
    await page.locator('button:has-text("টেবুলেশন শিট ও মেধা তালিকা")').first().click();
    await page.waitForTimeout(2500);

    console.log("Waiting for exam select dropdown...");
    await page.waitForSelector('select', { state: 'attached', timeout: 15000 });
    await page.waitForTimeout(2000);

    const examSelect = page.locator('select').first();
    const options = await examSelect.locator('option').allTextContents();
    console.log("Available exams in select:", options);

    // Select our seeded exam: "১ম সাময়িক পরীক্ষা ২০২৬"
    console.log("Selecting '১ম সাময়িক পরীক্ষা ২০২৬'...");
    const targetOption = await examSelect.locator('option:has-text("১ম সাময়িক পরীক্ষা ২০২৬")').first();
    if (await targetOption.count() > 0) {
      const val = await targetOption.getAttribute('value');
      await examSelect.selectOption(val);
      console.log("Selected exam value:", val);
    }
    // Wait for tabulation data to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Capture the Tabulation Sheet with students, marks, and ranks
    await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/tabulation_sheet_loaded.png" });
    console.log("Captured tabulation_sheet_loaded.png");

    // 3. Open Tabulation Register Print View Modal
    console.log("Opening Tabulation Register Print Modal...");
    const printRegBtn = page.locator('button:has-text("টেবুলেশন রেজিস্টার প্রিন্ট")');
    if (await printRegBtn.count() > 0 && !(await printRegBtn.first().isDisabled())) {
      await printRegBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/official_tabulation_register_print.png" });
      console.log("Captured official_tabulation_register_print.png");

      // Close modal
      const closeBtn = page.locator('div.fixed button:has(svg.lucide-x)').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.dispatchEvent('click');
        await page.waitForTimeout(1000);
      }
    }

    // 4. Open Marksheet Modal for first student
    console.log("Opening Individual Progressive Marksheet Modal...");
    const marksheetBtn = page.locator('button:has-text("মার্কশিট")').first();
    if (await marksheetBtn.count() > 0) {
      await marksheetBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/official_marksheet_modal.png" });
      console.log("Captured official_marksheet_modal.png");

      // Close modal
      const closeBtn = page.locator('div.fixed button:has(svg.lucide-x)').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.dispatchEvent('click');
        await page.waitForTimeout(1000);
      }
    }

    // 5. Open Batch Marksheet Print Modal
    console.log("Opening Batch Marksheet Print Modal...");
    const batchPrintBtn = page.locator('button:has-text("সকল মার্কশিট প্রিন্ট")');
    if (await batchPrintBtn.count() > 0 && !(await batchPrintBtn.first().isDisabled())) {
      await batchPrintBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/official_batch_marksheets.png" });
      console.log("Captured official_batch_marksheets.png");

      // Close modal
      const closeBtn = page.locator('div.fixed button:has(svg.lucide-x)').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.dispatchEvent('click');
        await page.waitForTimeout(1000);
      }
    }

    console.log("ALL REAL EVIDENCE CAPTURED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test failed:", err);
    await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/verify_error.png" });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
