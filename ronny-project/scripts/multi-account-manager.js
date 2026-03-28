#!/usr/bin/env node
/**
 * Multi-Account Manager — Ronny Project
 * Controls 4 TikTok + 3 Instagram accounts simultaneously
 * Human-like behavior, anti-ban safety built in
 */

const { GoLogin } = require('gologin');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { ACCOUNTS, TIMING, CAR_SEARCHES, IG_HASHTAGS, GOLOGIN_TOKEN } = require('./account-config');

// ─── State Management ──────────────────────────────────────────────────────────

const STATE_FILE = path.join(__dirname, '../data/account-state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getAccountState(accountId) {
  const state = loadState();
  return state[accountId] || {
    daily_likes: 0,
    daily_follows: 0,
    daily_comments: 0,
    daily_posts: 0,
    last_session: null,
    last_reset: new Date().toDateString(),
    total_sessions: 0,
    wsUrl: null,
    port: null
  };
}

function updateAccountState(accountId, updates) {
  const state = loadState();
  const today = new Date().toDateString();
  
  // Reset daily counters if new day
  if (!state[accountId] || state[accountId].last_reset !== today) {
    state[accountId] = { ...getAccountState(accountId), daily_likes: 0, daily_follows: 0, daily_comments: 0, daily_posts: 0, last_reset: today };
  }
  
  state[accountId] = { ...state[accountId], ...updates };
  saveState(state);
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

const delay = (min, max) => {
  const ms = max ? Math.floor(Math.random() * (max - min)) + min : min;
  return new Promise(r => setTimeout(r, ms));
};

function log(accountId, message, level = 'INFO') {
  const ts = new Date().toISOString().slice(11, 19);
  const prefix = { INFO: '📋', SUCCESS: '✅', WARN: '⚠️', ERROR: '❌', ACTION: '🎯' }[level] || '📋';
  console.log(`[${ts}] ${prefix} [${accountId.toUpperCase()}] ${message}`);
  
  // Also log to file
  const logFile = path.join(__dirname, '../logs/multi-account.log');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] [${level}] [${accountId}] ${message}\n`);
}

// ─── Browser Management ────────────────────────────────────────────────────────

const activeBrowsers = {};

async function startBrowser(account) {
  log(account.id, `Starting GoLogin browser (profile: ${account.gologin_profile})`);
  
  const GL = new GoLogin({
    token: GOLOGIN_TOKEN,
    profile_id: account.gologin_profile
  });
  
  const { status, wsUrl } = await GL.start();
  log(account.id, `Browser started | Status: ${status} | Port from wsUrl`);
  
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    ignoreHTTPSErrors: true
  });
  
  // Check IP
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://ipv4.icanhazip.com/', { timeout: 20000 });
  const ip = await page.evaluate(() => document.body.textContent.trim());
  log(account.id, `IP: ${ip}`, 'SUCCESS');
  await page.close();
  
  activeBrowsers[account.id] = { browser, GL, wsUrl };
  return { browser, GL };
}

async function stopBrowser(account) {
  if (activeBrowsers[account.id]) {
    const { GL } = activeBrowsers[account.id];
    await GL.stop();
    delete activeBrowsers[account.id];
    log(account.id, 'Browser stopped');
  }
}

async function getOrCreatePage(account, url) {
  const { browser } = activeBrowsers[account.id];
  const pages = await browser.pages();
  
  // Find existing page or create new one
  let page = pages.find(p => !p.url().includes('chrome://') && !p.url().includes('about:'));
  if (!page) page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });
  if (url) await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return page;
}

// ─── TikTok Actions ────────────────────────────────────────────────────────────

async function tiktokCheckLogin(account, page) {
  const url = page.url();
  if (url.includes('/login') || url.includes('/signup')) {
    log(account.id, 'Not logged in!', 'WARN');
    return false;
  }
  // Check profile link
  const profileLink = await page.$(`a[href*="/@${account.username}"], a[href*="/${account.username}"]`);
  log(account.id, profileLink ? 'Logged in ✅' : 'Login status unclear', profileLink ? 'SUCCESS' : 'WARN');
  return true;
}

async function tiktokLikeCurrentVideo(account, page) {
  const state = getAccountState(account.id);
  if (state.daily_likes >= TIMING.daily_limits.likes) {
    log(account.id, `Daily like limit reached (${TIMING.daily_limits.likes})`, 'WARN');
    return false;
  }
  
  const liked = await page.evaluate(() => {
    const selectors = ['[data-e2e="like-icon"]', '[data-e2e="browse-like"]', 'span[data-e2e="like-icon"]'];
    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn && btn.getAttribute('aria-pressed') !== 'true') {
        btn.click();
        return true;
      }
    }
    return false;
  });
  
  if (liked) {
    updateAccountState(account.id, { daily_likes: state.daily_likes + 1 });
    log(account.id, `Liked video (total today: ${state.daily_likes + 1})`, 'ACTION');
  }
  return liked;
}

async function tiktokFollowUser(account, page, username) {
  const state = getAccountState(account.id);
  if (state.daily_follows >= TIMING.daily_limits.follows) {
    log(account.id, 'Daily follow limit reached', 'WARN');
    return false;
  }
  
  await page.goto(`https://www.tiktok.com/@${username}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await delay(2000, 4000);
  
  const followed = await page.evaluate(() => {
    const btn = document.querySelector('[data-e2e="follow-button"]');
    if (btn && !btn.textContent.includes('Following') && !btn.textContent.includes('Folge ich')) {
      btn.click();
      return true;
    }
    return false;
  });
  
  if (followed) {
    updateAccountState(account.id, { daily_follows: state.daily_follows + 1 });
    log(account.id, `Followed @${username}`, 'ACTION');
  }
  return followed;
}

