const { chromium } = require('playwright');

const ORDER_ID = '977982922';
const PHONE = '7863729163';

async function signup() {
  console.log('=== CHLOE UK SIGNUP WITH UK PROXY ===');
  console.log('Phone: +44', PHONE);
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
    proxy: {
      server: 'http://geo.iproyal.com:12321',
      username: 'cZTQcMdqzo3KrwTA',
      password: 'TkKGrrECccX08emT_country-gb_session-chloeuk001'
    }
  });
  
  const context = await browser.newContext({
    locale: 'en-GB',
    timezoneId: 'Europe/London'
  });
  
  const page = await context.newPage();
  
  // Check IP first
  console.log('Checking proxy IP...');
  try {
    await page.goto('https://ipv4.icanhazip.com/', { timeout: 30000 });
    const ip = await page.textContent('body');
    console.log('Proxy IP:', ip.trim());
  } catch (e) {
    console.log('IP check failed, continuing anyway...');
  }
  
  console.log('Loading TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  });
  
  await page.waitForTimeout(3000);
  
  // Handle cookie banner
  try {
    const allowBtn = page.locator('button:has-text("Allow all")');
    if (await allowBtn.isVisible({ timeout: 2000 })) {
      await allowBtn.click();
      console.log('Accepted cookies');
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
  
  // Handle EU notice
  try {
    const gotItBtn = page.locator('text="Got it"');
    if (await gotItBtn.isVisible({ timeout: 1000 })) {
      await gotItBtn.click();
      console.log('Dismissed EU notice');
    }
  } catch (e) {}
  
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-uk-proxy-page.png' });
  console.log('Page loaded');
  
  // Fill birthday using dropdowns
  const monthDropdown = page.locator('div[role="combobox"]').first();
  await monthDropdown.click();
  await page.waitForTimeout(300);
  const mayOption = page.locator('[role="option"]').filter({ hasText: /^May$/ });
  await mayOption.click();
  console.log('Month: May');
  
  await page.waitForTimeout(300);
  
  const dayDropdown = page.locator('div[role="combobox"]').nth(1);
  await dayDropdown.click();
  await page.waitForTimeout(300);
  const day22 = page.locator('[role="option"]').filter({ hasText: /^22$/ });
  await day22.click();
  console.log('Day: 22');
  
  await page.waitForTimeout(300);
  
  const yearDropdown = page.locator('div[role="combobox"]').nth(2);
  await yearDropdown.click();
  await page.waitForTimeout(300);
  const year1988 = page.locator('[role="option"]').filter({ hasText: /^1988$/ });
  await year1988.click();
  console.log('Year: 1988');
  
  await page.waitForTimeout(500);
  
  // Change country code - look for the current prefix
  const countryCode = page.locator('text=/\\+\\d+/').first();
  const currentCode = await countryCode.textContent().catch(() => '+1');
  console.log('Current country code:', currentCode);
  
  if (!currentCode.includes('+44')) {
    // Click on country code area
    await countryCode.click();
    await page.waitForTimeout(500);
    
    // Search for UK
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('United Kingdom');
      await page.waitForTimeout(500);
    }
    
    // Click UK option
    const ukOption = page.locator('[role="option"]').filter({ hasText: /United Kingdom|UK|\+44/ }).first();
    await ukOption.click().catch(async () => {
      // Try clicking on +44 directly
      await page.locator('text="+44"').first().click();
    });
    console.log('Changed to UK +44');
  }
  
  await page.waitForTimeout(500);
  
  // Enter phone
  const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="Phone"]').first();
  await phoneInput.fill(PHONE);
  console.log('Phone entered:', PHONE);
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-uk-proxy-filled.png' });
  
  // Click Send code
  console.log('Clicking Send code...');
  const sendBtn = page.locator('button').filter({ hasText: /Send code/i }).first();
  await sendBtn.click({ force: true });
  
  console.log('✅ Send code clicked!');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-uk-proxy-after.png' });
  
  // Check page content
  const content = await page.content();
  if (content.includes('captcha')) {
    console.log('⚠️ CAPTCHA detected in page');
  }
  if (content.includes('6-digit') || content.includes('verification')) {
    console.log('✅ Code input appeared - SMS should arrive!');
  }
  
  console.log('Browser stays open. Checking 5sim...');
  await page.waitForTimeout(300000);
  await browser.close();
}

signup().catch(e => {
  console.error('Error:', e.message);
});
