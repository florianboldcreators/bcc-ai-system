const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');

const PROFILE_ID = '69c824ce81d2e60c5598ce87';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

async function main() {
  console.log('=== GOLOGIN SIGNUP ===');
  
  const GL = new GoLogin({
    token: TOKEN,
    profile_id: PROFILE_ID
  });

  console.log('Starting GoLogin profile...');
  const { status, wsUrl } = await GL.start();
  console.log('Status:', status);
  console.log('WebSocket:', wsUrl);

  if (wsUrl) {
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsUrl,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    
    await page.goto('https://ipv4.icanhazip.com/');
    const ip = await page.evaluate(() => document.body.textContent.trim());
    console.log('IP:', ip);

    await page.goto('https://www.tiktok.com/signup/phone-or-email/email', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.screenshot({ path: '/Users/florian/.openclaw/workspace/ronny-project/logs/gologin-1.png' });
    console.log('Screenshot saved');

    await GL.stop();
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
