#!/usr/bin/env node
/**
 * Main Browser Controller — Uses OpenClaw's browser (Port 18800)
 * Currently logged in as: Marcus (@user4783749392230)
 * 
 * This bypasses GoLogin entirely — uses the always-on main browser.
 * Perfect for warming the account that's logged in.
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const WS_ENDPOINT = 'ws://127.0.0.1:18800/devtools/browser';
const LOG_FILE = path.join(__dirname, '../logs/main-browser.log');
const STATE_FILE = path.join(__dirname, '../data/marcus-state.json');

const CAR_SEARCHES = [
  'bmw m4 drift', 'porsche 911 exhaust', 'bmw m3 competition',
  'supercar compilation', 'ferrari sound', 'car edit 4k',
  'drift compilation', 'modified bmw', 'porsche gt3 rs'
];

const delay = (min, max) => new Promise(r => setTimeout(r, max ? Math.floor(Math.random()*(max-min))+min : min));

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString().slice(11,19);
  const icon = {INFO:'📋',SUCCESS:'✅',WARN:'⚠️',ERROR:'❌',ACTION:'🎯'}[level]||'📋';
  const line = `[${ts}] ${icon} [MARCUS] ${msg}`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG_FILE), {recursive:true});
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE,'utf8')); } catch { return { sessions: 0, total_likes: 0, total_videos: 0 }; }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), {recursive:true});
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function connectToMainBrowser() {
  // Find the TikTok tab via CDP
  const response = await fetch('http://127.0.0.1:18800/json/list');
  const targets = await response.json();
  
  // Find any usable page tab
  let targetTab = targets.find(t => t.url?.includes('tiktok.com') && t.type === 'page');
  if (!targetTab) {
    targetTab = targets.find(t => t.type === 'page' && !t.url?.includes('chrome://') && !t.url?.includes('about:'));
  }
  
  if (!targetTab) {
    throw new Error('No usable browser tab found');
  }
  
  log(`Connecting to tab: ${targetTab.url?.slice(0, 50)}...`);
  
  // Connect directly to the page (not browser) using targetId
  const cdpUrl = `ws://127.0.0.1:18800/devtools/page/${targetTab.id}`;
  const browser = await puppeteer.connect({ 
    browserWSEndpoint: cdpUrl.replace('/devtools/page/', '/devtools/browser/'),
    defaultViewport: null 
  }).catch(async () => {
    // Fallback: connect to the page target directly
    const ws = new (require('ws'))(targetTab.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    return null;
  });
  
  if (!browser) {
    // Use basic CDP instead of puppeteer
    throw new Error('Direct browser connection failed - use openclaw browser tool instead');
  }
  
  const pages = await browser.pages();
  const page = pages.find(p => p.url()?.includes('tiktok.com')) || pages[0];
  return { browser, page };
}

async function warmMarcus() {
  log('━━━ Starting Marcus warming session ━━━');
  
  const { browser, page } = await connectToMainBrowser();
  
  try {
    // Navigate to TikTok
    await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(3000, 5000);
    
    // Verify we're logged in as Marcus
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      log('Not logged in!', 'ERROR');
      await browser.disconnect();
      return { success: false, reason: 'not_logged_in' };
    }
    
    log('Logged in ✅ — starting warm content consumption');
    
    let likes = 0, videosWatched = 0;
    const sessionVideos = Math.floor(Math.random() * 6) + 10; // 10-16 videos
    
    // Phase 1: Car search (trains algorithm)
    const search = CAR_SEARCHES[Math.floor(Math.random() * CAR_SEARCHES.length)];
    log(`Searching: "${search}"`);
    
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
      const searchVids = Math.floor(sessionVideos * 0.4);
      
      for (let i = 0; i < searchVids; i++) {
        const watchSecs = Math.floor(Math.random() * 18) + 12; // 12-30 sec
        log(`Watching video ${i+1}/${searchVids} (${watchSecs}s)`);
        await delay(watchSecs * 1000);
        
        // Like ~35% of videos
        if (Math.random() < 0.35) {
          const liked = await page.evaluate(() => {
            const selectors = ['[data-e2e="like-icon"]','[data-e2e="browse-like"]','button[aria-label*="like" i]'];
            for (const s of selectors) {
              const btn = document.querySelector(s);
              if (btn && btn.getAttribute('aria-pressed') !== 'true') { btn.click(); return true; }
            }
            return false;
          });
          if (liked) { likes++; log(`❤️ Like ${likes}`, 'ACTION'); await delay(2000, 4000); }
        }
        
        // Next video
        await page.keyboard.press('ArrowDown');
        videosWatched++;
        await delay(1000, 2000);
      }
    }
    
    // Phase 2: FYP scroll
    log('Switching to FYP');
    await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000, 5000);
    
    const fypVids = sessionVideos - Math.floor(sessionVideos * 0.4);
    for (let i = 0; i < fypVids; i++) {
      const watchSecs = Math.floor(Math.random() * 15) + 10;
      await delay(watchSecs * 1000);
      
      if (Math.random() < 0.3) {
        const liked = await page.evaluate(() => {
          const btn = document.querySelector('[data-e2e="like-icon"],[data-e2e="browse-like"]');
          if (btn && btn.getAttribute('aria-pressed') !== 'true') { btn.click(); return true; }
          return false;
        });
        if (liked) { likes++; log(`❤️ FYP Like ${likes}`, 'ACTION'); await delay(2000, 4000); }
      }
      
      await page.keyboard.press('ArrowDown');
      videosWatched++;
    }
    
    // Phase 3: Occasionally follow car accounts
    const state = loadState();
    if ((state.sessions + 1) % 4 === 0) {
      const carAccts = ['porsche', 'bmw', 'ferrari', 'lamborghini', 'acarfilmer', 'raciety', 'topgear'];
      const toFollow = carAccts[Math.floor(Math.random() * carAccts.length)];
      log(`Following @${toFollow}...`);
      
      await page.goto(`https://www.tiktok.com/@${toFollow}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(2000, 4000);
      
      const followed = await page.evaluate(() => {
        const btn = document.querySelector('[data-e2e="follow-button"]');
        if (btn && !btn.textContent.includes('Following') && !btn.textContent.includes('Folge')) {
          btn.click(); return true;
        }
        return false;
      });
      
      if (followed) log(`Followed @${toFollow}`, 'ACTION');
    }
    
    // Save state
    const newState = {
      sessions: state.sessions + 1,
      total_likes: state.total_likes + likes,
      total_videos: state.total_videos + videosWatched,
      last_session: new Date().toISOString()
    };
    saveState(newState);
    
    log(`Session complete: ${videosWatched} videos, ${likes} likes (total sessions: ${newState.sessions})`, 'SUCCESS');
    
    await browser.disconnect();
    return { success: true, videos: videosWatched, likes, session: newState.sessions };
    
  } catch (err) {
    log(`Error: ${err.message}`, 'ERROR');
    try { await browser.disconnect(); } catch {}
    return { success: false, error: err.message };
  }
}

// CLI
if (process.argv[2] === 'run') {
  warmMarcus().then(r => console.log('Result:', JSON.stringify(r, null, 2))).catch(console.error);
} else if (process.argv[2] === 'status') {
  console.log(loadState());
} else {
  console.log('Usage: node main-browser-controller.js [run|status]');
}

module.exports = { warmMarcus };
