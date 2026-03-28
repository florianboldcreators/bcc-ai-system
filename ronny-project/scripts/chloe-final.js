const { chromium } = require('playwright');

async function createAccount() {
  console.log('=== CHLOE FINAL ATTEMPT ===');
  console.log('Time:', new Date().toISOString());
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-ohio_session-chloe2028final'
    }
  });
  
  const page = await browser.newPage();
  
  // Go to TikTok
  console.log('Loading TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  });
  
  await page.waitForTimeout(4000);
  console.log('Page loaded');
  
  // Fill birthday
  await page.click('[aria-label*="Monat"]');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("Mai")');
  
  await page.click('[aria-label*="Tag"]');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("22")');
  
  await page.click('[aria-label*="Jahr"]');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("1988")');
  
  await page.waitForTimeout(500);
  console.log('Birthday: May 22, 1988');
  
  // Email & Password
  await page.fill('input[placeholder*="E-Mail"]', 'chloemarie.santos@proton.me');
  await page.fill('input[type="password"]', 'Cm_Secure88!');
  console.log('Credentials filled');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-final-before.png' });
  
  // Click send code with force
  console.log('Clicking Send Code...');
  const btn = page.locator('button').filter({ hasText: /Code senden|Send code/i }).first();
  await btn.click({ force: true, timeout: 5000 });
  
  console.log('✅ CLICKED! Waiting...');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-final-after.png' });
  
  // Check what happened
  const pageContent = await page.content();
  
  if (pageContent.includes('captcha') || pageContent.includes('Captcha') || pageContent.includes('tiktokv-captcha')) {
    console.log('⚠️ CAPTCHA DETECTED in page content');
  }
  
  if (pageContent.includes('sechsstelligen') || pageContent.includes('6-digit') || pageContent.includes('verification code')) {
    console.log('✅ CODE INPUT FIELD APPEARED - Code was sent!');
  }
  
  // Look for code input field
  const codeInput = page.locator('input[placeholder*="Code"], input[maxlength="6"]');
  const hasCodeInput = await codeInput.count() > 0;
  console.log('Code input field visible:', hasCodeInput);
  
  console.log('Browser stays open for 5 minutes. Check ProtonMail!');
  await page.waitForTimeout(300000);
  
  await browser.close();
}

createAccount().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
