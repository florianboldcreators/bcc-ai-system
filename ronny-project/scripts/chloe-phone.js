const { chromium } = require('playwright');

async function createWithPhone() {
  console.log('=== CHLOE PHONE SIGNUP ===');
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-california_session-chloephone'
    }
  });
  
  const page = await browser.newPage();
  
  // Go to TikTok phone signup
  console.log('Loading TikTok phone signup...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  });
  
  await page.waitForTimeout(4000);
  console.log('Page loaded');
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-phone-signup.png' });
  
  // Look for phone option
  const pageContent = await page.content();
  console.log('Page has phone option:', pageContent.includes('phone') || pageContent.includes('Telefon'));
  
  await page.waitForTimeout(60000);
  await browser.close();
}

createWithPhone().catch(console.error);
