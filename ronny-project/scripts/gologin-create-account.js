const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const GOLOGIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

// Accounts to create
const ACCOUNTS = [
  {
    profileId: '69c237157961c960feb0fa71', // amy-brown-tiktok
    email: 'chloemarie.santos@proton.me',
    password: 'Cm_Secure88!',
    dob: { month: 'Mai', day: '22', year: '1988' },
    name: 'Chloe'
  },
  {
    profileId: '69c237127961c960feb0f7c1', // mike-davis-tiktok  
    email: 'brandonjellis@proton.me',
    password: 'Bj_Secure77!',
    dob: { month: 'Juli', day: '8', year: '1995' },
    name: 'Brandon'
  },
  {
    profileId: '69c23713db1965a011390158', // lisa-chen-tiktok
    email: 'sophiakimx@proton.me',
    password: 'Sk_Secure99!',
    dob: { month: 'November', day: '3', year: '1999' },
    name: 'Sophia'
  }
];

async function createTikTokAccount(account) {
  console.log(`\n🚀 Starting account creation for ${account.name}...`);
  
  const GL = new GoLogin({
    token: GOLOGIN_TOKEN,
    profile_id: account.profileId,
  });

  const { status, wsUrl } = await GL.start();
  console.log(`Profile started, wsUrl: ${wsUrl}`);
  
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  
  try {
    // Go to TikTok signup
    await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('Loaded signup page');
    
    // Wait for form
    await page.waitForSelector('input[placeholder*="E-Mail"]', { timeout: 10000 });
    
    // Select birthday
    // Month
    await page.click('[aria-label*="Monat"]');
    await page.waitForTimeout(500);
    await page.click(`[role="option"]:has-text("${account.dob.month}")`);
    
    // Day
    await page.click('[aria-label*="Tag"]');
    await page.waitForTimeout(500);
    await page.click(`[role="option"]:has-text("${account.dob.day}")`);
    
    // Year
    await page.click('[aria-label*="Jahr"]');
    await page.waitForTimeout(500);
    await page.click(`[role="option"]:has-text("${account.dob.year}")`);
    
    // Enter email
    await page.type('input[placeholder*="E-Mail"]', account.email, { delay: 50 });
    
    // Enter password
    await page.type('input[placeholder*="Passwort"]', account.password, { delay: 50 });
    
    console.log('Form filled, clicking send code...');
    
    // Click send code
    await page.click('button:has-text("Code senden")');
    
    // Wait for code input
    console.log(`⏳ Waiting for verification code for ${account.email}...`);
    console.log('Check ProtonMail for the code!');
    
    // Keep browser open for manual code entry
    await page.waitForTimeout(120000); // 2 minutes
    
  } catch (error) {
    console.error(`Error creating account: ${error.message}`);
  } finally {
    await browser.close();
    await GL.stop();
  }
}

// Run for first account
createTikTokAccount(ACCOUNTS[0]);
