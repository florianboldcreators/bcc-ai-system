const { GoLogin } = require('gologin');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';
const PROFILE_ID = '69c237157961c960feb0fa71'; // amy-brown-tiktok

async function main() {
  const GL = new GoLogin({
    token: TOKEN,
    profile_id: PROFILE_ID
  });

  console.log('Starting GoLogin browser for Brandon signup...');
  const { status, wsUrl } = await GL.start();
  console.log('Status:', status);
  console.log('WS:', wsUrl);
  
  // Navigate to TikTok signup
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    ignoreHTTPSErrors: true
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Check IP first
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 30000 });
  const ip = await page.evaluate(() => document.body.textContent.trim());
  console.log('IP:', ip);
  
  // Open TikTok signup
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  console.log('TikTok signup opened!');
  console.log('Browser will stay open for 10 minutes.');
  
  // Keep alive
  await new Promise(r => setTimeout(r, 600000));
  await GL.stop();
}

main().catch(console.error);
