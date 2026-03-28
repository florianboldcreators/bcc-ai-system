const { chromium } = require('playwright');

async function createChloeAccount() {
  console.log('Launching browser with IPRoyal proxy...');
  
  // IPRoyal format: username:password_country-us_session-xxx
  const browser = await chromium.launch({
    headless: false,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-us_state-newyork_session-chloe88'
    }
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Test proxy IP
  console.log('Testing proxy IP...');
  try {
    await page.goto('https://ipv4.icanhazip.com', { timeout: 15000 });
    const ip = await page.textContent('body');
    console.log('Current IP:', ip.trim());
  } catch (e) {
    console.log('IP check failed, continuing...');
  }
  
  // Go to TikTok signup
  console.log('Navigating to TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-v2-signup.png' });
  console.log('Screenshot saved');
  
  const title = await page.title();
  console.log('Page title:', title);
  
  // Keep browser open
  console.log('Browser ready. Waiting 2 minutes...');
  await page.waitForTimeout(120000);
  
  await browser.close();
}

createChloeAccount().catch(e => console.error('Error:', e.message));
