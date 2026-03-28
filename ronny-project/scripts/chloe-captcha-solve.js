const { chromium } = require('playwright');
const Captcha = require('2captcha');

const solver = new Captcha.Solver('970d26c1ae04961ccbadaabc1caaeb3a');

const ORDER_ID = '977984669';
const PHONE = '85385006297'; // Indonesia number without +62

async function signup() {
  console.log('=== CHLOE SIGNUP WITH CAPTCHA SOLVING ===');
  console.log('Phone: +62', PHONE);
  console.log('2Captcha: Active');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-id_session-chloeid001'
    }
  });
  
  const context = await browser.newContext({
    locale: 'en-US'
  });
  
  const page = await context.newPage();
  
  // Check IP
  console.log('Checking IP...');
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 30000 });
  const ip = await page.textContent('body');
  console.log('IP:', ip.trim());
  
  console.log('Loading TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  });
  
  await page.waitForTimeout(3000);
  
  // Handle banners
  try {
    await page.locator('button:has-text("Allow all"), button:has-text("Accept")').first().click({ timeout: 3000 });
    console.log('Accepted cookies');
  } catch (e) {}
  
  try {
    await page.locator('text="Got it"').click({ timeout: 2000 });
  } catch (e) {}
  
  await page.waitForTimeout(1000);
  
  // Fill birthday
  const monthBtn = page.locator('div[role="combobox"]').first();
  await monthBtn.click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').filter({ hasText: /^May$|^Mai$/ }).first().click();
  
  const dayBtn = page.locator('div[role="combobox"]').nth(1);
  await dayBtn.click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').filter({ hasText: /^22$/ }).click();
  
  const yearBtn = page.locator('div[role="combobox"]').nth(2);
  await yearBtn.click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').filter({ hasText: /^1988$/ }).click();
  
  console.log('Birthday: May 22, 1988');
  await page.waitForTimeout(500);
  
  // Change country code to +62 (Indonesia)
  const codeSelector = page.locator('[data-e2e="country-code"], div:has-text("+1"):near(input[type="tel"])').first();
  try {
    await codeSelector.click();
    await page.waitForTimeout(500);
    const searchBox = page.locator('input[type="search"]');
    if (await searchBox.count() > 0) {
      await searchBox.fill('Indonesia');
      await page.waitForTimeout(500);
    }
    await page.locator('[role="option"]').filter({ hasText: /Indonesia|\+62/ }).first().click();
    console.log('Selected Indonesia +62');
  } catch (e) {
    console.log('Country code change failed, trying manual...');
  }
  
  await page.waitForTimeout(500);
  
  // Enter phone
  const phoneInput = page.locator('input[type="tel"]').first();
  await phoneInput.fill(PHONE);
  console.log('Phone entered');
  
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-captcha-before.png' });
  
  // Check for CAPTCHA before clicking
  console.log('Checking for CAPTCHA...');
  
  // Look for TikTok's puzzle CAPTCHA iframe
  const captchaFrame = page.frameLocator('iframe[src*="captcha"]').first();
  
  // Click send code
  console.log('Clicking Send code...');
  const sendBtn = page.locator('button').filter({ hasText: /Send code|Code senden/i }).first();
  await sendBtn.click({ force: true });
  
  await page.waitForTimeout(3000);
  
  // Check if CAPTCHA appeared
  const pageContent = await page.content();
  
  if (pageContent.includes('verify') || pageContent.includes('captcha') || pageContent.includes('puzzle')) {
    console.log('⚠️ CAPTCHA detected! Taking screenshot...');
    await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-captcha-visible.png' });
    
    // Try to find and solve the CAPTCHA
    // TikTok uses a slide puzzle CAPTCHA
    
    // Check for funcaptcha
    const funcaptchaKey = pageContent.match(/publickey=([a-f0-9-]+)/)?.[1];
    if (funcaptchaKey) {
      console.log('FunCaptcha detected, key:', funcaptchaKey);
      try {
        const result = await solver.funCaptcha(
          funcaptchaKey,
          page.url()
        );
        console.log('CAPTCHA solved:', result);
      } catch (e) {
        console.log('CAPTCHA solving failed:', e.message);
      }
    }
  }
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-captcha-after.png' });
  
  // Check if code input appeared
  const codeInputVisible = await page.locator('input[placeholder*="code"], input[maxlength="6"]').count() > 0;
  console.log('Code input visible:', codeInputVisible);
  
  console.log('Browser stays open for inspection...');
  await page.waitForTimeout(300000);
  await browser.close();
}

signup().catch(e => {
  console.error('Error:', e.message);
});