async function tiktokWarmingSession(account) {
  log(account.id, '=== Starting warming session ===');
  
  try {
    await startBrowser(account);
    const page = await getOrCreatePage(account, 'https://www.tiktok.com/');
    await delay(3000, 5000);
    
    const loggedIn = await tiktokCheckLogin(account, page);
    if (!loggedIn) {
      log(account.id, 'Cannot warm - not logged in', 'ERROR');
      await stopBrowser(account);
      return { success: false, reason: 'not_logged_in' };
    }
    
    const sessionActions = Math.floor(Math.random() * 7) + 8; // 8-15 actions
    let likes = 0, videosWatched = 0;
    
    // Phase 1: Search car content (trains algorithm)
    const search = CAR_SEARCHES[Math.floor(Math.random() * CAR_SEARCHES.length)];
    log(account.id, `Searching: "${search}"`);
    await page.goto(`https://www.tiktok.com/search/video?q=${encodeURIComponent(search)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000, 5000);
    
    // Click first video
    const clicked = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/video/"]');
      if (links[0]) { links[0].click(); return true; }
      return false;
    });
    
    if (clicked) {
      await delay(2000, 3000);
      
      // Watch & like some videos
      const searchVideos = Math.floor(sessionActions * 0.4);
      for (let i = 0; i < searchVideos; i++) {
        const watchTime = Math.floor(Math.random() * (TIMING.between_videos[1] - TIMING.between_videos[0])) + TIMING.between_videos[0];
        await delay(watchTime);
        
        if (Math.random() > 0.5) { // Like ~50% of videos
          const liked = await tiktokLikeCurrentVideo(account, page);
          if (liked) likes++;
          await delay(TIMING.between_likes[0], TIMING.between_likes[1]);
        }
        
        await page.keyboard.press('ArrowDown');
        videosWatched++;
        log(account.id, `Video ${videosWatched}/${sessionActions} watched`);
      }
    }
    
    // Phase 2: FYP browsing
    log(account.id, 'Switching to FYP');
    await page.goto('https://www.tiktok.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000, 5000);
    
    const fypVideos = sessionActions - Math.floor(sessionActions * 0.4);
    for (let i = 0; i < fypVideos; i++) {
      const watchTime = Math.floor(Math.random() * (TIMING.between_videos[1] - TIMING.between_videos[0])) + TIMING.between_videos[0];
      await delay(watchTime);
      
      if (Math.random() > 0.6) {
        const liked = await tiktokLikeCurrentVideo(account, page);
        if (liked) likes++;
        await delay(TIMING.between_likes[0], TIMING.between_likes[1]);
      }
      
      await page.keyboard.press('ArrowDown');
      videosWatched++;
    }
    
    // Phase 3: Occasionally follow a car account
    const state = getAccountState(account.id);
    if (state.total_sessions % 5 === 0 && state.daily_follows < TIMING.daily_limits.follows) {
      const carAccounts = ['porsche', 'bmw', 'ferrari', 'lamborghini', 'acarfilmer'];
      const toFollow = carAccounts[Math.floor(Math.random() * carAccounts.length)];
      await tiktokFollowUser(account, page, toFollow);
      await delay(3000, 5000);
    }
    
    updateAccountState(account.id, {
      last_session: new Date().toISOString(),
      total_sessions: (state.total_sessions || 0) + 1
    });
    
    log(account.id, `Session done: ${videosWatched} videos, ${likes} likes`, 'SUCCESS');
    await stopBrowser(account);
    return { success: true, videos: videosWatched, likes };
    
  } catch (err) {
    log(account.id, `Session error: ${err.message}`, 'ERROR');
    try { await stopBrowser(account); } catch {}
    return { success: false, error: err.message };
  }
}

// ─── Instagram Actions ─────────────────────────────────────────────────────────

async function instagramWarmingSession(account) {
  log(account.id, '=== Starting Instagram warming session ===');
  
  try {
    await startBrowser(account);
    const page = await getOrCreatePage(account, 'https://www.instagram.com/');
    await delay(4000, 6000);
    
    const url = page.url();
    if (url.includes('/accounts/login')) {
      log(account.id, 'Not logged in to Instagram', 'WARN');
      await stopBrowser(account);
      return { success: false, reason: 'not_logged_in' };
    }
    
    log(account.id, 'Logged in to Instagram', 'SUCCESS');
    
    let likes = 0;
    const hashtag = IG_HASHTAGS[Math.floor(Math.random() * IG_HASHTAGS.length)];
    
    // Browse hashtag
    log(account.id, `Browsing hashtag: ${hashtag}`);
    const tag = hashtag.replace('#', '');
    await page.goto(`https://www.instagram.com/explore/tags/${tag}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(3000, 5000);
    
    // Click first post
    const firstPost = await page.$('article a, div[class*="v1Nh3"] a');
    if (firstPost) {
      await firstPost.click();
      await delay(2000, 4000);
      
      // Like 2-4 posts
      const toLike = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < toLike; i++) {
        await delay(8000, 18000);
        
        const liked = await page.evaluate(() => {
          const likeBtn = document.querySelector('svg[aria-label="Like"], svg[aria-label="Gefällt mir"]');
          if (likeBtn) {
            const btn = likeBtn.closest('button');
            if (btn) { btn.click(); return true; }
          }
          return false;
        });
        
        if (liked) {
          likes++;
          log(account.id, `IG Like ${likes}`, 'ACTION');
          await delay(3000, 6000);
        }
        
        // Next post
        await page.keyboard.press('ArrowRight');
      }
    }
    
    log(account.id, `IG session done: ${likes} likes`, 'SUCCESS');
    await stopBrowser(account);
    return { success: true, likes };
    
  } catch (err) {
    log(account.id, `IG session error: ${err.message}`, 'ERROR');
    try { await stopBrowser(account); } catch {}
    return { success: false, error: err.message };
  }
}

