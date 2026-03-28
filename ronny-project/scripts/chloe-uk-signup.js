const { chromium } = require('playwright');

const ORDER_ID = '977981962';
const PHONE = '7575478989'; // UK number without +44

async function signup() {
  console.log('=== CHLOE UK PHONE SIGNUP ===');
  console.log('Phone: +44', PHONE);
  console.log('5sim Order:', ORDER_ID);
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  
  const page = await browser.newPage();
  
  // Use English locale
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-GB,en;q=0.9'
  });
  
  console.log('Loading TikTok...');
  await page.goto('https://www.tiktok.com/signup/phone-or-email', {
    waitUntil: 'domcontentloaded',
    timeout: 90000
  });
  
  await page.waitForTimeout(5000);
  console.log('Page loaded');
  
  // Screenshot initial
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-uk-initial.png' });
  
  // Fill birthday - try different selectors
  try {
    // Month
    const monthSelect = page.locator('select').first();
    await monthSelect.selectOption({ index: 5 }); // May
    console.log('Month selected');
    
    // Day  
    const daySelect = page.locator('select').nth(1);
    await daySelect.selectOption({ index: 22 });
    console.log('Day selected');
    
    // Year
    const yearSelect = page.locator('select').nth(2);
    await yearSelect.selectOption('1988');
    console.log('Year selected');
  } catch (e) {
    console.log('Select approach failed, trying click approach...');
    
    // Click on month dropdown
    await page.click('[data-e2e="month-select"]').catch(() => {});
    await page.click('[aria-label*="Month"], [aria-label*="Monat"]').catch(async () => {
      const monthBtn = page.locator('div[role="combobox"]').first();
      await monthBtn.click();
    });
    await page.waitForTimeout(500);
    await page.click('[role="option"]:has-text("May"), [role="option"]:has-text("Mai")');
    
    await page.click('[aria-label*="Day"], [aria-label*="Tag"]').catch(async () => {
      const dayBtn = page.locator('div[role="combobox"]').nth(1);
      await dayBtn.click();
    });
    await page.waitForTimeout(500);
    await page.click('[role="option"]:has-text("22")');
    
    await page.click('[aria-label*="Year"], [aria-label*="Jahr"]').catch(async () => {
      const yearBtn = page.locator('div[role="combobox"]').nth(2);
      await yearBtn.click();
    });
    await page.waitForTimeout(500);
    await page.click('[role="option"]:has-text("1988")');
  }
  
  console.log('Birthday filled');
  await page.waitForTimeout(1000);
  
  // Change country code to UK (+44)
  const countrySelector = page.locator('[data-e2e="country-code"]').first();
  if (await countrySelector.count() > 0) {
    await countrySelector.click();
    await page.waitForTimeout(500);
    await page.click('[role="option"]:has-text("+44")');
    console.log('Country code +44 selected');
  } else {
    // Try finding the +1 dropdown
    const phonePrefix = page.locator('text="+1"').first();
    if (await phonePrefix.count() > 0) {
      await phonePrefix.click();
      await page.waitForTimeout(500);
      // Type to search
      await page.keyboard.type('United Kingdom');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      console.log('Country code changed via search');
    }
  }
  
  await page.waitForTimeout(500);
  
  // Enter phone number
  const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="Telefon"]').first();
  await phoneInput.fill(PHONE);
  console.log('Phone entered');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-uk-filled.png' });
  
  // Click send code
  console.log('Clicking Send Code...');
  const sendBtn = page.locator('button:has-text("Send code"), button:has-text("Code senden")').first();
  await sendBtn.click({ force: true });
  
  console.log('✅ Send code clicked! Waiting for SMS...');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/chloe-uk-after.png' });
  
  // Keep browser open
  console.log('Browser stays open. Check 5sim for code!');
  await page.waitForTimeout(300000);
  await browser.close();
}

signup().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
