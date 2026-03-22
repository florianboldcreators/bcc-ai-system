import http from 'http';
import net from 'net';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const FIVESIM_KEY = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDI2MDU1NjEsImlhdCI6MTc3MTA2OTU2MSwicmF5IjoiZTY3ZjEzNTA3NmUyMWIzMmU2NzU5NTZjNWNkYTBkM2UiLCJzdWIiOjM4MDcwMjN9.hQpfImdN_LPno91xiJC35qP2ExfGnApXwl2TLQ7GvCf4du7qWSzkmg-Pf1MgUv8ZR4z2J0RNZwjrjT86hqm6Oxn8kx5Yd-9XL6NVzQrLzZfLSn8iY08QZYU84yG7wi-jaRVjf07xmwFvXNi5uGwvt_dU09Q5WK2lJ1NMCmqKxBswbnjoaHDedCF5-_ARTWxoKjS-A9GsP9lFKIyXqg8Tub1xMs1M7BWVecNG7WahVYZ7riKMIKWyZsyP6RyBo-tv3duGpaQwCz54ySOUX0C9MLLC_RkVZsewadH0bUPGEV_ga8FOe0DykEjfhCfpyVG-OPSRO7yo1vTEXCXNiv2inw';
const SS = '/Users/florian/.openclaw/workspace/comment-tool/screenshots';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

async function api5sim(path, method = 'GET') {
  const r = await fetch(`https://5sim.net/v1/user/${path}`, { method, headers: { Authorization: `Bearer ${FIVESIM_KEY}` } });
  if (!r.ok && method === 'GET') throw new Error(`5sim ${r.status}: ${await r.text()}`);
  return r.json().catch(() => ({}));
}

// ── INLINE PROXY ──
const AUTH = 'Basic ' + Buffer.from(`cZTQcMdqzo3KrwTA:TkKGrrECccX08emT_country-us_session-${Date.now()}`).toString('base64');

function startProxy() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = http.request({ host:'geo.iproyal.com', port:12321, method:req.method, path:req.url,
        headers:{...req.headers,'Proxy-Authorization':AUTH}}, pr=>{res.writeHead(pr.statusCode,pr.headers);pr.pipe(res);});
      req.pipe(p); p.on('error',()=>{res.writeHead(502);res.end();});
    });
    srv.on('connect', (req,cs,head)=>{
      const us=net.connect(12321,'geo.iproyal.com',()=>{
        us.write(`CONNECT ${req.url} HTTP/1.1\r\nHost: ${req.url}\r\nProxy-Authorization: ${AUTH}\r\n\r\n`);
      });
      let d=false;
      us.once('data',c=>{if(!d){d=true;if(c.toString().includes('200')){cs.write('HTTP/1.1 200 OK\r\n\r\n');if(head.length)us.write(head);us.pipe(cs);cs.pipe(us);}else{cs.end();us.end();}}});
      us.on('error',()=>cs.end()); cs.on('error',()=>us.end());
    });
    srv.listen(18080,'127.0.0.1',()=>{console.log('✅ Proxy ready');resolve(srv);});
  });
}

