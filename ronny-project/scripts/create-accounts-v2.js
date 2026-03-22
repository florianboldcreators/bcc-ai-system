/**
 * TikTok Account Creator v2
 * Uses Playwright Firefox + intercepts the XHR request to send code
 * Instead of clicking the button (which TikTok blocks), we:
 * 1. Fill the form normally
 * 2. Intercept the network request that Send Code WOULD make
 * 3. Replay it with the right cookies/tokens from the page context
 */

import { firefox } from 'playwright';
import http from 'http';
import net from 'net';
import fs from 'fs';
import path from 'path';

const ACCOUNTS_DIR = '/Users/florian/.openclaw/workspace/comment-tool/accounts';
const SS_DIR = '/Users/florian/.openclaw/workspace/comment-tool/screenshots/auto';
const MAILTM_PASSWORD = 'TikTok2026_Ronny!';

fs.mkdirSync(ACCOUNTS_DIR, { recursive: true });
fs.mkdirSync(SS_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// ── MAIL.TM ──
async function createEmail() {
  const domRes = await fetch('https://api.mail.tm/domains');
  const domData = await domRes.json();
  const domain = domData['hydra:member']?.[0]?.domain || 'sharebot.net';
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let addr = '';
  for (let i = 0; i < 12; i++) addr += chars[rand(0, chars.length - 1)];
  const email = `${addr}@${domain}`;
  
  await fetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password: MAILTM_PASSWORD })
  });
  
  const tokenRes = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password: MAILTM_PASSWORD })
  });
  const tokenData = await tokenRes.json();
  return { email, token: tokenData.token };
}

