const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-suite": "ehrj-test" },
    body: JSON.stringify({ identifier: "adminehrjmadrasha@gmail.com", password: "Saiful018228222@@##" })
  });
  const cookieHeader = loginRes.headers.get("set-cookie");
  const token = cookieHeader.match(/ehrj_session_token=([^;]+)/)[1];
  await context.addCookies([{ name: "ehrj_session_token", value: token, domain: "localhost", path: "/" }]);

  await page.goto("http://localhost:3000/admin/exams", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  
  await page.locator('button:has-text("ফলাফল ও মার্কশিট জেনারেটর")').click();
  await page.waitForTimeout(2000);

  // Click on the marksheet button of the first student who has marks
  const marksheetBtns = page.locator('table button:has-text("মার্কশিট")');
  console.log("Table marksheet buttons count:", await marksheetBtns.count());
  if (await marksheetBtns.count() > 0) {
    await marksheetBtns.first().click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: "C:/Users/shsai/.gemini/antigravity-ide/brain/e4a38e69-6026-4dd8-ba86-ed7b786c02a0/scratch/official_individual_marksheet_opened.png" });
    console.log("Captured official_individual_marksheet_opened.png");
  }

  await browser.close();
}

main().catch(console.error);
