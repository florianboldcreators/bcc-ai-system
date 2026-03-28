const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

const ACCOUNTS = [
  { id: 'tyler',  username: 'tyler.westbrook94',  email: 'tylerwestbrook94@proton.me',  password: 'Tw_Secure94!', profile: '69c2370f15ad6c33e2e4dd0a' },
  { id: 'chloe',  username: 'kimvirginiaaah._',   email: 'chloemarie.santos@proton.me', password: 'Cm_Secure88!', profile: '69c23716ac926b95f05793a9' },
  { id: 'marcus', username: 'user4783749392230',  email: 'marcus.reed.1991@proton.me', password: 'Mr_Secure91!', profile: '69c237127961c960feb0f7c1' },
  { id: 'sophia', username: 'user4148459812842',  email: 'sophiakimx@proton.me',        password: 'Sk_Secure99!', profile: '69c237114f7abb90b3b43fd2' },
];

const delay = ms => new Promise(r => setTimeout(r, ms));

async function testAccount(account) {
  console.log(`\n[${account.id.toUpperCase()}] Testing...`);
  const GL = new GoLogin({ token: TOKEN, profile_id: account.profile });
  
  try {
    const { status, wsUrl } = await GL.start();
    const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, ignoreHTTPSErrors: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    // IP check
    await page.goto('https://ipv4.icanhazip.com/', { timeout: 20000 });
    const ip = await page.evaluate(() => document.body.textContent.trim());
    
    // TikTok check
    await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000);
    
    const tiktokUrl = page.url();
    const loggedIn = !tiktokUrl.includes('/login') && !tiktokUrl.includes('/signup');
    
    // Check which user is logged in
    let currentUser = 'unknown';
    try {
      currentUser = await page.evaluate(() => {
        const profileLink = document.querySelector('a[href*="/@"]');
        if (profileLink) return profileLink.href.split('/@')[1]?.split('?')[0] || 'unknown';
        return 'not-found';
      });
    } catch {}
    
    console.log(`[${account.id.toUpperCase()}] IP: ${ip} | LoggedIn: ${loggedIn} | User: @${currentUser} | Expected: @${account.username}`);
    const correct = currentUser.toLowerCase() === account.username.toLowerCase();
    console.log(`[${account.id.toUpperCase()}] Status: ${correct ? '✅ CORRECT USER' : loggedIn ? '⚠️ WRONG USER' : '❌ NOT LOGGED IN'}`);
    
    await browser.disconnect();
    await GL.stop();
    return { id: account.id, ip, loggedIn, currentUser, correct };
  } catch (err) {
    console.log(`[${account.id.toUpperCase()}] ERROR: ${err.message}`);
    try { await GL.stop(); } catch {}
    return { id: account.id, error: err.message };
  }
}

async function main() {
  console.log('Testing all 4 TikTok accounts...\n');
  const results = [];
  
  for (const account of ACCOUNTS) {
    const result = await testAccount(account);
    results.push(result);
    if (ACCOUNTS.indexOf(account) < ACCOUNTS.length - 1) {
      console.log('\nWaiting 10s before next account...');
      await delay(10000);
    }
  }
  
  console.log('\n=== FINAL STATUS ===');
  results.forEach(r => {
    if (r.error) console.log(`❌ ${r.id}: ERROR - ${r.error}`);
    else if (r.correct) console.log(`✅ ${r.id}: @${r.currentUser} (IP: ${r.ip})`);
    else if (r.loggedIn) console.log(`⚠️ ${r.id}: Wrong user @${r.currentUser} (expected @${ACCOUNTS.find(a=>a.id===r.id)?.username})`);
    else console.log(`❌ ${r.id}: Not logged in`);
  });
}

main().catch(console.error);
