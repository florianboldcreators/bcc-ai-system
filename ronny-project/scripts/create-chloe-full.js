const { chromium } = require('playwright');

async function createChloeAccount() {
  console.log('Launching browser with IPRoyal NY proxy...');
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-newyork_session-chloe88'
    }
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'en-US'
  });
  
  const page = await context.newPage();
  
  // Go to TikTok signup
  console.log('Navigating to TikTok signup...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  
  await page.waitForTimeout(2000);
  
  // Fill birthday: May 22, 1988
  console.log('Filling birthday...');
  
  // Month
  await page.locator('div:has-text("Monat")').first().click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]:has-text("Mai")').click();
  await page.waitForTimeout(300);
  
  // Day
  await page.locator('div:has-text("Tag")').first().click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]:has-text("22")').click();
  await page.waitForTimeout(300);
  
  // Year
  await page.locator('div:has-text("Jahr")').first().click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]:has-text("1988")').click();
  await page.waitForTimeout(500);
  
  console.log('Birthday filled: May 22, 1988');
  
  // Email
  await page.locator('input[placeholder*="Mail"]').fill('chloemarie.santos@proton.me');
  console.log('Email entered');
  
  // Password
  await page.locator('input[type="password"]').fill('Cm_Secure88!');
  console.log('Password entered');
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-full-filled.png' });
  
  // Click send code
  console.log('Clicking send code...');
  await page.locator('button:has-text("Code senden")').click();
  
  console.log('✅ Code requested! Check ProtonMail: chloemarie.santos@proton.me');
  
  // Wait for code input field
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-full-code.png' });
  
  // Keep browser open for manual code entry
  console.log('Browser staying open for 3 minutes to enter code...');
  await page.waitForTimeout(180000);
  
  await browser.close();
}

createChloeAccount().catch(e => console.error('Error:', e.message));
