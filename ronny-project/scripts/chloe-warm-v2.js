const puppeteer = require('puppeteer-core');
const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Connecting to Chloe (Orbita)...');
  
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:29732/devtools/browser/7c267d5b-0226-4077-a7bc-9039622bcf69',
    ignoreHTTPSErrors: true
  });

  const pages = await browser.pages();
  console.log('Pages:', pages.length);
  
  let tiktok = null;
  for (const p of pages) {
    const url = p.url();
    console.log(' -', url.substring(0, 60));
    if (url.includes('tiktok.com') && !url.includes('login')) tiktok = p;
  }

  if (!tiktok) {
    console.log('No logged-in TikTok page, using first page...');
    tiktok = pages[0];
    await tiktok.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);
    const url = tiktok.url();
    if (url.includes('login')) { console.log('Not logged in!'); await browser.disconnect(); return; }
  }

  console.log('✅ Using page:', tiktok.url().substring(0, 60));

  let likes = 0, videos = 0;

  // BMW M4 search
  console.log('\n🔍 Searching BMW M4...');
  await tiktok.goto('https://www.tiktok.com/search/video?q=bmw+m4+drift', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(5000);

  // Click into first video via keyboard
  await tiktok.keyboard.press('Tab');
  await delay(500);
  
  for (let i = 0; i < 5; i++) {
    await delay(14000 + Math.random() * 6000);
    const liked = await tiktok.evaluate(() => {
      const btn = document.querySelector('[data-e2e="like-icon"], [data-e2e="browse-like"], button[aria-label*="like" i], button[aria-label*="Like"]');
      if (btn && btn.getAttribute('aria-pressed') !== 'true') { btn.click(); return true; }
      return false;
    });
    if (liked) { likes++; console.log(`❤️  Like ${likes}`); }
    await tiktok.keyboard.press('ArrowDown');
    videos++;
    console.log(`Video ${videos} (bmw search)`);
  }

  // FYP
  console.log('\n📱 Switching to FYP...');
  await tiktok.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(5000);

  for (let i = 0; i < 8; i++) {
    await delay(11000 + Math.random() * 9000);
    const liked = await tiktok.evaluate(() => {
      const btn = document.querySelector('[data-e2e="like-icon"], [data-e2e="browse-like"]');
      if (btn && btn.getAttribute('aria-pressed') !== 'true') { btn.click(); return true; }
      return false;
    });
    if (liked) { likes++; console.log(`❤️  Like ${likes}`); }
    await tiktok.keyboard.press('ArrowDown');
    videos++;
    console.log(`FYP video ${i+1}/8`);
  }

  // Follow @porsche
  console.log('\n👤 Following @porsche...');
  await tiktok.goto('https://www.tiktok.com/@porsche', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(3000);
  const followed = await tiktok.evaluate(() => {
    const btn = document.querySelector('[data-e2e="follow-button"]');
    if (btn && btn.textContent.includes('Follow') && !btn.textContent.includes('Following')) {
      btn.click(); return true;
    }
    return false;
  });
  if (followed) console.log('✅ Followed @porsche');

  console.log(`\n✅ CHLOE WARMING DONE! ${videos} videos, ${likes} likes`);
  await browser.disconnect();
}

main().catch(console.error);
