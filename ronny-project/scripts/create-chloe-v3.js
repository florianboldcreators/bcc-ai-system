const { chromium } = require('playwright');

async function createChloeAccount() {
  console.log('Starting Chloe account creation...');
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-newyork_session-chloe88'
    }
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  
  await page.waitForTimeout(3000);
  
  // Use aria-label selectors which are more reliable
  console.log('Filling birthday...');
  
  // Month - click combobox with aria-label containing Monat
  await page.click('[aria-label*="Monat"]');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("Mai")');
  await page.waitForTimeout(300);
  
  // Day
  await page.click('[aria-label*="Tag"]');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("22")');
  await page.waitForTimeout(300);
  
  // Year
  await page.click('[aria-label*="Jahr"]');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("1988")');
  await page.waitForTimeout(500);
  
  console.log('Birthday: May 22, 1988 ✓');
  
  // Email
  await page.fill('input[name="email"], input[placeholder*="E-Mail"]', 'chloemarie.santos@proton.me');
  console.log('Email ✓');
  
  // Password  
  await page.fill('input[type="password"]', 'Cm_Secure88!');
  console.log('Password ✓');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-v3-filled.png' });
  
  // Send code
  console.log('Clicking send code...');
  const sendBtn = page.locator('button').filter({ hasText: /Code senden|Send code/i });
  await sendBtn.click();
  
  console.log('✅ CODE REQUESTED! Check ProtonMail: chloemarie.santos@proton.me');
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-v3-after-send.png' });
  
  // Wait for code
  console.log('Waiting 3 min for manual code entry...');
  await page.waitForTimeout(180000);
  
  await browser.close();
}

createChloeAccount().catch(e => console.error('Error:', e.message));
