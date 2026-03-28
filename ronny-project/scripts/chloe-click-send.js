const { chromium } = require('playwright');

async function clickSendCode() {
  console.log('Starting...');
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-texas_session-chloe2028'
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
  
  // Go to TikTok
  console.log('Loading TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  
  await page.waitForTimeout(3000);
  console.log('Page loaded');
  
  // Fill form
  await page.click('[aria-label*="Monat"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("Mai")');
  
  await page.click('[aria-label*="Tag"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("22")');
  
  await page.click('[aria-label*="Jahr"]');
  await page.waitForTimeout(400);
  await page.click('[role="option"]:has-text("1988")');
  
  await page.fill('input[name="email"], input[placeholder*="E-Mail"]', 'chloemarie.santos@proton.me');
  await page.fill('input[type="password"]', 'Cm_Secure88!');
  
  await page.waitForTimeout(1000);
  console.log('Form filled');
  
  // Find and click the send code button explicitly
  const sendButton = page.locator('button').filter({ hasText: 'Code senden' });
  const buttonCount = await sendButton.count();
  console.log('Found buttons:', buttonCount);
  
  if (buttonCount > 0) {
    console.log('Clicking Send Code button...');
    await sendButton.first().click({ force: true });
    console.log('✅ CLICKED!');
  } else {
    console.log('❌ Button not found');
  }
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/after-click.png' });
  
  // Check for CAPTCHA or error
  const pageContent = await page.content();
  if (pageContent.includes('captcha') || pageContent.includes('Captcha')) {
    console.log('⚠️ CAPTCHA detected!');
  }
  if (pageContent.includes('error') || pageContent.includes('Error')) {
    console.log('⚠️ Error detected on page');
  }
  
  // Wait and check for code input
  console.log('Waiting for code...');
  await page.waitForTimeout(60000);
  
  // Check ProtonMail in parallel
  console.log('Check ProtonMail NOW!');
  
  await page.waitForTimeout(120000);
  await browser.close();
}

clickSendCode().catch(e => console.error('Error:', e.message));
