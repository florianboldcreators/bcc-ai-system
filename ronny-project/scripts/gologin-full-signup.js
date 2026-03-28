const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const PROFILE_ID = '69c23716ac926b95f05793a9'; // chris-taylor with US proxy already
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

const ORDER_ID = '977994014';
const PHONE = '3854037109';
const API_KEY = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDI2MDU1NjEsImlhdCI6MTc3MTA2OTU2MSwicmF5IjoiZTY3ZjEzNTA3NmUyMWIzMmU2NzU5NTZjNWNkYTBkM2UiLCJzdWIiOjM4MDcwMjN9.hQpfImdN_LPno91xiJC35qP2ExfGnApXwl2TLQ7GvCf4du7qWSzkmg-Pf1MgUv8ZR4z2J0RNZwjrjT86hqm6Oxn8kx5Yd-9XL6NVzQrLzZfLSn8iY08QZYU84yG7wi-jaRVjf07xmwFvXNi5uGwvt_dU09Q5WK2lJ1NMCmqKxBswbnjoaHDedCF5-_ARTWxoKjS-A9GsP9lFKIyXqg8Tub1xMs1M7BWVecNG7WahVYZ7riKMIKWyZsyP6RyBo-tv3duGpaQwCz54ySOUX0C9MLLC_RkVZsewadH0bUPGEV_ga8FOe0DykEjfhCfpyVG-OPSRO7yo1vTEXCXNiv2inw';

async function checkSMS() {
  const r = await fetch(`https://5sim.net/v1/user/check/${ORDER_ID}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const d = await r.json();
  return d.sms && d.sms.length > 0 ? d.sms[0].code : null;
}

async function main() {
  console.log('=== GOLOGIN TIKTOK SIGNUP ===');
  console.log('Phone: +1', PHONE);
  console.log('Time:', new Date().toISOString());
  
  const GL = new GoLogin({
    token: TOKEN,
    profile_id: PROFILE_ID
  });

  console.log('Starting GoLogin profile (with US proxy)...');
  const { status, wsUrl } = await GL.start();
  console.log('Status:', status);

  if (!wsUrl) {
    console.error('No WebSocket URL!');
    return;
  }

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    ignoreHTTPSErrors: true
  });

  const page = await browser.newPage();
  
  // Check IP
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 30000 });
  const ip = await page.evaluate(() => document.body.textContent.trim());
  console.log('IP:', ip);

  // Go to TikTok phone signup
  console.log('Loading TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'networkidle2',
    timeout: 90000
  });

  await page.waitForTimeout(3000);

  // Handle cookie consent
  try {
    const allowBtn = await page.$('button:has-text("Allow all")');
    if (allowBtn) {
      await allowBtn.click();
      console.log('Accepted cookies');
      await page.waitForTimeout(2000);
    }
  } catch (e) {}

  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gologin-page.png' });
  console.log('Page loaded, screenshot saved');

  // Fill birthday
  // Month
  await page.click('[data-e2e="month-select"], div[role="combobox"]:nth-of-type(1)');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("May"), [role="option"]:has-text("Mai")');
  
  // Day
  await page.waitForTimeout(300);
  await page.click('[data-e2e="day-select"], div[role="combobox"]:nth-of-type(2)');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("22")');
  
  // Year
  await page.waitForTimeout(300);
  await page.click('[data-e2e="year-select"], div[role="combobox"]:nth-of-type(3)');
  await page.waitForTimeout(500);
  await page.click('[role="option"]:has-text("1988")');
  
  console.log('Birthday: May 22, 1988');
  await page.waitForTimeout(1000);

  // Enter phone
  await page.type('input[type="tel"]', PHONE);
  console.log('Phone entered');

  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gologin-filled.png' });

  // Click send code
  console.log('Clicking Send Code...');
  await page.click('button:has-text("Send code")');
  
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gologin-after.png' });

  // Check for code input
  const codeInput = await page.$('input[placeholder*="code"], input[maxlength="6"]');
  if (codeInput) {
    console.log('✅ Code input appeared! Checking 5sim...');
    
    for (let i = 0; i < 12; i++) {
      const code = await checkSMS();
      if (code) {
        console.log('✅ SMS CODE:', code);
        await codeInput.type(code);
        await page.waitForTimeout(2000);
        
        // Set password
        const pwdInput = await page.$('input[type="password"]');
        if (pwdInput) {
          await pwdInput.type('Cm_Secure88!');
          console.log('Password set');
          await page.click('button[type="submit"]');
        }
        
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gologin-final.png' });
        break;
      }
      console.log('Waiting for SMS...', i + 1);
      await page.waitForTimeout(5000);
    }
  } else {
    console.log('❌ No code input - CAPTCHA may have blocked');
  }

  console.log('Stopping GoLogin...');
  await GL.stop();
  console.log('Done');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
