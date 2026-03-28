const { chromium } = require('playwright');

const ORDER_ID = '977987814';
const PHONE = '82186871613';

const API_KEY = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDI2MDU1NjEsImlhdCI6MTc3MTA2OTU2MSwicmF5IjoiZTY3ZjEzNTA3NmUyMWIzMmU2NzU5NTZjNWNkYTBkM2UiLCJzdWIiOjM4MDcwMjN9.hQpfImdN_LPno91xiJC35qP2ExfGnApXwl2TLQ7GvCf4du7qWSzkmg-Pf1MgUv8ZR4z2J0RNZwjrjT86hqm6Oxn8kx5Yd-9XL6NVzQrLzZfLSn8iY08QZYU84yG7wi-jaRVjf07xmwFvXNi5uGwvt_dU09Q5WK2lJ1NMCmqKxBswbnjoaHDedCF5-_ARTWxoKjS-A9GsP9lFKIyXqg8Tub1xMs1M7BWVecNG7WahVYZ7riKMIKWyZsyP6RyBo-tv3duGpaQwCz54ySOUX0C9MLLC_RkVZsewadH0bUPGEV_ga8FOe0DykEjfhCfpyVG-OPSRO7yo1vTEXCXNiv2inw';

async function checkSMS() {
  const r = await fetch('https://5sim.net/v1/user/check/' + ORDER_ID, {
    headers: { 'Authorization': 'Bearer ' + API_KEY }
  });
  const d = await r.json();
  return d.sms && d.sms.length > 0 ? d.sms[0].code : null;
}

async function main() {
  console.log('=== CHLOE SIMPLE ===');
  console.log('Phone: +62', PHONE);
  
  const browser = await chromium.launch({
    headless: true,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-id_session-chloesimple' + Date.now()
    }
  });
  
  const page = await browser.newPage();
  
  // Check IP
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 60000 });
  const ip = await page.textContent('body');
  console.log('IP:', ip.trim());
  
  // Load TikTok
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'networkidle',
    timeout: 120000
  });
  await page.waitForTimeout(3000);
  
  // Accept cookies if present
  try {
    await page.click('button:has-text("Allow all")', { timeout: 3000 });
    console.log('Cookies accepted');
  } catch (e) {}
  
  await page.waitForTimeout(2000);
  
  // Birthday - Month
  await page.click('div[role="combobox"] >> nth=0');
  await page.waitForTimeout(400);
  await page.click('li:has-text("May"), [role="option"]:has-text("May")');
  
  // Day
  await page.waitForTimeout(300);
  await page.click('div[role="combobox"] >> nth=1');
  await page.waitForTimeout(400);
  await page.click('li:has-text("22"), [role="option"]:has-text("22")');
  
  // Year
  await page.waitForTimeout(300);
  await page.click('div[role="combobox"] >> nth=2');
  await page.waitForTimeout(400);
  await page.click('li:has-text("1988"), [role="option"]:has-text("1988")');
  
  console.log('Birthday: May 22, 1988');
  await page.waitForTimeout(500);
  
  // Country code should already be +62 (Indonesia) - just fill phone
  await page.fill('input[type="tel"]', PHONE);
  console.log('Phone entered');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/simple-before.png' });
  
  // Click Send Code
  console.log('Clicking Send code...');
  await page.click('button:has-text("Send code")');
  
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/simple-after.png' });
  
  // Check for code input
  const codeVisible = await page.locator('input[placeholder*="code"]').isVisible().catch(() => false);
  console.log('Code input visible:', codeVisible);
  
  if (codeVisible) {
    console.log('✅ Code input appeared! Checking 5sim...');
    for (let i = 0; i < 12; i++) {
      const code = await checkSMS();
      if (code) {
        console.log('✅ SMS CODE:', code);
        await page.fill('input[placeholder*="code"]', code);
        await page.waitForTimeout(2000);
        
        // Set password
        const pwdInput = page.locator('input[type="password"]');
        if (await pwdInput.isVisible().catch(() => false)) {
          await pwdInput.fill('Cm_Secure88!');
          console.log('Password set');
          await page.click('button[type="submit"]');
        }
        
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/simple-final.png' });
        break;
      }
      console.log('Waiting for SMS...', i + 1);
      await page.waitForTimeout(5000);
    }
  }
  
  await browser.close();
  console.log('Done');
}

main().catch(e => console.error('Error:', e.message));
