const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';
// Try chloe-santos-direct profile first (no proxy = cleaner for already-created account)
const PROFILE_ID = '69c824ce81d2e60c5598ce87';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Starting Chloe warming session...');
  
  const GL = new GoLogin({ token: TOKEN, profile_id: PROFILE_ID });
  const { status, wsUrl } = await GL.start();
  console.log('Status:', status, '| WS:', wsUrl);

  const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Check IP
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 20000 });
  const ip = await page.evaluate(() => document.body.textContent.trim());
  console.log('IP:', ip);

  // Go to TikTok - try to login as Chloe
  await page.goto('https://www.tiktok.com/login/phone-or-email/email', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await delay(3000);
  
  // Fill login form
  await page.focus('input[type="text"], input[name="username"]');
  await delay(300);
  await page.keyboard.type('chloemarie.santos@proton.me', { delay: 80 });
  await delay(500);
  
  await page.focus('input[type="password"]');
  await delay(300);
  await page.keyboard.type('Cm_Secure88!', { delay: 80 });
  await delay(1000);
  
  // Click login
  const loginBtn = await page.$('button[data-e2e="login-button"], button:not([disabled])');
  if (loginBtn) { await loginBtn.click(); console.log('Login clicked'); }
  else { await page.keyboard.press('Enter'); }
  
  await delay(8000);
  const url = page.url();
  console.log('After login URL:', url);
  
  if (url.includes('tiktok.com') && !url.includes('login')) {
    console.log('✅ LOGGED IN! Starting warming...');
    // Warming: scroll FYP, like car videos
    for (let i = 0; i < 8; i++) {
      await delay(10000 + Math.random() * 8000);
      // Like current video
      const likeBtn = await page.$('button[data-e2e="like-icon"], button[aria-label*="Like"]');
      if (likeBtn) {
        await likeBtn.click();
        console.log(`Like ${i+1} done`);
      }
      // Scroll to next
      await page.keyboard.press('ArrowDown');
      console.log(`Scroll ${i+1}`);
    }
    console.log('Warming complete!');
  } else {
    console.log('❌ Login failed - URL:', url);
    await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-login-fail.png' });
  }
  
  await GL.stop();
}

main().catch(console.error);
