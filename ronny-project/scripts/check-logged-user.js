const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

// Test Chloe's profile - we know she's logged in
async function main() {
  const GL = new GoLogin({ token: TOKEN, profile_id: '69c23716ac926b95f05793a9' });
  const { wsUrl } = await GL.start();
  const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 4000));
  
  // Try multiple ways to find current user
  const userInfo = await page.evaluate(() => {
    // Method 1: Profile link in sidebar
    const profileLinks = [...document.querySelectorAll('a[href*="/@"]')];
    const profileSidebar = profileLinks.find(l => l.closest('nav, [data-e2e="nav-profile"]') || l.href.includes('/@') && !l.href.includes('/video/'));
    
    // Method 2: Look for username in data attributes
    const userDataEl = document.querySelector('[data-e2e="nav-profile"] img, [data-e2e="profile-icon"]');
    
    // Method 3: Check cookies/localStorage
    let username = null;
    try {
      const userData = JSON.parse(localStorage.getItem('user-unique-id') || '{}');
      username = userData || null;
    } catch {}
    
    return {
      profileLinks: profileLinks.slice(0,5).map(l => l.href),
      url: window.location.href,
      title: document.title,
      loggedIn: !window.location.href.includes('/login'),
      username
    };
  });
  
  console.log('URL:', userInfo.url);
  console.log('Logged in:', userInfo.loggedIn);
  console.log('Profile links found:', userInfo.profileLinks);
  console.log('Username from localStorage:', userInfo.username);
  
  // Take screenshot
  await page.screenshot({ path: '../logs/chloe-profile-check.png' });
  console.log('Screenshot saved');
  
  await browser.disconnect();
  await GL.stop();
}

main().catch(console.error);
