const puppeteer = require('puppeteer-core');
const { GoLogin } = require('gologin');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';
const delay = ms => new Promise(r => setTimeout(r, ms));

const PROFILES = [
  { name: 'tyler', username: 'tyler.westbrook94', profile: '69c2370f15ad6c33e2e4dd0a' },
  { name: 'chloe', username: 'kimvirginiaaah._', profile: '69c23716ac926b95f05793a9' },
  { name: 'marcus', username: 'user4783749392230', profile: '69c237127961c960feb0f7c1' },
  { name: 'sophia', username: 'user4148459812842', profile: '69c237114f7abb90b3b43fd2' },
];

async function checkProfile(p) {
  console.log(`\n[${p.name.toUpperCase()}] Checking TikTok profile @${p.username}...`);
  
  const GL = new GoLogin({ token: TOKEN, profile_id: p.profile });
  try {
    const { wsUrl } = await GL.start();
    const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, ignoreHTTPSErrors: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    // First check: Is the account publicly visible?
    await page.goto(`https://www.tiktok.com/@${p.username}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000);
    
    const profileData = await page.evaluate(() => {
      // Check if profile exists
      const notFound = document.querySelector('[data-e2e="user-not-found"]') || 
                       document.body.textContent.includes("Couldn't find this account");
      if (notFound) return { exists: false };
      
      // Get follower count
      const followers = document.querySelector('[data-e2e="followers-count"]')?.textContent || '?';
      const following = document.querySelector('[data-e2e="following-count"]')?.textContent || '?';
      const likes = document.querySelector('[data-e2e="likes-count"]')?.textContent || '?';
      const bio = document.querySelector('[data-e2e="user-bio"]')?.textContent || '';
      const videos = document.querySelectorAll('[data-e2e="user-post-item"]').length;
      
      return { exists: true, followers, following, likes, bio, videos };
    });
    
    console.log(`[${p.name.toUpperCase()}] Profile: ${JSON.stringify(profileData)}`);
    
    // Second check: Are we logged in as this user?
    await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);
    
    const loggedInAs = await page.evaluate(() => {
      // Check sidebar for profile link
      const profileLink = document.querySelector('a[href*="/@"]');
      if (profileLink) {
        const href = profileLink.getAttribute('href');
        return href.split('/@')[1]?.split('?')[0] || null;
      }
      
      // Check if login button is visible
      const loginBtn = document.querySelector('[data-e2e="nav-login-button"]');
      return loginBtn ? 'NOT_LOGGED_IN' : 'UNKNOWN';
    });
    
    console.log(`[${p.name.toUpperCase()}] Logged in as: @${loggedInAs}`);
    console.log(`[${p.name.toUpperCase()}] Expected: @${p.username}`);
    console.log(`[${p.name.toUpperCase()}] Match: ${loggedInAs === p.username ? '✅ YES' : '❌ NO'}`);
    
    await browser.disconnect();
    await GL.stop();
    
    return { name: p.name, exists: profileData.exists, loggedInAs, expected: p.username, match: loggedInAs === p.username };
  } catch (err) {
    console.log(`[${p.name.toUpperCase()}] ERROR: ${err.message}`);
    try { await GL.stop(); } catch {}
    return { name: p.name, error: err.message };
  }
}

async function main() {
  console.log('=== Verifying All TikTok Accounts ===\n');
  const results = [];
  
  for (const p of PROFILES) {
    const result = await checkProfile(p);
    results.push(result);
    await delay(5000); // Wait between checks
  }
  
  console.log('\n=== SUMMARY ===');
  results.forEach(r => {
    if (r.error) console.log(`❌ ${r.name}: ERROR - ${r.error}`);
    else if (r.match) console.log(`✅ ${r.name}: @${r.loggedInAs} (correct)`);
    else console.log(`⚠️ ${r.name}: logged in as @${r.loggedInAs}, expected @${r.expected}`);
  });
}

main().catch(console.error);