// ─── Main Orchestrator ─────────────────────────────────────────────────────────

async function runAllAccounts(options = {}) {
  const { platform = 'all', sequential = true } = options;
  
  console.log('\n' + '═'.repeat(60));
  console.log('🚗 RONNY PROJECT — MULTI-ACCOUNT MANAGER');
  console.log(`📅 ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`);
  console.log('═'.repeat(60) + '\n');
  
  const results = {};
  
  const tiktokAccounts = platform === 'instagram' ? [] : ACCOUNTS.tiktok;
  const igAccounts = platform === 'tiktok' ? [] : ACCOUNTS.instagram;
  
  if (sequential) {
    // Run accounts sequentially with delays (safer, less suspicious)
    for (const account of tiktokAccounts) {
      results[account.id] = await tiktokWarmingSession(account);
      if (tiktokAccounts.indexOf(account) < tiktokAccounts.length - 1) {
        const waitTime = Math.floor(Math.random() * (TIMING.between_accounts[1] - TIMING.between_accounts[0])) + TIMING.between_accounts[0];
        log('ORCHESTRATOR', `Waiting ${Math.round(waitTime/1000)}s before next account...`);
        await delay(waitTime);
      }
    }
    
    // Small gap between TikTok and Instagram
    if (tiktokAccounts.length > 0 && igAccounts.length > 0) {
      await delay(60000, 120000);
    }
    
    for (const account of igAccounts) {
      results[account.id] = await instagramWarmingSession(account);
      if (igAccounts.indexOf(account) < igAccounts.length - 1) {
        await delay(TIMING.between_accounts[0], TIMING.between_accounts[1]);
      }
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SESSION SUMMARY');
  console.log('═'.repeat(60));
  for (const [id, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    const detail = result.success 
      ? `videos: ${result.videos || '?'}, likes: ${result.likes || 0}`
      : `reason: ${result.reason || result.error}`;
    console.log(`${status} ${id.padEnd(12)} | ${detail}`);
  }
  console.log('═'.repeat(60) + '\n');
  
  return results;
}

// CLI interface
const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === 'run') {
  const platform = args[1] || 'all';
  runAllAccounts({ platform }).catch(console.error);
} else if (cmd === 'status') {
  const state = loadState();
  console.log(JSON.stringify(state, null, 2));
} else {
  console.log('Usage: node multi-account-manager.js [run|status] [tiktok|instagram|all]');
}

module.exports = { runAllAccounts, tiktokWarmingSession, instagramWarmingSession };
