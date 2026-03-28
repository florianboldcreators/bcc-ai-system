#!/bin/bash
# Tyler Westbrook Warming Script - v2
# Uses existing TikTok tab to avoid session loss
# Run via: openclaw cron (automated) or manually

ACCOUNT="tyler.westbrook94"
WORKSPACE="/Users/florian/.openclaw/workspace/ronny-project"
LOG_FILE="$WORKSPACE/logs/warming-$ACCOUNT-$(date +%Y-%m-%d).log"
TAB_FILE="$WORKSPACE/tiktok-tab.json"

mkdir -p "$WORKSPACE/logs"

echo "$(date): ========================================" >> "$LOG_FILE"
echo "$(date): Starting warming session for @$ACCOUNT" >> "$LOG_FILE"

# Check if tab file exists
if [ -f "$TAB_FILE" ]; then
    TAB_ID=$(cat "$TAB_FILE" | grep -o '"tabId": "[^"]*"' | cut -d'"' -f4)
    echo "$(date): Using existing TikTok tab: $TAB_ID" >> "$LOG_FILE"
else
    echo "$(date): WARNING - No TikTok tab file found. Need to open new tab." >> "$LOG_FILE"
fi

# Output warming instructions for the cron job to follow
cat << 'EOF'
TYLER_WARMING_SESSION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Check TikTok Tab
- Find existing TikTok tab (tiktok.com)
- If not found: Navigate to tiktok.com/foryou
- Verify logged in as @tyler.westbrook94 (landscape profile pic)

STEP 2: Watch Videos (8-12 videos, 5-8 sec each)
- Scroll through FYP
- Pause on car/racing content
- Skip non-car content quickly

STEP 3: Engage (HUMAN-LIKE PATTERN!)
- Like 1-2 car/racing videos ONLY
- DO NOT like every video (suspicious)
- Random delay between likes (15-45 sec)

STEP 4: Optional Follow (max 1/day)
- Check warming-state.json for today's follow count
- If follows_today < 1: Follow ONE car account
- Update follows_today in state file

STEP 5: Log Results
- Videos watched: X
- Likes given: X
- Follows: X
- Total duration: X minutes

CONTENT SIGNALS TO REINFORCE:
✓ BMW, Mercedes, Audi
✓ Racing, Drift, Autobahn
✓ Car meets, Car spotting
✓ Supercar, Luxury cars
✗ SKIP: cooking, dance, comedy (unless car-related)
EOF

echo "$(date): Warming instructions output" >> "$LOG_FILE"
