const puppeteer = require('puppeteer-core');

const WS_URL = 'ws://127.0.0.1:39229/devtools/browser/95e60ef6-80c2-4bdc-a55f-1005459b6332';

async function createAccount() {
  console.log('Connecting to GoLogin browser...');
  const browser = await puppeteer.connect({
    browserWSEndpoint: WS_URL,
    ignoreHTTPSErrors: true,
  });

  // Get existing pages
  const pages = await browser.pages();
  console.log(`Found ${pages.length} pages`);
  
  let page = pages[0];
  if (!page) {
    page = await browser.newPage();
  }
  
  console.log('Using page');
  
  try {
    // Navigate
    await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    console.log('Navigated to TikTok');
  } catch (e) {
    console.log('Navigation error:', e.message);
    // Try direct URL
    await page.evaluate(() => {
      window.location.href = 'https://www.tiktok.com/signup/phone-or-email/email';
    });
    await new Promise(r => setTimeout(r, 5000));
  }
  
  // Screenshot
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-page.png' });
  console.log('Screenshot saved to logs/chloe-page.png');
  
  // Get page content
  const title = await page.title();
  console.log('Page title:', title);
}

createAccount().catch(e => console.error('Error:', e.message));
