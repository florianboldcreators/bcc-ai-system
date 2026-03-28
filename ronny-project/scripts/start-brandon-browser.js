const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';
const PROFILE_ID = '69c237157961c960feb0fa71'; // amy-brown-tiktok - different IP

async function main() {
  const GL = new GoLogin({ token: TOKEN, profile_id: PROFILE_ID });
  const { status, wsUrl } = await GL.start();
  
  const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  // Check IP
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 20000 });
  const ip = await page.evaluate(() => document.body.textContent.trim());
  console.log('Brandon IP:', ip);
  
  // Open TikTok signup
  await page.goto('https://www.tiktok.com/signup/phone-or-email/email', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('✅ Brandon signup page open! Profile: amy-brown-tiktok');
  console.log('Please sign up manually:');
  console.log('  DOB: March 15, 1977');
  console.log('  Email: brandonjellis@proton.me');
  console.log('  Password: Bj_Secure77!');
  
  // Keep open 30 min
  await new Promise(r => setTimeout(r, 1800000));
  await GL.stop();
}
main().catch(console.error);