async function pollForCode(token, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch('https://api.mail.tm/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const msgs = data['hydra:member'] || [];
      if (msgs.length > 0) {
        const msgRes = await fetch(`https://api.mail.tm/messages/${msgs[0].id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const raw = await msgRes.text();
        const codes = raw.match(/\b\d{6}\b/g);
        if (codes) return codes[0];
      }
    } catch {}
    process.stdout.write('.');
    await sleep(3000);
  }
  return null;
}

// ── LOCAL PROXY FORWARDER ──
function startProxy() {
  const session = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const AUTH = 'Basic ' + Buffer.from(`cZTQcMdqzo3KrwTA:TkKGrrECccX08emT_country-us_${session}`).toString('base64');
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = http.request({ host:'geo.iproyal.com', port:12321, method:req.method, path:req.url,
        headers:{...req.headers,'Proxy-Authorization':AUTH}}, pr=>{res.writeHead(pr.statusCode,pr.headers);pr.pipe(res);});
      req.pipe(p); p.on('error',()=>{try{res.writeHead(502);res.end();}catch{}});
    });
    srv.on('connect', (req,cs,head)=>{
      const us=net.connect(12321,'geo.iproyal.com',()=>{
        us.write(`CONNECT ${req.url} HTTP/1.1\r\nHost: ${req.url}\r\nProxy-Authorization: ${AUTH}\r\n\r\n`);
      });
      let d=false;
      us.once('data',c=>{if(!d){d=true;if(c.toString().includes('200')){cs.write('HTTP/1.1 200 OK\r\n\r\n');if(head.length)us.write(head);us.pipe(cs);cs.pipe(us);}else{cs.end();us.end();}}});
      us.on('error',()=>cs.end()); cs.on('error',()=>us.end());
    });
    srv.listen(0, '127.0.0.1', () => resolve({ server: srv, port: srv.address().port }));
  });
}

async function createAccount(accountNum) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🚀 Account #${accountNum}`);
  console.log(`${'═'.repeat(50)}`);
  
  // Start local proxy with unique session = unique IP
  const { server: proxyServer, port: proxyPort } = await startProxy();
  console.log(`  🌐 Proxy :${proxyPort}`);
  
  // Create email
  console.log('  📧 Creating email...');
  const { email, token } = await createEmail();
  console.log(`  ✅ ${email}`);
  
  // Random data
  const pwChars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
  let tiktokPwd = 'Rn_';
  for (let i = 0; i < 12; i++) tiktokPwd += pwChars[rand(0, pwChars.length - 1)];
  
  const month = rand(0, 11);
  const day = rand(1, 28);
  const year = rand(1988, 1999);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  
  // Launch Firefox
  console.log('  🦊 Firefox...');
  const browser = await firefox.launch({
    headless: false,
    firefoxUserPrefs: {
      'media.peerconnection.enabled': false,
    },
    proxy: { server: `http://127.0.0.1:${proxyPort}` }
  });
  
  const context = await browser.newContext({
    locale: 'en-US',
    timezoneId: 'America/Chicago',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  
  // Monitor API calls
  let sendCodeResponse = null;
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('send_code') || url.includes('passport')) {
      try {
        const body = await response.json();
        console.log(`  🌐 ${url.substring(0, 80)} → ${JSON.stringify(body).substring(0, 100)}`);
        if (url.includes('send_code')) sendCodeResponse = body;
      } catch {}
    }
  });
  
  try {
    console.log('  📋 Loading...');
    await page.goto('https://www.tiktok.com/signup/phone-or-email/email', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // Language check
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Registrieren') || bodyText.includes('Geburtstag')) {
      throw new Error('German page - IP leak');
    }
    console.log('  ✅ English');
    
    // Banners
    for (let i = 0; i < 5; i++) {
      try {
        const btn = page.locator('button:has-text("Accept"), button:has-text("Decline optional")').first();
        if (await btn.isVisible({ timeout: 800 })) await btn.click();
        else break;
        await sleep(400);
      } catch { break; }
    }
    await sleep(1000);
    
    // Birthday
    console.log(`  🎂 ${months[month]} ${day}, ${year}`);
    await page.locator('[role="combobox"]').first().click();
    await sleep(300);
    await page.locator(`[role="option"]:has-text("${months[month]}")`).click();
    await sleep(300);
    
    await page.locator('[role="combobox"]').nth(1).click();
    await sleep(300);
    // For day, need exact match to avoid "12" matching "12", "122" etc
    await page.evaluate((d) => {
      for (const o of document.querySelectorAll('[role="option"]'))
        if (o.textContent.trim() === String(d)) { o.click(); return; }
    }, day);
    await sleep(300);
    
    await page.locator('[role="combobox"]').nth(2).click();
    await sleep(300);
    await page.locator(`[role="option"]:has-text("${year}")`).click();
    await sleep(300);
    
    // Email
    console.log(`  📧 ${email}`);
    await page.locator('input[placeholder*="email" i], input[name="email"], input[type="email"]').first().fill(email);
    await sleep(300);
    
    // Password
    console.log(`  🔑 ${tiktokPwd}`);
    await page.locator('input[type="password"]').first().fill(tiktokPwd);
    await sleep(1000);
    
    await page.screenshot({ path: `${SS_DIR}/acc${accountNum}-filled.png` });
    
    // Send Code - use page.evaluate to call the INTERNAL React handler
    console.log('  📨 Triggering Send Code via JS...');
    
    const sendResult = await page.evaluate(async () => {
      // Method: Find the button and trigger React's onClick through the fiber
      const buttons = document.querySelectorAll('button');
      let sendBtn = null;
      for (const b of buttons) {
        if (b.textContent.toLowerCase().includes('send code') && !b.disabled) {
          sendBtn = b;
          break;
        }
      }
      if (!sendBtn) return 'button not found or disabled';
      
      // Get React fiber to access onClick handler
      const fiberKey = Object.keys(sendBtn).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
      if (fiberKey) {
        let fiber = sendBtn[fiberKey];
        // Walk up to find onClick
        while (fiber) {
          if (fiber.memoizedProps?.onClick) {
            fiber.memoizedProps.onClick({ preventDefault: () => {}, stopPropagation: () => {} });
            return 'react onClick triggered';
          }
          fiber = fiber.return;
        }
      }
      
      // Fallback: dispatch a trusted-looking event sequence
      const rect = sendBtn.getBoundingClientRect();
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;
      
      for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        sendBtn.dispatchEvent(new PointerEvent(type, {
          bubbles: true, cancelable: true, composed: true,
          clientX: x, clientY: y, screenX: x, screenY: y,
          pointerId: 1, pointerType: 'mouse',
          button: 0, buttons: type.includes('down') ? 1 : 0,
        }));
      }
      
      return 'events dispatched';
    });
    
    console.log(`  📋 ${sendResult}`);
    await sleep(6000);
    await page.screenshot({ path: `${SS_DIR}/acc${accountNum}-after-send.png` });
    
    // Check status
    const afterText = await page.textContent('body');
    if (afterText.includes('Maximum') || afterText.includes('Too many')) {
      throw new Error('Rate limited');
    }
    
    const hasCooldown = afterText.includes('Resend') || afterText.includes('erneut');
    if (!hasCooldown) {
      console.log('  ⚠️ No cooldown detected, checking if code was sent...');
      // Wait a bit more and check for API response
      await sleep(5000);
      
      if (!sendCodeResponse) {
        // Last resort: Try keyboard shortcut (Tab to button, Enter)
        console.log('  🔄 Trying keyboard approach...');
        // Focus the send code button via Tab navigation
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press('Tab');
          await sleep(100);
        }
        await page.keyboard.press('Enter');
        await sleep(5000);
        
        const afterText2 = await page.textContent('body');
        if (afterText2.includes('Maximum') || afterText2.includes('Too many')) {
          throw new Error('Rate limited after keyboard');
        }
        if (!afterText2.includes('Resend') && !afterText2.includes('erneut')) {
          throw new Error('Send Code failed - no cooldown');
        }
      }
    }
    
    console.log('  ✅ Code sent!');
    
    // Poll for code
    console.log('  📩 Waiting for code');
    const code = await pollForCode(token);
    if (!code) throw new Error('No code received');
    console.log(`\n  ✅ Code: ${code}`);
    
    // Enter code
    await page.locator('input[placeholder*="code" i]').first().fill(code);
    await sleep(1000);
    
    // Submit
    try {
      await page.locator('button:has-text("Next"), button:has-text("Sign up")').first().click({ timeout: 3000 });
    } catch {
      await page.keyboard.press('Enter');
    }
    await sleep(8000);
    
    await page.screenshot({ path: `${SS_DIR}/acc${accountNum}-final.png` });
    
    // Get username
    let username = 'unknown';
    const finalUrl = page.url();
    if (!finalUrl.includes('signup')) {
      try {
        await page.goto('https://www.tiktok.com/profile', { waitUntil: 'networkidle', timeout: 15000 });
        await sleep(3000);
        const profileUrl = page.url();
        username = profileUrl.includes('@') ? profileUrl.split('@')[1].split('?')[0] : 'check-manually';
      } catch {}
    }
    
    console.log(`\n  ✅ #${accountNum}: @${username} | ${email}`);
    
    // Save
    fs.writeFileSync(path.join(ACCOUNTS_DIR, `ronny-account-${accountNum}.md`),
`# TikTok Account #${accountNum}
**Created:** ${new Date().toISOString()}
**Username:** ${username}
**Email:** ${email}
**Email PW:** ${MAILTM_PASSWORD}
**TikTok PW:** ${tiktokPwd}
**Birthday:** ${months[month]} ${day}, ${year}
`);
    
    return { success: true, username, email, password: tiktokPwd };
    
  } catch (error) {
    console.error(`\n  ❌ ${error.message}`);
    try { await page.screenshot({ path: `${SS_DIR}/acc${accountNum}-error.png` }); } catch {}
    return { success: false, error: error.message, email };
  } finally {
    await browser.close();
    proxyServer.close();
  }
}

