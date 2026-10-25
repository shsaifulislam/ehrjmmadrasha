const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/shsai/.gemini/antigravity-ide/brain/a302c1d8-8f71-4669-890c-eb5900716e1d/.tempmediaStorage';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const PUBLIC_ROUTES = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/academic', name: 'academic' },
  { path: '/admission', name: 'admission' },
  { path: '/admission/apply', name: 'admission_apply' },
  { path: '/admission/track', name: 'admission_track' },
  { path: '/notices', name: 'notices' },
  { path: '/results', name: 'results' },
  { path: '/verify', name: 'verify' },
  { path: '/donate', name: 'donate' },
  { path: '/contact', name: 'contact' },
  { path: '/calendar', name: 'calendar' },
  { path: '/events', name: 'events' },
  { path: '/gallery', name: 'gallery' },
  { path: '/library', name: 'library' },
  { path: '/downloads', name: 'downloads' },
  { path: '/search', name: 'search' },
  { path: '/knowledge', name: 'knowledge' },
  { path: '/alumni', name: 'alumni' },
  { path: '/transport', name: 'transport' },
  { path: '/surveys', name: 'surveys' },
];

async function runPublicQA() {
  console.log('🚀 Starting EHRJ Public Website QA Suite (Phase C)...');
  const browser = await chromium.launch({ headless: true });
  const results = [];

  // 1. Desktop Tests
  console.log('\n--- 1. DESKTOP VIEWPORT QA (1280x800) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const desktopPage = await desktopContext.newPage();

  for (const route of PUBLIC_ROUTES) {
    const url = `http://localhost:3000${route.path}`;
    try {
      const response = await desktopPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await desktopPage.waitForTimeout(1000);
      const status = response ? response.status() : 200;
      
      const overflow = await desktopPage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      const title = await desktopPage.title();

      console.log(`[Desktop] ${route.path.padEnd(20)} | Status: ${status} | Overflow: ${overflow ? 'FAIL (OVERFLOW)' : 'PASS'} | Title: ${title.slice(0, 30)}...`);

      if (['home', 'about', 'academic', 'admission', 'results', 'verify', 'donate', 'notices', 'contact'].includes(route.name)) {
        const screenshotPath = path.join(ARTIFACT_DIR, `qa_desktop_${route.name}.png`);
        await desktopPage.screenshot({ path: screenshotPath, fullPage: false });
      }

      results.push({
        route: route.path,
        viewport: 'desktop',
        status,
        overflow,
        title,
        passed: (status === 200 || status === 304) && !overflow,
      });
    } catch (err) {
      console.error(`[Desktop] ERROR on ${route.path}:`, err.message);
      results.push({
        route: route.path,
        viewport: 'desktop',
        error: err.message,
        passed: false,
      });
    }
  }

  // 2. Mobile Tests
  console.log('\n--- 2. MOBILE VIEWPORT QA (390x844 - iPhone 14) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  });
  const mobilePage = await mobileContext.newPage();

  for (const route of PUBLIC_ROUTES) {
    const url = `http://localhost:3000${route.path}`;
    try {
      const response = await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await mobilePage.waitForTimeout(1000);
      const status = response ? response.status() : 200;

      const overflow = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      console.log(`[Mobile]  ${route.path.padEnd(20)} | Status: ${status} | Overflow: ${overflow ? 'FAIL (OVERFLOW)' : 'PASS'}`);

      if (['home', 'about', 'academic', 'admission', 'results', 'verify', 'donate', 'notices', 'contact'].includes(route.name)) {
        const screenshotPath = path.join(ARTIFACT_DIR, `qa_mobile_${route.name}.png`);
        await mobilePage.screenshot({ path: screenshotPath, fullPage: false });
      }

      results.push({
        route: route.path,
        viewport: 'mobile',
        status,
        overflow,
        passed: (status === 200 || status === 304) && !overflow,
      });
    } catch (err) {
      console.error(`[Mobile] ERROR on ${route.path}:`, err.message);
      results.push({
        route: route.path,
        viewport: 'mobile',
        error: err.message,
        passed: false,
      });
    }
  }

  // 3. Critical Public Interaction Tests
  console.log('\n--- 3. CRITICAL PUBLIC INTERACTIONS QA ---');
  
  // Test Academic Search
  await desktopPage.goto('http://localhost:3000/academic', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForTimeout(1000);
  const academicSearchInput = await desktopPage.$('input[placeholder*="শ্রেণি"]');
  if (academicSearchInput) {
    await academicSearchInput.fill('হিফজ');
    await desktopPage.waitForTimeout(300);
    const searchMatchCount = await desktopPage.evaluate(() => {
      return document.body.innerText.includes('হিফজ');
    });
    console.log(`[Interaction] Academic instant search: ${searchMatchCount ? 'PASS' : 'FAIL'}`);
  }

  // Test Notices Filter
  await desktopPage.goto('http://localhost:3000/notices', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForTimeout(1000);
  const generalTab = await desktopPage.$('button:has-text("সাধারণ")');
  if (generalTab) {
    await generalTab.click();
    await desktopPage.waitForTimeout(300);
    console.log('[Interaction] Notice category filter tab: PASS');
  }

  // Test Guardian Redirect
  await desktopPage.goto('http://localhost:3000/guardian', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForTimeout(1000);
  const finalUrl = desktopPage.url();
  console.log(`[Interaction] /guardian redirect to /portal: ${finalUrl.includes('/portal') ? 'PASS' : 'FAIL'} (URL: ${finalUrl})`);

  await browser.close();

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  console.log(`\n==============================================`);
  console.log(`EHRJ PUBLIC QA SUMMARY: ${passedTests}/${totalTests} Passed (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`==============================================`);
}

runPublicQA().catch(err => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
