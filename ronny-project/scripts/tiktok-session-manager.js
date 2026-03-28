#!/usr/bin/env node
/**
 * TikTok Session Manager
 * Handles login, session persistence, and warming for all accounts
 */

const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

const ACCOUNTS = [
  { id: 'tyler',  email: 'tylerwestbrook94@proton.me',  password: 'Tw_Secure94!', profile: '69c2370f15ad6c33e2e4dd0a', username: 'tyler.westbrook94' },
  { id: 'chloe',  email: 'chloemarie.santos@proton.me', password: 'Cm_Secure88!', profile: '69c23716ac926b95f05793a9', username: 'kimvirginiaaah._' },
  { id: 'marcus', email: 'marcus.reed.1991@proton.me',  password: 'Mr_Secure91!', profile: '69c237127961c960feb0f7c1', username: 'user4783749392230' },
  { id: 'sophia', email: 'sophiakimx@proton.me',        password: 'Sk_Secure99!', profile: '69c237114f7abb90b3b43fd2', username: 'user4148459812842' },
];

const CAR_SEARCHES = ['bmw m4', 'porsche 911', 'bmw drift', 'supercar exhaust', 'car edit 4k', 'ferrari sound'];
const LOG_FILE = path.join(__dirname, '../logs/session-manager.log');
const STATE_FILE = path.join(__dirname, '../data/session-state.json');

const delay = (min, max) => new Promise(r => setTimeout(r, max ? Math.floor(Math.random()*(max-min))+min : min));

function log(accountId, msg, level='INFO') {
  const ts = new Date().toISOString().slice(11,19);
  const icon = {INFO:'📋',SUCCESS:'✅',WARN:'⚠️',ERROR:'❌',ACTION:'🎯'}[level]||'📋';
  const line = `[${ts}] ${icon} [${accountId}] ${msg}`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG_FILE), {recursive:true});
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE,'utf8')); } catch { return {}; }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), {recursive:true});
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function loginToTikTok(page, account) {
  log(account.id, 'Logging in via email...');
  
  await page.goto('https://www.tiktok.com/login/phone-or-email/email', {
    waitUntil: 'domcontentloaded', timeout: 60000
  });
  await delay(3000, 5000);
  
  // Fill email
  await page.click('input[type="text"], input[name="username"]').catch(()=>{});
  await delay(500, 1000);
  await page.keyboard.type(account.email, { delay: 80 });
  await delay(500, 800);
  
  // Fill password
  await page.click('input[type="password"]').catch(()=>{});
  await delay(500, 1000);
  await page.keyboard.type(account.password, { delay: 80 });
  await delay(1000, 2000);
  
  // Click login button
  const loginBtn = await page.$('button[data-e2e="login-button"], button:not([disabled])');
  if (loginBtn) {
    await loginBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }
  
  await delay(8000, 12000);
  
  const url = page.url();
  const success = !url.includes('/login') && !url.includes('/signup');
  log(account.id, success ? 'Login successful!' : `Login failed. URL: ${url}`, success ? 'SUCCESS' : 'ERROR');
  
  return success;
}

async function isLoggedIn(page) {
  const url = page.url();
  if (url.includes('/login') || url.includes('/signup')) return false;
  // Check for upload button (only visible when logged in)
  const uploadBtn = await page.$('[href*="tiktokstudio/upload"], [data-e2e="upload-icon"]');
  return !!uploadBtn;
}