// ── MAIN ──
async function main() {
  console.log('🚀 TikTok All-in-One Signup\n');
  
  const proxyServer = await startProxy();
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      '--proxy-server=http://127.0.0.1:18080',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
      '--disable-features=WebRtcHideLocalIpsWithMdns'
    ],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Anti-detection
  await page.evaluateOnNewDocument(() => {
    // Kill WebRTC
    delete window.RTCPeerConnection;
    delete window.webkitRTCPeerConnection;
    delete window.mozRTCPeerConnection;
    
    // Fix webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    
    // Fix plugins (headless has 0 plugins)
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5].map(() => ({ name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' }))
    });
    
    // Fix languages
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    
    // Fix permissions
    const origQuery = window.navigator.permissions?.query;
    if (origQuery) {
      window.navigator.permissions.query = (params) => (
        params.name === 'notifications' 
          ? Promise.resolve({ state: Notification.permission }) 
          : origQuery(params)
      );
    }
  });
  
  // Buy number
  console.log('📱 Buying US number (virtual28)...');
  let order;
  try {
    order = await api5sim('buy/activation/usa/virtual28/tiktok');
    console.log(`  ✅ ${order.phone} (Order: ${order.id}, $${order.price})`);
  } catch(e) {
    console.error(`  ❌ ${e.message}`);
    await browser.close(); proxyServer.close(); process.exit(1);
  }
  
  const phoneLocal = order.phone.replace('+1', '');
  
  try {
    // Go to signup
    console.log('\n📋 TikTok signup...');
    await page.goto('https://www.tiktok.com/signup/phone-or-email/phone', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await page.screenshot({ path: `${SS}/a01-loaded.png` });
    
    // Banners
    console.log('🍪 Banners...');
    for (let i = 0; i < 5; i++) {
      const c = await page.evaluate(() => {
        for (const b of document.querySelectorAll('button')) {
          const t = b.textContent.toLowerCase();
          if (t.includes('accept')||t.includes('allow')||t.includes('got it')||t.includes('decline optional')||t.includes('alle')||t.includes('verstanden')) { b.click(); return true; }
        }
        return false;
      });
      if (!c) break;
      await sleep(800);
    }
    await sleep(1500);
    
    // Birthday
    const m = rand(1,12), d = rand(1,28), y = rand(1990,1998);
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    console.log(`🎂 Birthday: ${months[m-1]} ${d}, ${y}`);
    
    for (let i = 0; i < 3; i++) {
      const cbs = await page.$$('[role="combobox"]');
      if (cbs.length < 3) { await sleep(500); continue; }
      
      if (i === 0) {
        await cbs[0].click();
        await sleep(500);
        await page.evaluate(mn => { for(const o of document.querySelectorAll('[role="option"]')) if(o.textContent.trim()===mn){o.click();return;} }, months[m-1]);
        await sleep(600);
      } else if (i === 1) {
        const cbs2 = await page.$$('[role="combobox"]');
        await cbs2[1].click();
        await sleep(500);
        await page.evaluate(dn => { for(const o of document.querySelectorAll('[role="option"]')) if(o.textContent.trim()===String(dn)){o.click();return;} }, d);
        await sleep(600);
      } else {
        const cbs3 = await page.$$('[role="combobox"]');
        await cbs3[2].click();
        await sleep(500);
        await page.evaluate(yr => { for(const o of document.querySelectorAll('[role="option"]')) if(o.textContent.trim()===String(yr)){o.click();return;} }, y);
        await sleep(600);
      }
    }
    
    // Verify birthday
    const bday = await page.evaluate(() => {
      const cbs = document.querySelectorAll('[role="combobox"]');
      return Array.from(cbs).slice(0,3).map(c => {
        const text = c.textContent.trim();
        // First "word" is the selected value
        return text.replace(/January|February|March|April|May|June|July|August|September|October|November|December/g, (m, offset) => offset === 0 ? m : '').split(/(?=[A-Z])/).filter(Boolean)[0] || text.substring(0, 15);
      }).join(' / ');
    });
    console.log(`  Set: ${bday}`);
    await page.screenshot({ path: `${SS}/a02-birthday.png` });
    
    // Phone — must trigger React's synthetic events properly
    console.log(`📲 Phone: ${phoneLocal}`);
    const pi = await page.$('input[placeholder*="Phone"], input[placeholder*="phone"], input[placeholder*="Telefon"]');
    if (pi) {
      await pi.click({ clickCount: 3 }); // Select all existing text
      await sleep(200);
      // Type each character using keyboard (this triggers React events properly)
      await page.keyboard.type(phoneLocal, { delay: rand(50, 120) });
    }
    await sleep(1500);
    
    // Verify the value was set in React state
    const phoneVal = await page.evaluate(() => {
      const inp = document.querySelector('input[placeholder*="Phone"], input[placeholder*="phone"], input[placeholder*="Telefon"]');
      return inp ? inp.value : 'NOT FOUND';
    });
    console.log(`  📋 Input value: "${phoneVal}"`);
    await page.screenshot({ path: `${SS}/a03-phone.png` });
    
    // Monitor network requests to see if Send Code triggers API call
    const apiCalls = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('send_code') || url.includes('sms') || url.includes('verify') || url.includes('captcha') || url.includes('passport')) {
        apiCalls.push({ url: url.substring(0, 120), method: req.method() });
        console.log(`  🌐 API: ${req.method()} ${url.substring(0, 100)}`);
      }
    });
    page.on('response', res => {
      const url = res.url();
      if (url.includes('send_code') || url.includes('sms') || url.includes('verify') || url.includes('captcha') || url.includes('passport')) {
        console.log(`  🌐 Response: ${res.status()} ${url.substring(0, 100)}`);
      }
    });
    
    // Send Code — use real mouse click via CDP
    console.log('📨 Send Code...');
    let sent = false;
    for (let i = 0; i < 20; i++) {
      // Find button position and click with real mouse events
      const btnInfo = await page.evaluate(() => {
        for (const b of document.querySelectorAll('button')) {
          const t = b.textContent.toLowerCase();
          if ((t.includes('send code')||t.includes('code senden'))&&!b.disabled) {
            const rect = b.getBoundingClientRect();
            return { x: rect.x + rect.width/2, y: rect.y + rect.height/2, found: true, enabled: true };
          }
          if (t.includes('send code')||t.includes('code senden')) {
            return { found: true, enabled: false };
          }
        }
        return { found: false };
      });
      
      if (btnInfo.found && btnInfo.enabled) {
        // Method 1: Focus the button then Enter
        await page.evaluate(() => {
          for (const b of document.querySelectorAll('button')) {
            const t = b.textContent.toLowerCase();
            if ((t.includes('send code')||t.includes('code senden'))&&!b.disabled) {
              b.focus();
              return;
            }
          }
        });
        await sleep(200);
        await page.keyboard.press('Enter');
        console.log(`  ✅ Focus+Enter on Send Code`);
        
        // Also try mouse click as backup
        await sleep(500);
        await page.mouse.move(btnInfo.x + rand(-3,3), btnInfo.y + rand(-3,3));
        await sleep(rand(50,150));
        await page.mouse.down();
        await sleep(rand(30,80));
        await page.mouse.up();
        console.log(`  ✅ Also mouse-clicked at (${Math.round(btnInfo.x)}, ${Math.round(btnInfo.y)})`);
        sent = true;
        break;
      }
      if (i % 4 === 0 && i > 0) console.log(`  ⏳ found=${btnInfo.found} enabled=${btnInfo.enabled}...`);
      await sleep(500);
    }
    
    if (!sent) {
      await page.screenshot({ path: `${SS}/a-err-disabled.png` });
      console.error('  ❌ Button never enabled');
      throw new Error('Send Code button disabled');
    }
    
    // Wait and check multiple times — CAPTCHA may appear after delay
    console.log('  ⏳ Waiting for response...');
    await sleep(3000);
    await page.screenshot({ path: `${SS}/a04-after-send-3s.png` });
    
    // Check for iframes (CAPTCHA often loads in iframe)
    const iframes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src, visible: f.offsetParent !== null, w: f.offsetWidth, h: f.offsetHeight }));
    });
    if (iframes.length) console.log(`  🖼️ Iframes: ${JSON.stringify(iframes)}`);
    
    // Check for new DOM elements that appeared after click
    const domChanges = await page.evaluate(() => {
      const allDivs = document.querySelectorAll('div[class], div[id]');
      const suspicious = [];
      for (const d of allDivs) {
        const id = d.id || '';
        const cls = d.className || '';
        const style = d.getAttribute('style') || '';
        if (id.includes('captcha')||id.includes('verify')||id.includes('arkose')||id.includes('challenge')||
            cls.includes('captcha')||cls.includes('verify')||cls.includes('modal')||cls.includes('overlay')||cls.includes('popup')||
            (style.includes('z-index') && parseInt(style.match(/z-index:\s*(\d+)/)?.[1]||0) > 100)) {
          suspicious.push({ id: id.substring(0,30), cls: cls.substring(0,50), visible: d.offsetParent !== null });
        }
      }
      return suspicious;
    });
    if (domChanges.length) console.log(`  🔍 Suspicious DOM: ${JSON.stringify(domChanges)}`);
    else console.log('  🔍 No suspicious DOM elements found');
    
    await sleep(3000);
    await page.screenshot({ path: `${SS}/a04-after-send-6s.png` });
    
    // Check for iframes AGAIN after 6s
    const iframes2 = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src, w: f.offsetWidth, h: f.offsetHeight }));
    });
    if (iframes2.length) console.log(`  🖼️ Iframes (6s): ${JSON.stringify(iframes2)}`);
    
    // Check status
    const status = await page.evaluate(() => {
      const t = document.body.innerText;
      if (t.includes('Maximum')||t.includes('Zu viele')||t.includes('Too many')) return 'RATE_LIMITED';
      if (t.includes('Resend code')||t.includes('Code erneut')||t.includes('erneut senden')) return 'CODE_SENT';
      // Check for captcha
      const hasIframe = document.querySelectorAll('iframe').length > 0;
      const hasCaptchaDiv = !!document.querySelector('[id*="captcha"], [class*="captcha"], [id*="arkose"], [class*="verify"]');
      if (hasIframe || hasCaptchaDiv) return 'CAPTCHA';
      return 'UNKNOWN';
    });
    console.log(`  📊 ${status}`);
    
    if (status === 'RATE_LIMITED') {
      throw new Error('Rate limited');
    }
    
    if (status !== 'CODE_SENT') {
      console.log('  ⚠️ Unexpected status, checking for captcha...');
      await page.screenshot({ path: `${SS}/a-status-unknown.png` });
    }
    
    // Wait for SMS
    console.log('\n📩 Waiting for SMS...');
    let code = null;
    const start = Date.now();
    while (Date.now() - start < 150000) {
      const result = await api5sim(`check/${order.id}`);
      if (result.sms?.length > 0) { code = result.sms[0].code; break; }
      console.log(`  ⏳ ${Math.round((Date.now()-start)/1000)}s...`);
      await sleep(5000);
    }
    
    if (!code) { throw new Error('No SMS received'); }
    console.log(`  ✅ Code: ${code}`);
    
    // Enter code
    console.log('🔑 Entering code...');
    const ci = await page.$('input[placeholder*="code"], input[placeholder*="Code"]');
    if (ci) {
      await ci.click();
      for (const ch of code) await ci.type(ch, { delay: rand(50, 120) });
    }
    await sleep(2000);
    
    // Click Next
    await page.evaluate(() => {
      for (const b of document.querySelectorAll('button')) {
        const t = b.textContent.toLowerCase();
        if ((t.includes('next')||t.includes('weiter')||t.includes('sign up'))&&!b.disabled) { b.click(); return; }
      }
    });
    await sleep(5000);
    await page.screenshot({ path: `${SS}/a05-after-next.png` });
    
    // Password?
    const pwd = await page.$('input[type="password"]');
    if (pwd) {
      const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
      let pw = 'Rn_';
      for (let i = 0; i < 12; i++) pw += chars[rand(0, chars.length-1)];
      console.log(`🔐 Password: ${pw}`);
      await pwd.click();
      await pwd.type(pw, { delay: 60 });
      await sleep(1000);
      await page.evaluate(() => {
        for (const b of document.querySelectorAll('button')) {
          const t = b.textContent.toLowerCase();
          if ((t.includes('next')||t.includes('sign up'))&&!b.disabled) { b.click(); return; }
        }
      });
      await sleep(5000);
    }
    
    // Result
    const url = page.url();
    await page.screenshot({ path: `${SS}/a06-final.png` });
    
    console.log('\n═══════════════════════════════════════');
    console.log(`URL: ${url}`);
    console.log(`Phone: ${order.phone}`);
    if (!url.includes('signup')) {
      console.log('✅ ACCOUNT CREATED!');
      await api5sim(`finish/${order.id}`);
    } else {
      console.log('⚠️ Check screenshots');
    }
    console.log('═══════════════════════════════════════');
    
  } catch(e) {
    console.error(`\n❌ ${e.message}`);
    try { await page.screenshot({ path: `${SS}/a-err.png` }); } catch {}
    try { await api5sim(`cancel/${order.id}`); } catch {}
  }
  
  await browser.close();
  proxyServer.close();
}

main().catch(e => { console.error(e); process.exit(1); });
