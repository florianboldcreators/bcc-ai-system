# TikTok Account Farm - Scaling Architecture

**Created:** 2026-03-23  
**Goal:** 100+ TikTok accounts parallel managed for commenting

---

## 🎯 MVP (NOW): Android Emulator

**Setup:**
- Android Studio + AVD Manager
- 5-8 Emulatoren auf Mac Mini (RAM-limit)
- Appium für TikTok App Automation

**Purpose:** 
- Proof mobile automation works
- Learn TikTok App behavior vs Web
- Validate that mobile = less bot detection

**Limitations:**
- Mac Mini: max 8 parallel (32GB RAM / ~4GB per emulator)
- Not scalable to 100+

---

## 🚀 PRODUCTION (LATER): Scaling Options

### Decision Criteria:
1. **Cost per account** (monthly)
2. **Bot detection rate** (survival %)
3. **Setup complexity** (time to scale)
4. **Maintenance burden** (ongoing work)

---

## Option A: Headless Chrome Farm + Mobile UA

### Architecture:
```
VPS (64GB RAM, 16 cores)
├── Docker Container 1 (Account #1)
│   ├── Chromium headless
│   ├── Mobile viewport (390x844)
│   ├── Touch events only
│   └── NordVPN via container network
├── Docker Container 2 (Account #2)
│   └── ...
└── Docker Container 100 (Account #100)
```

### Pros:
✅ **Cheapest:** $100-200/month VPS (Hetzner CPX51: 16 vCPU, 64GB RAM)  
✅ **Lightweight:** ~200MB RAM per container  
✅ **Fast:** No emulation overhead  
✅ **Scalable:** 100+ containers on single server  
✅ **openclaw compatible:** We already have the tech  

### Cons:
❌ Still browser-based (not real app)  
❌ TikTok might detect "mobile UA on desktop browser"  
❌ No real IMEI/Android-ID  

### Implementation:
- Docker Compose with 100 services
- Each container: own Chrome profile, own VPN exit IP
- openclaw runs inside each container
- Central orchestrator (Python script) manages all

### Cost Estimate:
- VPS: $150/month (Hetzner CPX51)
- VPN: $50/month (NordVPN or IPRoyal residential)
- **Total: $200/month for 100 accounts**

---

## Option B: Cloud Android Farm (Genymotion Cloud)

### Architecture:
```
Genymotion Cloud (AWS-based)
├── Android Instance 1 (Account #1-10)
│   ├── TikTok App
│   ├── Appium automation
│   └── Real Android fingerprint
├── Android Instance 2 (Account #11-20)
│   └── ...
└── Android Instance 10 (Account #91-100)
```

### Pros:
✅ **Real Android OS:** True mobile fingerprint  
✅ **TikTok App:** Native app = lowest detection  
✅ **Managed:** No hardware maintenance  
✅ **Scalable:** Spin up 100 instances in minutes  

### Cons:
❌ **Expensive:** $136/month per 10 accounts = $1360/month for 100  
❌ Appium more complex than browser automation  
❌ Still cloud-based (shared infrastructure)  

### Implementation:
- Genymotion Cloud API for instance management
- Appium Grid for parallel automation
- Python scripts orchestrate TikTok actions

### Cost Estimate:
- Genymotion: $1360/month (10 instances × $136)
- Appium Grid server: $50/month
- **Total: $1410/month for 100 accounts**

---

## Option C: AWS Device Farm (Real Devices)

### Architecture:
```
AWS Device Farm
├── Real Samsung Galaxy A52 (Pool 1-20)
├── Real Pixel 6 (Pool 21-40)
├── Real Xiaomi Redmi (Pool 41-60)
└── ...
```

### Pros:
✅ **Real hardware:** Best bot detection evasion  
✅ **Managed by AWS:** No maintenance  
✅ **Various devices:** Realistic diversity  

### Cons:
❌ **Most expensive:** $0.17/min = $244/device/day  
❌ Not designed for 24/7 (session-based pricing)  
❌ Overkill for our use case  

### Cost Estimate:
- 100 devices × $244/day = $24,400/day
- **Not viable for 24/7 operation**

---

## Option D: Physical Device Farm (DIY)

### Architecture:
```
Mac Mini + USB Hub
├── 50× Budget Android phones ($50 each)
├── USB Cables × 50
├── ADB for automation
└── Phone management software
```

### Pros:
✅ **Real devices:** Best fingerprints  
✅ **One-time cost:** $2500 hardware  
✅ **Full control:** No cloud dependencies  

### Cons:
❌ **High upfront investment:** $2500  
❌ **Physical maintenance:** Cables break, phones die  
❌ **Space requirement:** 50 phones + cables + power  
❌ **Heat/noise:** 50 phones running 24/7  
❌ **ADB fragile:** USB connections drop, need monitoring  

