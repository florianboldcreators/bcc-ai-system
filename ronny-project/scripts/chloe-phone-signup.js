const { chromium } = require('playwright');

const ORDER_ID = '977980027';
const PHONE = '2312729602'; // Without +1

async function signup() {
  console.log('=== CHLOE PHONE SIGNUP ===');
  console.log('Phone: +1', PHONE);
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-michigan_session-chloephonefinal'
    }
  });
  
  const page = await browser.newPage();
  
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  });
  
  await page.waitForTimeout(4000);
  console.log('Page loaded');
  
  // Fill birthday
  await page.click('[aria-label*="Monat"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("Mai")');
  
  await page.click('[aria-label*="Tag"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("22")');
  
  await page.click('[aria-label*="Jahr"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("1988")');
  
  console.log('Birthday: May 22, 1988');
  
  // Enter phone number
  await page.fill('input[placeholder*="Telefonnummer"], input[type="tel"]', PHONE);
  console.log('Phone entered');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-phone-filled.png' });
  
  // Click send code
  console.log('Clicking Send Code...');
  const btn = page.locator('button').filter({ hasText: /Code senden|Send code/i }).first();
  await btn.click({ force: true });
  
  console.log('✅ Code sent! Waiting for SMS...');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-phone-after.png' });
  
  // Wait for code
  console.log('Checking 5sim for SMS code...');
  
  // Keep browser open
  await page.waitForTimeout(180000);
  await browser.close();
}

signup().catch(console.error);