async function main() {
  const START = 2;
  const COUNT = 9;
  console.log(`\n🚀 Creating ${COUNT} accounts\n`);
  
  const results = [];
  for (let i = START; i < START + COUNT; i++) {
    const r = await createAccount(i);
    results.push({ num: i, ...r });
    
    // Notify after each account
    console.log(`\n📊 Progress: ${results.filter(x=>x.success).length} created, ${results.filter(x=>!x.success).length} failed (${i-START+1}/${COUNT})\n`);
    
    const wait = r.success ? rand(45, 90) : 15;
    if (i < START + COUNT - 1) {
      console.log(`⏳ Next in ${wait}s...`);
      await sleep(wait * 1000);
    }
  }
  
  // Summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log('📊 FINAL');
  console.log(`${'═'.repeat(50)}`);
  results.forEach(r => console.log(r.success ? `  ✅ #${r.num}: @${r.username}` : `  ❌ #${r.num}: ${r.error}`));
  
  fs.writeFileSync(path.join(ACCOUNTS_DIR, 'SUMMARY.md'),
`# Account Summary - ${new Date().toISOString()}
${results.map(r => r.success ? `✅ #${r.num}: @${r.username} | ${r.email} | ${r.password}` : `❌ #${r.num}: ${r.error}`).join('\n')}
`);
}

main().catch(console.error);
