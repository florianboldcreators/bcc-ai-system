const { chromium } = require('playwright');

const ORDER_ID = '977986492';
const PHONE = '82326571610'; // Indonesia

const API_KEY = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDI2MDU1NjEsImlhdCI6MTc3MTA2OTU2MSwicmF5IjoiZTY3ZjEzNTA3NmUyMWIzMmU2NzU5NTZjNWNkYTBkM2UiLCJzdWIiOjM4MDcwMjN9.hQpfImdN_LPno91xiJC35qP2ExfGnApXwl2TLQ7GvCf4du7qWSzkmg-Pf1MgUv8ZR4z2J0RNZwjrjT86hqm6Oxn8kx5Yd-9XL6NVzQrLzZfLSn8iY08QZYU84yG7wi-jaRVjf07xmwFvXNi5uGwvt_dU09Q5WK2lJ1NMCmqKxBswbnjoaHDedCF5-_ARTWxoKjS-A9GsP9lFKIyXqg8Tub1xMs1M7BWVecNG7WahVYZ7riKMIKWyZsyP6RyBo-tv3duGpaQwCz54ySOUX0C9MLLC_RkVZsewadH0bUPGEV_ga8FOe0DykEjfhCfpyVG-OPSRO7yo1vTEXCXNiv2inw';

async function checkSMS() {
  const response = await fetch(`https://5sim.net/v1/user/check/${ORDER_ID}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await response.json();
  return data.sms && data.sms.length > 0 ? data.sms[0].code : null;
}

async function signup() {
  console.log('=== CHLOE HEADLESS FINAL ===');
  console.log('Phone: +62', PHONE);
  console.log('Time:', new Date().toISOString());
  
  const browser = await chromium.launch({
    headless: true, // TRUE - no display needed
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-id_session-chloeheadless003'
    }
  });
  
  const context = await browser.newContext({
    locale: 'en-US',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Check IP
  console.log('Verifying Indonesian IP...');
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 60000 });
  const ip = await page.textContent('body');
  console.log('IP:', ip.trim());
  
  console.log('Loading TikTok signup...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'networkidle',
    timeout: 120000
  });
  
  // Wait for page to fully load
  await page.waitForTimeout(5000);
  
  // Handle cookie consent
  try {
    const acceptBtn = page.locator('button:has-text("Allow all"), button:has-text("Accept"), button:has-text("Accept all")');
    if (await acceptBtn.count() > 0) {
      await acceptBtn.first().click();
      console.log('Accepted cookies');
      await page.waitForTimeout(2000);
    }
  } catch (e) {}
  
  // Handle EU/legal notices
  try {
    const gotItBtn = page.locator('button:has-text("Got it"), a:has-text("Got it")');
    if (await gotItBtn.count() > 0) {
      await gotItBtn.first().click();
      console.log('Dismissed notice');
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
  
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-headless-1.png' });
  
  // Fill birthday - using aria labels
  console.log('Filling birthday...');
  
  // Month
  await page.locator('[aria-label*="Month"], [aria-label*="Monat"], [data-e2e*="month"]').first().click();
  await page.waitForTimeout(500);
  await page.locator('[role="option"]').getByText('May', { exact: true }).or(page.locator('[role="option"]').getByText('Mai', { exact: true })).click();
  console.log('Month: May');
  
  // Day
  await page.waitForTimeout(300);
  await page.locator('[aria-label*="Day"], [aria-label*="Tag"], [data-e2e*="day"]').first().click();
  await page.waitForTimeout(500);
  await page.locator('[role="option"]').getByText('22', { exact: true }).click();
  console.log('Day: 22');
  
  // Year
  await page.waitForTimeout(300);
  await page.locator('[aria-label*="Year"], [aria-label*="Jahr"], [data-e2e*="year"]').first().click();
  await page.waitForTimeout(500);
  await page.locator('[role="option"]').getByText('1988', { exact: true }).click();
  console.log('Year: 1988');
  
  await page.waitForTimeout(1000);
  
  // Click on country code and change to Indonesia
  console.log('Changing to Indonesia +62...');
  const countryCodeBtn = page.locator('button:has-text("+1"), div:has-text("+1")').first();
  await countryCodeBtn.click();
  await page.waitForTimeout(500);
  
  // Search for Indonesia
  const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
  if (await searchInput.count() > 0) {
    await searchInput.fill('Indonesia');
    await page.waitForTimeout(500);
  }
  
  // Click Indonesia option
  const indoOption = page.locator('[role="option"]').filter({ hasText: /Indonesia|\+62/ }).first();
  await indoOption.click();
  console.log('Selected Indonesia');
  
  await page.waitForTimeout(500);
  
  // Fill phone number
  const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="Phone"]').first();
  await phoneInput.fill(PHONE);
  console.log('Phone filled:', PHONE);
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-headless-2.png' });
  
  // Click send code button
  console.log('Clicking Send code button...');
  const sendCodeBtn = page.locator('button').filter({ hasText: /Send code|Code senden/i }).first();
  
  // Wait for button to be enabled
  await page.waitForTimeout(2000);
  
  // Force click
  await sendCodeBtn.click({ force: true, timeout: 10000 });
  console.log('Clicked Send code!');
  
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-headless-3.png' });
  
  // Check if code input appeared
  const codeInput = page.locator('input[placeholder*="code"], input[maxlength="6"]');
  if (await codeInput.count() > 0 && await codeInput.isVisible()) {
    console.log('✅ CODE INPUT APPEARED! Checking 5sim for SMS...');
    
    // Poll for SMS code
    for (let i = 0; i < 12; i++) {
      const code = await checkSMS();
      if (code) {
        console.log('✅ SMS RECEIVED! Code:', code);
        
        // Enter the code
        await codeInput.fill(code);
        console.log('Code entered!');
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-headless-4.png' });
        
        // Check if we need password
        const passwordInput = page.locator('input[type="password"]');
        if (await passwordInput.count() > 0) {
          await passwordInput.fill('Cm_Secure88!');
          console.log('Password filled!');
          
          // Submit
          const submitBtn = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Next")').first();
          await submitBtn.click();
          console.log('Submitted!');
          
          await page.waitForTimeout(5000);
          await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-headless-5.png' });
        }
        
        break;
      }
      console.log(`Waiting for SMS... (${i + 1}/12)`);
      await page.waitForTimeout(5000);
    }
  } else {
    console.log('❌ Code input did NOT appear');
    const content = await page.content();
    if (content.includes('captcha') || content.includes('verify')) {
      console.log('⚠️ CAPTCHA blocking the request');
    }
  }
  
  await browser.close();
  console.log('Done!');
}

signup().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
