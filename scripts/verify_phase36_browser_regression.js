const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ARTIFACT_DIR = "C:/Users/shsai/.gemini/antigravity-ide/brain/53abc3cf-2e90-4076-b058-aca352b54810";
const BASE_URL = "http://localhost:3000";

async function loginUser(identifier, password) {
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-suite": "ehrj-test" },
    body: JSON.stringify({ identifier, password })
  });
  const data = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed for ${identifier}: ${JSON.stringify(data)}`);
  
  let rawCookies = [];
  if (typeof loginRes.headers.getSetCookie === "function") {
    rawCookies = loginRes.headers.getSetCookie();
  } else {
    const single = loginRes.headers.get("set-cookie");
    if (single) rawCookies = [single];
  }
  let token = null;
  for (const c of rawCookies) {
    const m = c.match(/ehrj_session_token=([^;]+)/);
    if (m) token = m[1];
  }
  if (!token) throw new Error(`Could not extract token for ${identifier}`);
  return token;
}

async function verifyPageLayout(page) {
  return await page.evaluate(() => {
    const body = document.body;
    const docEl = document.documentElement;
    const scrollWidth = Math.max(body.scrollWidth, docEl.scrollWidth);
    const clientWidth = docEl.clientWidth;
    const hasHorizontalOverflow = scrollWidth > clientWidth + 1;
    
    const h1s = Array.from(document.querySelectorAll("h1")).map(h => h.textContent?.trim());
    const imgs = Array.from(document.querySelectorAll("img"));
    const brokenImgs = imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    
    return {
      scrollWidth,
      clientWidth,
      hasHorizontalOverflow,
      h1Count: h1s.length,
      h1Texts: h1s,
      brokenImgsCount: brokenImgs.length
    };
  });
}

async function runBrowserRegression() {
  console.log("=== Phase 36: Responsive Browser Regression Suite ===");
  const browser = await chromium.launch({ headless: true });
  const results = {
    viewports: {},
    portals: {}
  };

  try {
    // ---------------------------------------------------------
    // 1. DESKTOP VIEWPORT (1440x900)
    // ---------------------------------------------------------
    console.log("\n[1/4] Verifying Desktop (1440x900)...");
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(1500);

    const desktopMetrics = await verifyPageLayout(desktopPage);
    results.viewports.desktop = desktopMetrics;
    const desktopShot = path.join(ARTIFACT_DIR, "p36_desktop_public_home.png");
    await desktopPage.screenshot({ path: desktopShot });
    console.log(`Saved screenshot: p36_desktop_public_home.png`);
    await desktopContext.close();

    // ---------------------------------------------------------
    // 2. TABLET VIEWPORT (768x1024 - iPad)
    // ---------------------------------------------------------
    console.log("\n[2/4] Verifying Tablet Viewport (768x1024)...");
    const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await tabletPage.waitForTimeout(1500);

    const tabletMetrics = await verifyPageLayout(tabletPage);
    results.viewports.tablet = tabletMetrics;
    const tabletShot = path.join(ARTIFACT_DIR, "p36_tablet_public_home.png");
    await tabletPage.screenshot({ path: tabletShot });
    console.log(`Saved screenshot: p36_tablet_public_home.png`);
    await tabletContext.close();

    // ---------------------------------------------------------
    // 3. MOBILE VIEWPORT (390x844 - iPhone 14)
    // ---------------------------------------------------------
    console.log("\n[3/4] Verifying Mobile Viewport (390x844)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1500);

    const mobileMetrics = await verifyPageLayout(mobilePage);
    results.viewports.mobile = mobileMetrics;
    const mobileShot = path.join(ARTIFACT_DIR, "p36_mobile_public_home.png");
    await mobilePage.screenshot({ path: mobileShot });
    console.log(`Saved screenshot: p36_mobile_public_home.png`);
    await mobileContext.close();

    // ---------------------------------------------------------
    // 4. PORTAL REAL WORKFLOW EVIDENCE (ADMIN, TEACHER, GUARDIAN)
    // ---------------------------------------------------------
    console.log("\n[4/4] Capturing Real Portal Workflow Evidence...");

    // 4.1 Admin Overview
    const adminToken = await loginUser("adminehrj", "Saiful018228222@@##");
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await adminContext.addCookies([{
      name: "ehrj_session_token",
      value: adminToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }]);
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(2000);
    const adminShot = path.join(ARTIFACT_DIR, "p36_desktop_admin_overview.png");
    await adminPage.screenshot({ path: adminShot });
    console.log(`Saved screenshot: p36_desktop_admin_overview.png`);
    results.portals.admin = await verifyPageLayout(adminPage);
    await adminContext.close();

    // 4.2 Teacher Roster & Scope
    const teacherToken = await loginUser("teacher", "Teacher@2026!");
    const teacherContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await teacherContext.addCookies([{
      name: "ehrj_session_token",
      value: teacherToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }]);
    const teacherPage = await teacherContext.newPage();
    await teacherPage.goto(`${BASE_URL}/teacher`, { waitUntil: "networkidle" });
    await teacherPage.waitForTimeout(2000);
    const teacherShot = path.join(ARTIFACT_DIR, "p36_desktop_teacher_roster.png");
    await teacherPage.screenshot({ path: teacherShot });
    console.log(`Saved screenshot: p36_desktop_teacher_roster.png`);
    results.portals.teacher = await verifyPageLayout(teacherPage);
    await teacherContext.close();

    // 4.3 Guardian Fees & Ledger
    const guardianToken = await loginUser("guardian_ui_demo", "Guardian@2026!");
    const guardianContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await guardianContext.addCookies([{
      name: "ehrj_session_token",
      value: guardianToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax"
    }]);
    const guardianPage = await guardianContext.newPage();
    await guardianPage.goto(`${BASE_URL}/portal`, { waitUntil: "networkidle" });
    await guardianPage.waitForTimeout(2000);
    const guardianShot = path.join(ARTIFACT_DIR, "p36_desktop_guardian_fees.png");
    await guardianPage.screenshot({ path: guardianShot });
    console.log(`Saved screenshot: p36_desktop_guardian_fees.png`);
    results.portals.guardian = await verifyPageLayout(guardianPage);
    await guardianContext.close();

    console.log("\n=== Browser Regression Summary ===");
    console.log(JSON.stringify(results, null, 2));

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "scratch/p36_browser_regression_results.json"),
      JSON.stringify(results, null, 2)
    );

  } catch (err) {
    console.error("Browser regression encountered an error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBrowserRegression();
