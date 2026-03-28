const puppeteer = require('puppeteer-core');

const delay = ms => new Promise(r => setTimeout(r, ms));

const CAR_SEARCHES = ['bmw m4 drift', 'porsche 911', 'supercars acceleration', 'corvette exhaust', 'ferrari sound'];

async function main() {
  console.log('Connecting to Chloe orbita browser...');
  
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:29732/devtools/browser/',
    ignoreHTTPSErrors: true
  });

  const pages = await browser.pages();
  let tiktokPage = pages.find(p => p.url().includes('tiktok.com'));
  
  if (!tiktokPage) {
    tiktokPage = await browser.newPage();
    await tiktokPage.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  console.log('Found TikTok page:', tiktokPage.url());
  await tiktokPage.setViewport({ width: 1440, height: 900 });

  // Check if logged in
  const isLoggedIn = !tiktokPage.url().includes('/login') && !tiktokPage.url().includes('/signup');
  console.log('Logged in:', isLoggedIn);

  if (!isLoggedIn) {
    console.log('Not logged in - exiting');
    await browser.disconnect();
    return;
  }

  // 15 minutes warming - car content
  console.log('🚗 Starting 15-minute car content warming...');
  
  let totalLikes = 0;
  let totalVideos = 0;

  // Phase 1: Search BMW M4
  console.log('\n--- Phase 1: Search "bmw m4" ---');
  await tiktokPage.goto('https://www.tiktok.com/search/video?q=bmw+m4', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(4000);
  
  // Click first video
  const firstVideo = await tiktokPage.$('div[data-e2e="search_video-item"] a, div[class*="DivItemContainer"] a[href*="/video/"]');
  if (firstVideo) { 
    await firstVideo.click();
    await delay(3000);
    console.log('Opened first video');
  }

  // Watch and like 5 videos
  for (let i = 0; i < 5; i++) {
    await delay(12000 + Math.random() * 8000); // 12-20s per video
    
    // Like
    const likeBtn = await tiktokPage.$('button[data-e2e="like-icon"], [data-e2e="browse-like"]');
    if (likeBtn) {
      const isLiked = await tiktokPage.evaluate(btn => btn.getAttribute('aria-pressed') === 'true', likeBtn);
      if (!isLiked) {
        await likeBtn.click();
        totalLikes++;
        console.log(`❤️  Like ${totalLikes} (video ${i+1})`);
      }
    }
    
    // Next video
    await tiktokPage.keyboard.press('ArrowDown');
    totalVideos++;
    console.log(`⬇️  Next video (${totalVideos} watched)`);
  }

  // Phase 2: FYP scroll
  console.log('\n--- Phase 2: FYP scroll ---');
  await tiktokPage.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(4000);

  for (let i = 0; i < 8; i++) {
    await delay(10000 + Math.random() * 10000);
    
    const likeBtn = await tiktokPage.$('button[data-e2e="like-icon"], [data-e2e="browse-like"]');
    if (likeBtn) {
      const isLiked = await tiktokPage.evaluate(btn => btn.getAttribute('aria-pressed') === 'true', likeBtn);
      if (!isLiked) {
        await likeBtn.click();
        totalLikes++;
        console.log(`❤️  Like ${totalLikes} (FYP video ${i+1})`);
      }
    }
    
    await tiktokPage.keyboard.press('ArrowDown');
    totalVideos++;
    console.log(`⬇️  FYP video ${i+1}/8 (total: ${totalVideos})`);
  }

  // Phase 3: Follow @porsche if not already
  console.log('\n--- Phase 3: Follow car accounts ---');
  await tiktokPage.goto('https://www.tiktok.com/@porsche', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(3000);
  const followBtn = await tiktokPage.$('button[data-e2e="follow-button"]');
  if (followBtn) {
    const btnText = await tiktokPage.evaluate(b => b.textContent, followBtn);
    if (btnText.includes('Follow') && !btnText.includes('Following')) {
      await followBtn.click();
      console.log('✅ Followed @porsche');
    } else {
      console.log('Already following @porsche');
    }
  }

  console.log(`\n✅ WARMING COMPLETE!`);
  console.log(`   Videos watched: ${totalVideos}`);
  console.log(`   Likes given: ${totalLikes}`);
  
  await browser.disconnect();
}

main().catch(console.error);
