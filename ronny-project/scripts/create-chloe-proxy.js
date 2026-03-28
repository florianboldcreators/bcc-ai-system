const { chromium } = require('playwright');

async function createChloeAccount() {
  console.log('Launching browser with IPRoyal proxy...');
  
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA_country-us_state-newyork_session-chloe88',
      password: 'TkKGrrECccX08emT'
    }
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Test proxy IP
  console.log('Testing proxy IP...');
  await page.goto('https://ipv4.icanhazip.com');
  const ip = await page.textContent('body');
  console.log('Current IP:', ip.trim());
  
  // Go to TikTok signup
  console.log('Navigating to TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-proxy-signup.png' });
  console.log('Screenshot saved');
  
  // Wait for form
  await page.waitForSelector('[placeholder*="E-Mail"], [placeholder*="Email"]', { timeout: 15000 });
  console.log('Form loaded');
  
  // Birthday: May 22, 1988
  await page.click('[aria-label*="Monat"]').catch(() => page.click('[data-e2e*="month"]'));
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: 'Mai' }).click().catch(() => page.getByRole('option', { name: 'May' }).click());
  
  await page.click('[aria-label*="Tag"]').catch(() => page.click('[data-e2e*="day"]'));
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: '22' }).click();
  
  await page.click('[aria-label*="Jahr"]').catch(() => page.click('[data-e2e*="year"]'));
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: '1988' }).click();
  
  // Email + Password
  await page.fill('[placeholder*="E-Mail"], [placeholder*="Email"]', 'chloemarie.santos@proton.me');
  await page.fill('[placeholder*="Passwort"], [placeholder*="Password"]', 'Cm_Secure88!');
  
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-proxy-filled.png' });
  console.log('Form filled');
  
  // Send code
  await page.click('button:has-text("Code senden"), button:has-text("Send code")');
  console.log('Code requested! Check ProtonMail: chloemarie.santos@proton.me');
  
  // Wait for code input
  await page.waitForTimeout(90000); // 90 seconds to get code
  
  await browser.close();
}

createChloeAccount().catch(console.error);
