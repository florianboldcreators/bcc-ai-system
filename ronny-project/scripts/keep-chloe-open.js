const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';
const PROFILE_ID = '69c824ce81d2e60c5598ce87'; // chloe-santos-direct

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const GL = new GoLogin({ token: TOKEN, profile_id: PROFILE_ID });
  const { status, wsUrl } = await GL.start();
  console.log('Browser open | WS:', wsUrl);

  const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://www.tiktok.com/login/phone-or-email/email', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('TikTok login page open. Please login manually.');
  console.log('Email: chloemarie.santos@proton.me');
  console.log('Password: Cm_Secure88!');

  // Wait for login (check every 5s for up to 5 minutes)
  for (let i = 0; i < 60; i++) {
    await delay(5000);
    const url = page.url();
    if (!url.includes('/login')) {
      console.log('✅ LOGGED IN! URL:', url);
      
      // Start warming - 15 minutes of car content
      console.log('Starting 15-minute warming...');
      
      // Search for car content
      await page.goto('https://www.tiktok.com/search/video?q=bmw+m4+drift', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(4000);
      
      let likes = 0;
      for (let j = 0; j < 12; j++) {
        await delay(8000 + Math.random() * 10000);
        
        // Try to like
        const likeBtn = await page.$('button[data-e2e="like-icon"]');
        if (likeBtn) { await likeBtn.click(); likes++; console.log(`Like ${likes}`); }
        
        // Scroll
        await page.keyboard.press('ArrowDown');
        console.log(`Video ${j+1}/12 watched`);
        
        // After 6 videos, switch to FYP
        if (j === 5) {
          await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
          await delay(3000);
          console.log('Switched to FYP');
        }
      }
      
      console.log(`Warming done! ${likes} likes given`);
      break;
    }
    if (i % 6 === 0) console.log(`Waiting for login... (${i*5}s)`);
  }

  console.log('Keeping browser open for 30 more minutes...');
  await delay(1800000);
  await GL.stop();
}

main().catch(console.error);
