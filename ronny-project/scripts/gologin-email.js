const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const PROFILE_ID = '69c23716ac926b95f05793a9';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

const EMAIL = 'chloemarie.santos@proton.me';
const PASSWORD = 'Cm_Secure88!';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== GOLOGIN EMAIL SIGNUP ===');
  console.log('Email:', EMAIL);
  
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
  
  // Check IP
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 30000 });
  const ip = await page.evaluate(() => document.body.textContent.trim());
  console.log('IP:', ip);

  // Go directly to email signup
  console.log('Loading TikTok email signup...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'networkidle2',
    timeout: 90000
  });

  await delay(3000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-email-1.png' });
  console.log('Page loaded');

  // Fill birthday
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
    for (const o of opts) { if (o.textContent === '22') { o.click(); break; } }
  });

  await delay(300);
  await page.evaluate(() => {
    const selects = document.querySelectorAll('div[role="combobox"]');
    if (selects[2]) selects[2].click();
  });
  await delay(500);
  await page.evaluate(() => {
    const opts = document.querySelectorAll('[role="option"]');
    for (const o of opts) { if (o.textContent === '1988') { o.click(); break; } }
  });

  console.log('Birthday: May 22, 1988');
  await delay(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-email-2.png' });

  // Fill email
  const emailInput = await page.$('input[placeholder*="email"], input[placeholder*="Email"], input[name="email"]');
  if (emailInput) {
    await emailInput.type(EMAIL);
    console.log('Email entered');
  } else {
    // Try finding by type
    const inputs = await page.$$('input[type="text"], input[type="email"]');
    if (inputs[0]) {
      await inputs[0].type(EMAIL);
      console.log('Email entered (alt)');
    }
  }

  await delay(500);

  // Fill password
  const pwdInput = await page.$('input[type="password"]');
  if (pwdInput) {
    await pwdInput.type(PASSWORD);
    console.log('Password entered');
  }

  await delay(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-email-3.png' });

  // Click send code
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
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-email-4.png' });

  // Check for code input
  const hasCodeInput = await page.evaluate(() => {
    return !!document.querySelector('input[placeholder*="code"], input[maxlength="6"]');
  });

  console.log('Code input visible:', hasCodeInput);

  if (hasCodeInput) {
    console.log('✅ CODE SENT! Check ProtonMail for chloemarie.santos@proton.me');
    console.log('Browser stays open for 3 minutes...');
    await delay(180000);
  } else {
    console.log('❌ No code input appeared');
    const content = await page.content();
    console.log('CAPTCHA detected:', content.includes('captcha') || content.includes('verify'));
  }

  await GL.stop();
  console.log('Done');
}

main().catch(console.error);