async function warmAccount(account) {
  log(account.id, '━━━ Starting warming session ━━━');
  
  const GL = new GoLogin({ token: TOKEN, profile_id: account.profile });
  let browser, page;
  
  try {
    const { status, wsUrl } = await GL.start();
    log(account.id, `Browser started (${status})`);
    
    browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, ignoreHTTPSErrors: true });
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    // Go to TikTok
    await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000, 5000);
    
    // Check login status
    const loggedIn = await isLoggedIn(page);
    
    if (!loggedIn) {
      log(account.id, 'Not logged in — attempting login...', 'WARN');
      const loginSuccess = await loginToTikTok(page, account);
      
      if (!loginSuccess) {
        log(account.id, 'Login failed — skipping session', 'ERROR');
        await browser.disconnect();
        await GL.stop();
        return { success: false, reason: 'login_failed' };
      }
      
      // Return to FYP after login
      await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(3000);
    }
    
    log(account.id, 'Logged in ✅ — starting warm content consumption');
    
    let likes = 0, videosWatched = 0;
    const sessionVideos = Math.floor(Math.random() * 6) + 8; // 8-14 videos
    
    // Phase 1: Car search (2-3 searches)
    const search = CAR_SEARCHES[Math.floor(Math.random() * CAR_SEARCHES.length)];
    log(account.id, `Searching: "${search}"`);
    
    await page.goto(`https://www.tiktok.com/search/video?q=${encodeURIComponent(search)}`, {
      waitUntil: 'domcontentloaded', timeout: 30000
    });
    await delay(3000, 5000);
    
    // Open first video
    const opened = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/video/"]');
      if (links[0]) { links[0].click(); return true; }
      return false;
    });
    
    if (opened) {
      await delay(2000, 3000);
      const searchVids = Math.floor(sessionVideos * 0.45);
      
      for (let i = 0; i < searchVids; i++) {
        // Watch for human-like duration
        const watchSecs = Math.floor(Math.random() * 15) + 10;
        log(account.id, `Watching video ${i+1}/${searchVids} (${watchSecs}s)`);
        await delay(watchSecs * 1000);
        
        // Like ~40% of videos
        if (Math.random() < 0.4) {
          const liked = await page.evaluate(() => {
            const selectors = ['[data-e2e="like-icon"]','[data-e2e="browse-like"]','button[aria-label*="like" i]'];
            for (const s of selectors) {
              const btn = document.querySelector(s);
              if (btn && btn.getAttribute('aria-pressed') !== 'true') { btn.click(); return true; }
            }
            return false;
          });
          if (liked) { likes++; log(account.id, `❤️ Like ${likes}`, 'ACTION'); await delay(2000, 4000); }
        }
        
        await page.keyboard.press('ArrowDown');
        videosWatched++;
        await delay(1000, 2000);
      }
    }
    
    // Phase 2: FYP scroll
    log(account.id, 'Switching to FYP');
    await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000, 5000);
    
    const fypVids = sessionVideos - Math.floor(sessionVideos * 0.45);
    for (let i = 0; i < fypVids; i++) {
      const watchSecs = Math.floor(Math.random() * 12) + 8;
      await delay(watchSecs * 1000);
      
      if (Math.random() < 0.35) {
        const liked = await page.evaluate(() => {
          const btn = document.querySelector('[data-e2e="like-icon"],[data-e2e="browse-like"]');
          if (btn && btn.getAttribute('aria-pressed') !== 'true') { btn.click(); return true; }
          return false;
        });
        if (liked) { likes++; log(account.id, `❤️ FYP Like ${likes}`, 'ACTION'); await delay(2000, 4000); }
      }
      
      await page.keyboard.press('ArrowDown');
      videosWatched++;
    }
    
    // Phase 3: Occasional follow (every 3rd session)
    const state = loadState();
    const sessions = (state[account.id]?.sessions || 0) + 1;
    
    if (sessions % 3 === 0) {
      const carAccts = ['porsche', 'bmw', 'acarfilmer', 'raciety'];
      const toFollow = carAccts[Math.floor(Math.random() * carAccts.length)];
      log(account.id, `Following @${toFollow}...`);
      
      await page.goto(`https://www.tiktok.com/@${toFollow}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(2000, 4000);
      
      const followed = await page.evaluate(() => {
        const btn = document.querySelector('[data-e2e="follow-button"]');
        if (btn && !btn.textContent.includes('Following') && !btn.textContent.includes('Folge')) {
          btn.click(); return true;
        }
        return false;
      });
      
      if (followed) log(account.id, `Followed @${toFollow}`, 'ACTION');
    }
    
    // Save state
    const newState = { ...state };
    newState[account.id] = {
      sessions,
      last_session: new Date().toISOString(),
      total_likes: (state[account.id]?.total_likes || 0) + likes,
      total_videos: (state[account.id]?.total_videos || 0) + videosWatched
    };
    saveState(newState);
    
    log(account.id, `Session complete: ${videosWatched} videos, ${likes} likes (session #${sessions})`, 'SUCCESS');
    
    await browser.disconnect();
    await GL.stop();
    return { success: true, videos: videosWatched, likes, session: sessions };
    
  } catch (err) {
    log(account.id, `Error: ${err.message}`, 'ERROR');
    try { if (browser) await browser.disconnect(); } catch {}
    try { await GL.stop(); } catch {}
    return { success: false, error: err.message };
  }
}

async function runSession(accountId) {
  const account = ACCOUNTS.find(a => a.id === accountId) || ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)];
  return await warmAccount(account);
}

async function runAll() {
  const results = {};
  for (const account of ACCOUNTS) {
    results[account.id] = await warmAccount(account);
    if (ACCOUNTS.indexOf(account) < ACCOUNTS.length - 1) {
      const wait = Math.floor(Math.random() * 90000) + 60000; // 1-2.5 min
      log('SYSTEM', `Waiting ${Math.round(wait/1000)}s before next account...`);
      await delay(wait);
    }
  }
  return results;
}

// CLI
const arg = process.argv[2];
if (arg === 'all') {
  runAll().then(r => { console.log('\nDone:', JSON.stringify(r, null, 2)); }).catch(console.error);
} else if (arg) {
  runSession(arg).then(r => console.log('Result:', r)).catch(console.error);
} else {
  console.log('Usage: node tiktok-session-manager.js [all|tyler|chloe|marcus|sophia]');
}

module.exports = { warmAccount, runAll, ACCOUNTS };