### Cost Estimate:
- Hardware: $2500 one-time
- Power: $50/month (50 phones × 5W × 24h)
- **Total: $2500 + $50/month**

---

## Option E: HYBRID (Recommended)

### Strategy:
**80% Headless Chrome** (cheap workers)  
**20% Cloud Android** (critical accounts)

### Why?
- Not all accounts need perfect fingerprints
- 80 accounts via Chrome = low cost
- 20 accounts via Genymotion = high survival rate
- Rotate accounts between tiers based on performance

### Architecture:
```
Tier 1 (80 accounts): Headless Chrome VPS
├── Low-risk commenting
├── High volume
└── Acceptable 10-20% ban rate

Tier 2 (20 accounts): Genymotion Cloud
├── High-value accounts
├── Lower volume
└── Target 95%+ survival
```

### Cost:
- Chrome VPS: $150/month (80 accounts)
- Genymotion: $272/month (2 instances, 20 accounts)
- VPN/Proxy: $50/month
- **Total: $472/month for 100 accounts**

### Decision Logic:
1. All new accounts start in Tier 1 (Chrome)
2. Accounts that survive >7 days → stay in Tier 1
3. Accounts banned → replace in Tier 1
4. Top 20 performing accounts → promote to Tier 2
5. Tier 2 accounts do high-value work (brand comments, engagement)

---

## 🎯 RECOMMENDED PATH

### Phase 1 (MVP - This Week):
- ✅ Android Emulator on Mac Mini
- Learn TikTok App automation with Appium
- Validate mobile = less detection
- Test 5-8 accounts in parallel

### Phase 2 (Scale Test - Week 2-3):
- Build Headless Chrome farm (20 accounts)
- Docker Compose setup on VPS
- Test ban rate vs Android Emulator
- If ban rate <20% → proceed to Phase 3

### Phase 3 (Production - Month 2):
- Deploy Hybrid (80 Chrome + 20 Genymotion)
- Monitor survival rates
- Adjust ratio based on data
- Scale to 200+ if needed

---

## 📊 KEY METRICS TO TRACK

### Per Account:
- Survival time (days before ban)
- Comments posted successfully
- Likes/saves performed
- Detection events (CAPTCHA, phone verification, etc.)

### Per Platform (Chrome vs Android):
- Average survival time
- Ban rate (%)
- Cost per successful comment
- Setup time per account

### Decision Threshold:
- If Chrome ban rate >30% → shift more to Genymotion
- If Chrome ban rate <15% → shift less to Genymotion
- Target: <20% ban rate across all accounts

---

## 🔧 TECHNICAL REQUIREMENTS

### For Headless Chrome Farm:
- Docker + Docker Compose
- openclaw Browser in containers
- VPN/Proxy rotation per container
- Central orchestrator (Python FastAPI)
- Database for account state (SQLite or PostgreSQL)

### For Genymotion Cloud:
- Genymotion Cloud account + API key
- Appium Server + Python client
- Instance management scripts
- Same orchestrator + database

### For Hybrid:
- All of the above
- Load balancer / account tier manager
- Promotion/demotion logic based on metrics

---

## 💰 COST BREAKDOWN (100 Accounts)

| Option | Monthly Cost | Ban Rate | Comments/Day | Cost per Comment |
|--------|--------------|----------|--------------|------------------|
| Chrome Farm | $200 | 20% | 8000 | $0.0025 |
| Genymotion | $1410 | 5% | 9500 | $0.15 |
| Hybrid | $472 | 12% | 8800 | $0.054 |
| DIY Phones | $50 | 5% | 9500 | $0.005* |

*One-time $2500 investment amortized over 12 months = $208/month effective

**Winner for BCC: Hybrid ($472/month)**

---

## 🚨 RISK FACTORS

### TikTok Detection Improvements:
- They could start fingerprinting Chrome vs real app
- They could detect cloud IPs (AWS, Hetzner)
- They could require phone re-verification more often

### Mitigation:
- Start with Hybrid to test both approaches
- Keep 20% in highest-quality tier (Genymotion or real devices)
- Monitor ban rates weekly and adjust

---

## 📝 NEXT STEPS

1. ✅ **This week:** Android Emulator MVP (5-8 accounts)
2. **Week 2:** Build Headless Chrome prototype (10 accounts on Mac Mini via Docker)
3. **Week 3:** Deploy to VPS, scale to 50 accounts, measure ban rate
4. **Week 4:** Add Genymotion tier (10 accounts), compare metrics
5. **Month 2:** Full Hybrid deployment (80+20) if metrics good

---

**Decision Point:** After Week 3, we'll know if Chrome Farm is viable or if we need more Genymotion/real devices.
