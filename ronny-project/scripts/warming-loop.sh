#!/bin/bash
# Marcus TikTok Warming Loop
# Uses openclaw browser tool to warm the account

WORKSPACE="/Users/florian/.openclaw/workspace/ronny-project"
LOG="$WORKSPACE/logs/warming-session-$(date +%Y%m%d-%H%M%S).log"
STATE="$WORKSPACE/data/marcus-warming-state.json"

mkdir -p "$WORKSPACE/logs" "$WORKSPACE/data"

echo "=== Marcus TikTok Warming Session ===" | tee -a "$LOG"
echo "Started: $(date)" | tee -a "$LOG"

# Initialize state if needed
if [ ! -f "$STATE" ]; then
  echo '{"sessions":0,"total_likes":0,"total_videos":0}' > "$STATE"
fi

# Run warming session via Node script
cd "$WORKSPACE/scripts"
node -e "
const delay = ms => new Promise(r => setTimeout(r, ms));

async function warmingSession() {
  console.log('[INFO] Starting Marcus warming via browser tool...');
  console.log('[INFO] Account: @user4783749392230');
  
  // This script just logs - actual warming is done via browser tool
  // The warming-cron.js will handle the full automation
  
  const searches = ['bmw m4', 'porsche 911', 'car drift', 'supercar'];
  const search = searches[Math.floor(Math.random() * searches.length)];
  
  console.log('[INFO] Search term: ' + search);
  console.log('[INFO] Videos to watch: 8-12');
  console.log('[INFO] Expected likes: 2-4');
  console.log('[INFO] Session duration: ~3-5 minutes');
  
  console.log('[SUCCESS] Warming parameters set');
}

warmingSession();
" 2>&1 | tee -a "$LOG"

echo "Completed: $(date)" | tee -a "$LOG"
