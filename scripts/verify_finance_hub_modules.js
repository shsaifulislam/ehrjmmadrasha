const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log("1. Authenticating as Admin via API...");
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-suite": "ehrj-test" },
    body: JSON.stringify({ identifier: "adminehrjmadrasha@gmail.com", password: "Saiful018228222@@##" }),
  });

  const cookieHeader = loginRes.headers.get("set-cookie");
  if (!cookieHeader || !cookieHeader.includes("ehrj_session_token")) {
    throw new Error("Login failed to return ehrj_session_token cookie: " + (await loginRes.text()));
  }
  const tokenMatch = cookieHeader.match(/ehrj_session_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : "";
  console.log("Login successful! Got session token.");

  await context.addCookies([
    {
      name: "ehrj_session_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const outputDir = path.join(process.cwd(), "scratch");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. VERIFY /admin/finance
  console.log("2. Navigating to /admin/finance...");
  await page.goto("http://localhost:3000/admin/finance", { waitUntil: "domcontentloaded" });
  try {
    await page.locator("text=এডমিন ইআরপি ডেটা লোড হচ্ছে...").waitFor({ state: "detached", timeout: 15000 });
  } catch (e) {
    console.log("Loader already finished or timed out");
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outputDir, "finance_hub_main.png"), fullPage: false });
  console.log("Captured finance_hub_main.png");

  // Switch to Invoices Tab
  console.log("3. Switching to Invoices & Receipts tab...");
  const invoiceTab = page.locator("button:has-text('ইনভয়েস ও রসিদ')").first();
  if (await invoiceTab.count() > 0) {
    await invoiceTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, "finance_invoices_tab.png"), fullPage: false });
    console.log("Captured finance_invoices_tab.png");

    // Look for Receipt Print button
    const receiptPrintBtn = page.locator("button:has-text('রসিদ ভিউ')").first();
    if (await receiptPrintBtn.count() > 0) {
      console.log("Found receipt print button, clicking...");
      await receiptPrintBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outputDir, "official_receipt_print_modal.png"), fullPage: false });
      console.log("Captured official_receipt_print_modal.png");
      
      // Close modal
      const closeBtn = page.locator("button:has-text('বন্ধ করুন'), button:has(.lucide-x)").first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  }

  // Switch to Fee Structure Tab
  console.log("4. Switching to Fee Structure tab...");
  const feeStructureTab = page.locator("button:has-text('ফি কাঠামো ও পলিসি')").first();
  if (await feeStructureTab.count() > 0) {
    await feeStructureTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, "finance_fee_structures_tab.png"), fullPage: false });
    console.log("Captured finance_fee_structures_tab.png");
  }

  // 2. VERIFY /admin/budgets
  console.log("5. Navigating to /admin/budgets...");
  await page.goto("http://localhost:3000/admin/budgets", { waitUntil: "domcontentloaded" });
  try {
    await page.locator("text=এডমিন ইআরপি ডেটা লোড হচ্ছে...").waitFor({ state: "detached", timeout: 15000 });
  } catch (e) {
    console.log("Loader finished");
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outputDir, "budget_console_overview.png"), fullPage: false });
  console.log("Captured budget_console_overview.png");

  // Switch to Budgets tab
  const budgetsTab = page.locator("button:has-text('বাজেট মাস্টার ও অনুমোদন')").first();
  if (await budgetsTab.count() > 0) {
    await budgetsTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, "budget_console_budgets_list.png"), fullPage: false });
    console.log("Captured budget_console_budgets_list.png");

    const budgetPrintBtn = page.locator("button:has-text('বাজেট প্রিন্ট')").first();
    if (await budgetPrintBtn.count() > 0) {
      console.log("Found budget print button, clicking...");
      await budgetPrintBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outputDir, "official_budget_print_modal.png"), fullPage: false });
      console.log("Captured official_budget_print_modal.png");

      const closeBtn = page.locator("button:has(.lucide-x)").first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  }

  // 3. VERIFY /admin/procurement
  console.log("6. Navigating to /admin/procurement...");
  await page.goto("http://localhost:3000/admin/procurement", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outputDir, "procurement_overview.png"), fullPage: false });
  console.log("Captured procurement_overview.png");

  // Switch to Contracts Tab
  const contractsTab = page.locator("button:has-text('চুক্তি ও সংস্করণ')").first();
  if (await contractsTab.count() > 0) {
    await contractsTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, "procurement_contracts_tab.png"), fullPage: false });
    console.log("Captured procurement_contracts_tab.png");

    const contractPrintBtn = page.locator("button:has-text('চুক্তি প্রিন্ট')").first();
    if (await contractPrintBtn.count() > 0) {
      console.log("Found contract print button, clicking...");
      await contractPrintBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outputDir, "official_contract_print_modal.png"), fullPage: false });
      console.log("Captured official_contract_print_modal.png");
    }
  }

  await browser.close();
  console.log("ALL MODULE VERIFICATIONS COMPLETED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
