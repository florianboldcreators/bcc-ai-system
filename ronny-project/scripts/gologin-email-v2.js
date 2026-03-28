const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const PROFILE_ID = '69c23716ac926b95f05793a9';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

const EMAIL = 'chloemarie.santos@proton.me';
const PASSWORD = 'Cm_Secure88!';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== GOLOGIN EMAIL SIGNUP V2 ===');
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
  
  // Set viewport larger
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 30000 });
  const ip = await page.evaluate(() => document.body.textContent.trim());
  console.log('IP:', ip);

  console.log('Loading TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'networkidle2',
    timeout: 90000
  });

  await delay(4000);

  // Fill birthday using keyboard approach
  // Month
  await page.keyboard.press('Tab');
  await delay(200);
  await page.keyboard.press('Enter');
  await delay(300);
  // Type "May" and enter
  await page.keyboard.type('May');
  await delay(200);
  await page.keyboard.press('Enter');
  
  // Day
  await delay(200);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await delay(300);
  await page.keyboard.type('22');
  await page.keyboard.press('Enter');
  
  // Year
  await delay(200);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await delay(300);
  await page.keyboard.type('1988');
  await page.keyboard.press('Enter');
  
  console.log('Birthday filled');
  await delay(1000);

  // Tab to email field
  await page.keyboard.press('Tab');
  await delay(200);
  await page.keyboard.type(EMAIL);
  console.log('Email entered');

  // Tab to password
  await page.keyboard.press('Tab');
  await delay(200);
  await page.keyboard.type(PASSWORD);
  console.log('Password entered');

  await delay(500);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-v2-form.png', fullPage: true });

  // Tab to Send Code button and click
  await page.keyboard.press('Tab');
  await delay(200);
  console.log('Pressing Enter on Send Code...');
  await page.keyboard.press('Enter');

  await delay(10000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gl-v2-after.png', fullPage: true });

  // Check what happened
  const pageContent = await page.content();
  const hasCodeInput = pageContent.includes('6-digit') || pageContent.includes('verification') || pageContent.includes('sechsstelligen');
  const hasCaptcha = pageContent.includes('captcha') || pageContent.includes('verify');
  
  console.log('Code input appeared:', hasCodeInput);
  console.log('CAPTCHA detected:', hasCaptcha);

  if (hasCodeInput) {
    console.log('✅ CODE SENT! Check ProtonMail!');
    console.log('Waiting 2 minutes...');
    await delay(120000);
  }

  await GL.stop();
  console.log('Done');
}

main().catch(console.error);
