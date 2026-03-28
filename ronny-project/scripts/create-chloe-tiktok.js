const puppeteer = require('puppeteer-core');

const WS_URL = 'ws://127.0.0.1:39229/devtools/browser/95e60ef6-80c2-4bdc-a55f-1005459b6332';

async function createAccount() {
  console.log('Connecting to GoLogin browser...');
  const browser = await puppeteer.connect({
    browserWSEndpoint: WS_URL,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  console.log('New page created');
  
  // Go to TikTok signup
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  console.log('Loaded TikTok signup page');
  
  // Wait a bit for page to fully load
  await page.waitForTimeout(3000);
  
  // Screenshot to verify
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-signup.png' });
  console.log('Screenshot saved');
  
  // Select birthday: May 22, 1988
  // Click month dropdown
  const monthSelector = '[aria-label*="Monat"], [data-e2e="birthday-month"]';
  await page.waitForSelector(monthSelector, { timeout: 10000 });
  await page.click(monthSelector);
  await page.waitForTimeout(500);
  
  // Select Mai
  await page.evaluate(() => {
    const options = document.querySelectorAll('[role="option"]');
    for (const opt of options) {
      if (opt.textContent.includes('Mai')) {
        opt.click();
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  
  // Click day dropdown
  const daySelector = '[aria-label*="Tag"], [data-e2e="birthday-day"]';
  await page.click(daySelector);
  await page.waitForTimeout(500);
  
  // Select 22
  await page.evaluate(() => {
    const options = document.querySelectorAll('[role="option"]');
    for (const opt of options) {
      if (opt.textContent === '22') {
        opt.click();
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  
  // Click year dropdown
  const yearSelector = '[aria-label*="Jahr"], [data-e2e="birthday-year"]';
  await page.click(yearSelector);
  await page.waitForTimeout(500);
  
  // Select 1988
  await page.evaluate(() => {
    const options = document.querySelectorAll('[role="option"]');
    for (const opt of options) {
      if (opt.textContent === '1988') {
        opt.click();
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  
  // Enter email
  const emailInput = 'input[placeholder*="E-Mail"], input[name="email"]';
  await page.waitForSelector(emailInput);
  await page.type(emailInput, 'chloemarie.santos@proton.me', { delay: 50 });
  console.log('Email entered');
  
  // Enter password
  const passwordInput = 'input[placeholder*="Passwort"], input[type="password"]';
  await page.type(passwordInput, 'Cm_Secure88!', { delay: 50 });
  console.log('Password entered');
  
  await page.waitForTimeout(1000);
  
  // Take screenshot of filled form
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-form-filled.png' });
  console.log('Form filled, screenshot saved');
  
  // Click "Code senden"
  const sendCodeBtn = 'button:not([disabled])';
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Code senden') || text.includes('Send code')) {
      await btn.click();
      console.log('Clicked Send Code button');
      break;
    }
  }
  
  console.log('Waiting for verification code...');
  console.log('Check ProtonMail: chloemarie.santos@proton.me');
  
  // Keep browser open
  await page.waitForTimeout(60000);
  
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-waiting-code.png' });
}

createAccount().catch(console.error);
