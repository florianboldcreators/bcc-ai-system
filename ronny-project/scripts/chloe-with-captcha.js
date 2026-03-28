const { chromium } = require('playwright');
const Captcha = require('2captcha');

const solver = new Captcha.Solver('970d26c1ae04961ccbadaabc1caaeb3a');

async function createAccount() {
  console.log('Starting with CAPTCHA solving...');
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-florida_session-chloe777'
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
  console.log('IP:', ip.trim());
  
  // Go to TikTok
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  
  await page.waitForTimeout(3000);
  
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
  
  console.log('Form filled');
  
  // Click send code
  await page.click('button:has-text("Code senden")');
  console.log('Clicked send code');
  
  await page.waitForTimeout(2000);
  
  // Check for CAPTCHA
  const captchaFrame = await page.$('iframe[src*="captcha"]');
  if (captchaFrame) {
    console.log('CAPTCHA iframe found!');
    
    // Get the captcha image or puzzle
    const captchaUrl = await captchaFrame.getAttribute('src');
    console.log('CAPTCHA URL:', captchaUrl);
    
    // Try to solve with 2captcha
    // TikTok uses a slide puzzle, which is "geetest" type
    try {
      console.log('Solving CAPTCHA via 2captcha...');
      // This may not work for TikTok's specific captcha type
    } catch (e) {
      console.log('CAPTCHA solving failed:', e.message);
    }
  } else {
    console.log('No CAPTCHA iframe found');
  }
  
  // Take screenshot
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/captcha-check.png' });
  
  // Wait for manual intervention if needed
  console.log('Waiting 3 minutes...');
  await page.waitForTimeout(180000);
  
  await browser.close();
}

createAccount().catch(e => console.error('Error:', e.message));
