#!/usr/bin/env node
/**
 * Marcus CDP Warmer — Direct Chrome DevTools Protocol
 * Uses the main browser on port 18800
 * No Puppeteer dependency - raw CDP
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CDP_HOST = '127.0.0.1';
const CDP_PORT = 18800;
const LOG_FILE = path.join(__dirname, '../logs/marcus-cdp.log');
const STATE_FILE = path.join(__dirname, '../data/marcus-state.json');

const CAR_SEARCHES = [
  'bmw m4 drift', 'porsche 911 sound', 'supercar compilation',
  'ferrari exhaust', 'bmw m series', 'car edit 4k'
];

const delay = (min, max) => new Promise(r => setTimeout(r, max ? Math.floor(Math.random()*(max-min))+min : min));

function log(msg, level = 'INFO') {
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${ts}] [${level}] ${msg}`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } 
  catch { return { sessions: 0, total_likes: 0, total_videos: 0 }; }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Get list of browser tabs
async function getTabs() {
  return new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${CDP_PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch { reject(new Error('Failed to parse tabs')); }
      });
    }).on('error', reject);
  });
}

// Send CDP command
class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = {};
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks[msg.id]) {
          this.callbacks[msg.id](msg);
          delete this.callbacks[msg.id];
        }
      });
    });
  }
  
  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = ++this.id;
      this.callbacks[id] = resolve;
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  
  close() {
    this.ws.close();
  }
}

async function warmingSession() {
  log('=== Starting Marcus CDP Warming Session ===');
  
  const tabs = await getTabs();
  let tiktokTab = tabs.find(t => t.url?.includes('tiktok.com') && t.type === 'page');
  
  if (!tiktokTab) {
    tiktokTab = tabs.find(t => t.type === 'page' && !t.url?.includes('chrome://'));
  }
  
  if (!tiktokTab) {
    log('No usable tab found!', 'ERROR');
    return { success: false, reason: 'no_tab' };
  }
  
  log(`Found tab: ${tiktokTab.url?.slice(0, 50)}...`);
  
  const cdp = new CDPClient(tiktokTab.webSocketDebuggerUrl);
  await cdp.connect();
  log('CDP connected');
  
  // Enable Page domain
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  
  // Navigate to TikTok search
  const search = CAR_SEARCHES[Math.floor(Math.random() * CAR_SEARCHES.length)];
  log(`Searching: "${search}"`);
  
  await cdp.send('Page.navigate', { 
    url: `https://www.tiktok.com/search/video?q=${encodeURIComponent(search)}`
  });
  await delay(4000, 6000);
  
  let videosWatched = 0;
  let likes = 0;
  const targetVideos = Math.floor(Math.random() * 5) + 8; // 8-12 videos
  
  // Click first video
  const clickResult = await cdp.send('Runtime.evaluate', {
    expression: `
      (function() {
        const links = document.querySelectorAll('a[href*="/video/"]');
        if (links[0]) { links[0].click(); return true; }
        return false;
      })()
    `,
    returnByValue: true
  });
  
  if (clickResult.result?.value) {
    log('Opened first video');
    await delay(3000, 5000);
    
    // Watch videos
    for (let i = 0; i < targetVideos; i++) {
      const watchTime = Math.floor(Math.random() * 15000) + 12000; // 12-27 sec
      log(`Watching video ${i+1}/${targetVideos} (${Math.round(watchTime/1000)}s)`);
      await delay(watchTime);
      
      // Like ~35% of videos
      if (Math.random() < 0.35) {
        const likeResult = await cdp.send('Runtime.evaluate', {
          expression: `
            (function() {
              const selectors = ['[data-e2e="like-icon"]','[data-e2e="browse-like"]'];
              for (const s of selectors) {
                const btn = document.querySelector(s);
                if (btn && btn.getAttribute('aria-pressed') !== 'true') {
                  btn.click();
                  return true;
                }
              }
              return false;
            })()
          `,
          returnByValue: true
        });
        
        if (likeResult.result?.value) {
          likes++;
          log(`❤️ Liked video (total: ${likes})`, 'ACTION');
          await delay(2000, 4000);
        }
      }
      
      // Next video (Arrow Down)
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'ArrowDown',
        code: 'ArrowDown',
        windowsVirtualKeyCode: 40
      });
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'ArrowDown',
        code: 'ArrowDown',
        windowsVirtualKeyCode: 40
      });
      
      videosWatched++;
      await delay(1000, 2000);
    }
  }
  
  // Update state
  const state = loadState();
  const newState = {
    sessions: state.sessions + 1,
    total_likes: state.total_likes + likes,
    total_videos: state.total_videos + videosWatched,
    last_session: new Date().toISOString()
  };
  saveState(newState);
  
  cdp.close();
  
  log(`Session complete: ${videosWatched} videos, ${likes} likes (session #${newState.sessions})`, 'SUCCESS');
  return { success: true, videos: videosWatched, likes, session: newState.sessions };
}

// CLI
if (process.argv[2] === 'run') {
  warmingSession()
    .then(r => console.log('\nResult:', JSON.stringify(r, null, 2)))
    .catch(e => console.error('Error:', e.message));
} else if (process.argv[2] === 'status') {
  console.log(loadState());
} else {
  console.log('Usage: node marcus-cdp-warmer.js [run|status]');
}
