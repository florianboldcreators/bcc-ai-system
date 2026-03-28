const puppeteer = require('puppeteer-core');

async function loginChloe() {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://127.0.0.1:18800/devtools/browser/',
    ignoreHTTPSErrors: true
  });

  const pages = await browser.pages();
  let page = null;
  for (const p of pages) {
    const url = await p.url();
    if (url.includes('tiktok.com/login')) {
      page = p;
      break;
    }
  }

  if (!page) {
    console.log('No TikTok login page found');
    await browser.disconnect();
    return;
  }

  console.log('Found TikTok login page');
  
  // Click email field
  await page.click('input[name="username"]', { delay: 100 }).catch(() => {});
  await page.focus('input[placeholder*="E-Mail"], input[type="text"]');
  await page.keyboard.type('chloemarie.santos@proton.me', { delay: 80 });
  console.log('Email typed');
  
  await new Promise(r => setTimeout(r, 500));
  
  // Click password field
  await page.focus('input[type="password"]');
  await page.keyboard.type('Cm_Secure88!', { delay: 80 });
  console.log('Password typed');

  await new Promise(r => setTimeout(r, 1000));
  
  // Click login button
  const btn = await page.$('button[data-e2e="login-button"], button[type="submit"]');
  if (btn) {
    await btn.click();
    console.log('Login button clicked');
  } else {
    await page.keyboard.press('Enter');
    console.log('Pressed Enter');
  }
  
  await new Promise(r => setTimeout(r, 5000));
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);
  
  await browser.disconnect();
}

loginChloe().catch(console.error);
