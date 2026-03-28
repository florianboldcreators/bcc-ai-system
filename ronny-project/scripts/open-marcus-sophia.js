const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');
const delay = ms => new Promise(r => setTimeout(r, ms));

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

async function openBrowser(name, profileId) {
  const GL = new GoLogin({ token: TOKEN, profile_id: profileId });
  const { wsUrl } = await GL.start();
  const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://www.tiktok.com/login/phone-or-email/email', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log(`✅ ${name} browser open — please login manually`);
  console.log(`   Profile: ${profileId}`);
  // Keep alive 30 min
  await delay(1800000);
  await GL.stop();
}

// Open Marcus and Sophia browsers in parallel
Promise.all([
  openBrowser('MARCUS', '69c237127961c960feb0f7c1'),
  openBrowser('SOPHIA', '69c237114f7abb90b3b43fd2')
]).catch(console.error);
