const { chromium } = require('playwright-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function audit() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });

  // Compare desktop
  console.log('=== DESKTOP AUDIT (1280x800) ===');
  const refContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const refPage = await refContext.newPage();
  await refPage.goto('https://misemealplanner.com/', { waitUntil: 'networkidle' });

  const localContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const localPage = await localContext.newPage();
  await localPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  async function getMetrics(page, isRef) {
    return await page.evaluate((isRef) => {
      function get(sel) {
        const el = document.querySelector(sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          color: style.color,
          backgroundColor: style.backgroundColor,
          padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
          margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
          borderRadius: style.borderRadius,
          boxShadow: style.boxShadow,
          transform: style.transform,
        };
      }

      // Selectors to check
      return {
        nav: get('header.nav') || get('header'),
        navInner: get('.nav-inner') || get('header > div'),
        brand: get('.brand') || get('header a[aria-label*="home"]'),
        brandImg: get('.brand img') || get('header a[aria-label*="home"] img'),
        navLinks: get('.nav-links') || get('nav.hidden'),
        navCtaBtn: get('.nav-cta .btn--primary') || get('header a[href*="login"], header a[href*="plan"]'),
        langBtn: get('#langBtn') || get('header button[aria-haspopup="listbox"]'),
        hero: get('.hero') || get('section.hero'),
        heroH1: get('.hero h1'),
        heroAccent: get('.hero .accent'),
        heroSub: get('.hero-sub') || get('.hero p'),
        heroEyebrow: get('.eyebrow') || get('.hero span[class*="rounded"]'),
        phoneFront: get('.phone-wrap--front .phone, .phone-frame--hero, .hero .relative .z-10'),
        howSection: get('#how'),
        featuresSection: get('#features'),
        vibesSection: get('#vibes'),
        reviewsSection: get('#reviews'),
        faqSection: get('#faq'),
        ctaSection: get('section:has(.cta-banner), section:has(.cta), #download'),
        footer: get('footer'),
      };
    }, isRef);
  }

  const refMetrics = await getMetrics(refPage, true);
  const localMetrics = await getMetrics(localPage, false);

  console.log('--- NAV METRICS ---');
  console.log('REF NAV:', refMetrics.nav);
  console.log('LOCAL NAV:', localMetrics.nav);

  console.log('--- BRAND LOGO METRICS ---');
  console.log('REF BRAND:', refMetrics.brand);
  console.log('LOCAL BRAND:', localMetrics.brand);
  console.log('REF BRAND IMG:', refMetrics.brandImg);
  console.log('LOCAL BRAND IMG:', localMetrics.brandImg);

  console.log('--- HERO H1 METRICS ---');
  console.log('REF H1:', refMetrics.heroH1);
  console.log('LOCAL H1:', localMetrics.heroH1);

  console.log('--- HERO ACCENT METRICS ---');
  console.log('REF ACCENT:', refMetrics.heroAccent);
  console.log('LOCAL ACCENT:', localMetrics.heroAccent);

  console.log('--- HERO SUBTITLE METRICS ---');
  console.log('REF SUB:', refMetrics.heroSub);
  console.log('LOCAL SUB:', localMetrics.heroSub);

  console.log('--- HERO EYEBROW METRICS ---');
  console.log('REF EYEBROW:', refMetrics.heroEyebrow);
  console.log('LOCAL EYEBROW:', localMetrics.heroEyebrow);

  console.log('--- SECTIONS PADDING & HEIGHTS ---');
  ['howSection', 'featuresSection', 'vibesSection', 'reviewsSection', 'faqSection', 'ctaSection', 'footer'].forEach(s => {
    console.log(`[${s}] REF height: ${refMetrics[s]?.height}, padding: ${refMetrics[s]?.padding}, bg: ${refMetrics[s]?.backgroundColor}`);
    console.log(`[${s}] LOCAL height: ${localMetrics[s]?.height}, padding: ${localMetrics[s]?.padding}, bg: ${localMetrics[s]?.backgroundColor}`);
  });

  // Now Mobile Viewport (390x844)
  console.log('\n=== MOBILE AUDIT (390x844) ===');
  await refPage.setViewportSize({ width: 390, height: 844 });
  await localPage.setViewportSize({ width: 390, height: 844 });

  const refMobileMetrics = await getMetrics(refPage, true);
  const localMobileMetrics = await getMetrics(localPage, false);

  console.log('REF MOBILE NAV:', refMobileMetrics.nav);
  console.log('LOCAL MOBILE NAV:', localMobileMetrics.nav);
  console.log('REF MOBILE BRAND:', refMobileMetrics.brand);
  console.log('LOCAL MOBILE BRAND:', localMobileMetrics.brand);
  console.log('REF MOBILE BRAND IMG:', refMobileMetrics.brandImg);
  console.log('LOCAL MOBILE BRAND IMG:', localMobileMetrics.brandImg);

  await browser.close();
}

audit().catch(console.error);
