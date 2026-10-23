const { chromium } = require('playwright-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureAfter() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });

  // 1. Desktop 1280x800
  console.log('Capturing local desktop 1280x800...');
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: 'docs/screenshots/audit/local-desktop-viewport-after.png' });
  await desktopPage.screenshot({ path: 'docs/screenshots/audit/local-desktop-full-after.png', fullPage: true });

  // 2. Mobile 390x844
  console.log('Capturing local mobile 390x844...');
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await mobilePage.screenshot({ path: 'docs/screenshots/audit/local-mobile-viewport-after.png' });
  await mobilePage.screenshot({ path: 'docs/screenshots/audit/local-mobile-full-after.png', fullPage: true });

  // Also update docs/screenshots/desktop-homepage.png and mobile-homepage.png for docs consistency
  await desktopPage.screenshot({ path: 'docs/screenshots/desktop-homepage.png' });
  await mobilePage.screenshot({ path: 'docs/screenshots/mobile-homepage.png' });

  await browser.close();
  console.log('Finished capturing after screenshots!');
}

captureAfter().catch(console.error);
