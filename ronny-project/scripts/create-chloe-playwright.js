const { chromium } = require('playwright');

async function createChloeAccount() {
  console.log('Launching isolated browser...');
  
  // Launch a completely new browser instance
  const browser = await chromium.launch({
    headless: false, // So we can see what's happening
    args: ['--no-sandbox']
  });
  
  // Create a new context (isolated session)
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to TikTok signup...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'networkidle'
  });
  
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/playwright-signup.png' });
  console.log('Screenshot saved');
  
  // Wait for form
  await page.waitForSelector('[placeholder*="E-Mail"], [placeholder*="Email"]', { timeout: 10000 });
  
  // Select birthday: May 22, 1988
  console.log('Filling birthday...');
  
  // Month
  await page.click('[aria-label*="Monat"], [aria-label*="Month"]');
  await page.waitForTimeout(500);
  await page.click('text="Mai"').catch(() => page.click('text="May"'));
  await page.waitForTimeout(300);
  
  // Day
  await page.click('[aria-label*="Tag"], [aria-label*="Day"]');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("22")');
  await page.waitForTimeout(300);
  
  // Year
  await page.click('[aria-label*="Jahr"], [aria-label*="Year"]');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("1988")');
  await page.waitForTimeout(300);
  
  // Enter email
  console.log('Entering email...');
  await page.fill('[placeholder*="E-Mail"], [placeholder*="Email"]', 'chloesantos88@sharebot.net');
  
  // Enter password
  await page.fill('[placeholder*="Passwort"], [placeholder*="Password"]', 'Cm_Secure88!');
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/playwright-filled.png' });
  console.log('Form filled, screenshot saved');
  
  // Click send code
  await page.click('button:has-text("Code senden"), button:has-text("Send code")');
  console.log('Clicked send code!');
  
  // Wait for code
  console.log('Waiting 60 seconds for code...');
  console.log('Check mail.tm API for code!');
  
  await page.waitForTimeout(60000);
  
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/playwright-waiting.png' });
  
  // Keep browser open for debugging
  await page.waitForTimeout(120000);
  
  await browser.close();
}

createChloeAccount().catch(console.error);
