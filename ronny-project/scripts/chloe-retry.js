const { chromium } = require('playwright');

async function createChloeAccount() {
  console.log('Starting fresh Chloe account creation...');
  console.log('Time:', new Date().toISOString());
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-california_session-chloe99'
    }
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Check IP
  await page.goto('https://ipv4.icanhazip.com', { timeout: 15000 });
  const ip = await page.textContent('body');
  console.log('Proxy IP:', ip.trim());
  
  // TikTok signup
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  
  await page.waitForTimeout(2000);
  
  // Birthday: May 22, 1988
  await page.click('[aria-label*="Monat"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("Mai")');
  await page.waitForTimeout(300);
  
  await page.click('[aria-label*="Tag"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("22")');
  await page.waitForTimeout(300);
  
  await page.click('[aria-label*="Jahr"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("1988")');
  await page.waitForTimeout(400);
  
  // Email & Password
  await page.fill('input[name="email"], input[placeholder*="E-Mail"]', 'chloemarie.santos@proton.me');
  await page.fill('input[type="password"]', 'Cm_Secure88!');
  
  await page.waitForTimeout(500);
  console.log('Form filled. Clicking Send Code...');
  
  // Click send code - try multiple selectors
  try {
    await page.click('button:has-text("Code senden")');
  } catch {
    await page.click('button:has-text("Send code")');
  }
  
  console.log('✅ Code senden clicked! Time:', new Date().toISOString());
  console.log('📧 CHECK PROTONMAIL: chloemarie.santos@proton.me');
  
  // Screenshot after clicking
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-code-sent.png' });
  
  // Wait for code input field to appear (indicates code was sent)
  console.log('Waiting for code input field...');
  try {
    await page.waitForSelector('input[placeholder*="Code"], input[placeholder*="code"]', { timeout: 10000 });
    console.log('✅ Code input field appeared! TikTok sent the code.');
  } catch {
    console.log('⚠️ Code input field not found. May need CAPTCHA or verification.');
    await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-verification.png' });
  }
  
  // Keep open for manual intervention
  console.log('Browser open for 5 minutes...');
  await page.waitForTimeout(300000);
  
  await browser.close();
}

createChloeAccount().catch(e => console.error('Error:', e.message));
