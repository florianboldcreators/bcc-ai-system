const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const PROFILE_ID = '69c23716ac926b95f05793a9';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

const ORDER_ID = '977994842';
const PHONE = '4233728957';
const API_KEY = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDI2MDU1NjEsImlhdCI6MTc3MTA2OTU2MSwicmF5IjoiZTY3ZjEzNTA3NmUyMWIzMmU2NzU5NTZjNWNkYTBkM2UiLCJzdWIiOjM4MDcwMjN9.hQpfImdN_LPno91xiJC35qP2ExfGnApXwl2TLQ7GvCf4du7qWSzkmg-Pf1MgUv8ZR4z2J0RNZwjrjT86hqm6Oxn8kx5Yd-9XL6NVzQrLzZfLSn8iY08QZYU84yG7wi-jaRVjf07xmwFvXNi5uGwvt_dU09Q5WK2lJ1NMCmqKxBswbnjoaHDedCF5-_ARTWxoKjS-A9GsP9lFKIyXqg8Tub1xMs1M7BWVecNG7WahVYZ7riKMIKWyZsyP6RyBo-tv3duGpaQwCz54ySOUX0C9MLLC_RkVZsewadH0bUPGEV_ga8FOe0DykEjfhCfpyVG-OPSRO7yo1vTEXCXNiv2inw';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function checkSMS() {
  const r = await fetch(\`https://5sim.net/v1/user/check/\${ORDER_ID}\`, {
    headers: { 'Authorization': \`Bearer \${API_KEY}\` }
  });
  const d = await r.json();
  return d.sms && d.sms.length > 0 ? d.sms[0].code : null;
}

async function main() {
  console.log('=== GOLOGIN TIKTOK SIGNUP ===');
  console.log('Phone: +1', PHONE);
  
  const GL = new GoLogin({
    token: TOKEN,
    profile_id: PROFILE_ID
  });

  const { status, wsUrl } = await GL.start();
  console.log('Status:', status);

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    ignoreHTTPSErrors: true
  });

  const page = await browser.newPage();
  
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 30000 });
  const ip = await page.evaluate(() => document.body.textContent.trim());
  console.log('IP:', ip);

  console.log('Loading TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'networkidle2',
    timeout: 90000
  });

  await delay(3000);

  // Cookie consent
  try {
    await page.evaluate(() => {
      const btn = document.querySelector('button');
      if (btn && btn.textContent.includes('Allow')) btn.click();
    });
  } catch (e) {}

  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-page.png' });
  console.log('Page loaded');

  // Birthday - using evaluate
  await page.evaluate(() => {
    const selects = document.querySelectorAll('div[role="combobox"]');
    if (selects[0]) selects[0].click();
  });
  await delay(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('[role="option"]');
    for (const o of opts) {
      if (o.textContent === 'May' || o.textContent === 'Mai') { o.click(); break; }
    }
  });

  await delay(300);
  await page.evaluate(() => {
    const selects = document.querySelectorAll('div[role="combobox"]');
    if (selects[1]) selects[1].click();
  });
  await delay(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('[role="option"]');
    for (const o of opts) {
      if (o.textContent === '22') { o.click(); break; }
    }
  });

  await delay(300);
  await page.evaluate(() => {
    const selects = document.querySelectorAll('div[role="combobox"]');
    if (selects[2]) selects[2].click();
  });
  await delay(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('[role="option"]');
    for (const o of opts) {
      if (o.textContent === '1988') { o.click(); break; }
    }
  });

  console.log('Birthday filled');
  await delay(1000);

  // Phone
  await page.type('input[type="tel"]', PHONE);
  console.log('Phone entered');

  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-filled.png' });

  // Send code
  console.log('Clicking Send code...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('Send code') || b.textContent.includes('Code senden')) {
        b.click(); break;
      }
    }
  });

  await delay(10000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-after.png' });

  // Check for code input
  const hasCodeInput = await page.evaluate(() => {
    return !!document.querySelector('input[placeholder*="code"], input[maxlength="6"]');
  });

  if (hasCodeInput) {
    console.log('✅ Code input visible! Checking 5sim...');
    for (let i = 0; i < 12; i++) {
      const code = await checkSMS();
      if (code) {
        console.log('✅ SMS CODE:', code);
        await page.type('input[placeholder*="code"], input[maxlength="6"]', code);
        await delay(2000);
        
        const hasPwd = await page.evaluate(() => !!document.querySelector('input[type="password"]'));
        if (hasPwd) {
          await page.type('input[type="password"]', 'Cm_Secure88!');
          console.log('Password set');
          await page.evaluate(() => {
            const btn = document.querySelector('button[type="submit"]');
            if (btn) btn.click();
          });
        }
        
        await delay(5000);
        await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-final.png' });
        break;
      }
      console.log('Waiting for SMS...', i + 1);
      await delay(5000);
    }
  } else {
    console.log('❌ No code input - checking page content');
    const content = await page.content();
    if (content.includes('captcha') || content.includes('verify')) {
      console.log('⚠️ CAPTCHA detected');
    }
  }

  await GL.stop();
  console.log('Done');
}

main().catch(console.error);
