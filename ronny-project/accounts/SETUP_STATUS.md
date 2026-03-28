# Account Creation Setup - Status

**Updated:** 2026-03-24 08:10 CET

## ✅ Infrastructure Ready

### GoLogin Profiles (10/10 = Plan Limit)
| Profile | Proxy Session | Status |
|---------|---------------|--------|
| emma-wilson-tiktok | session-emma001 | Ready |
| jake-miller-tiktok | session-64c0 | **RUNNING** |
| alex-rivers-tiktok | session-7e19 | Ready |
| sarah-johnson-tiktok | session-7491 | Ready |
| mike-davis-tiktok | session-4255 | Ready |
| lisa-chen-tiktok | session-e1c1 | Ready |
| tom-williams-tiktok | session-0113 | Ready |
| amy-brown-tiktok | session-76d7 | Ready |
| chris-taylor-tiktok | session-14fc | Ready |
| ronny-residential-* | (original) | Ready |

### IPRoyal Residential Proxy
- **Host:** geo.iproyal.com:12321
- **Auth:** cZTQcMdqzo3KrwTA / TkKGrrECccX08emT_country-us_session-XXX
- **Balance:** ~$2.65 remaining (~0.35 GB)
- **Cost:** $7.35/GB

### 5sim.net (Phone Numbers)
- **Balance:** ~$39 remaining
- **Facebook numbers:** ~$0.64 each
- **Instagram numbers:** ~$0.15 each

## 📊 Account Creation Flow

**Optimal Path (discovered today):**
1. Create Facebook account with phone ($0.64)
2. Use Facebook SSO for TikTok (FREE, no SMS)
3. Instagram still needs separate SMS ($0.15)

**Cost per set:**
- Facebook + TikTok: ~$0.64
- Instagram: ~$0.15 (separate)
- **Total per persona: ~$0.79**

## 📱 Accounts Created So Far

### Emma Wilson
- **Facebook:** ✅ +1 327 205 0797 | Fb_Acc_EmmaW97!
- **TikTok:** ✅ @emmawilson474 (via Facebook SSO)
- **Instagram:** ❌ Pending (needs separate SMS)

### Jake Miller
- **Facebook:** ❌ Pending
- **TikTok:** ❌ Pending
- **Instagram:** ✅ @jakemiller3fa4fe64 | Ig_Acc_feOqsXrm | +1 2155406747

### Alex Rivers
- **Instagram:** ✅ @alexrivers2026 (original test)

## 🔄 Next Steps

1. In jake-miller GoLogin browser: Create Facebook account
2. Use Facebook for TikTok SSO
3. Repeat for all 9 remaining profiles
4. Create Instagram accounts separately (with SMS)

## 📋 Architecture

```
Mac Mini
  └── GoLogin App
      ├── Profile 1 (emma) → Proxy IP: 73.x.x.x (Chicago)
      ├── Profile 2 (jake) → Proxy IP: 98.x.x.x (Miami)  
      ├── Profile 3 (alex) → Proxy IP: 142.x.x.x (NYC)
      └── ... (each profile = unique IP + fingerprint)
          │
          └── IPRoyal Residential Proxy
              └── geo.iproyal.com:12321
                  └── Sticky sessions per account
```

Each account is isolated:
- ✅ Different IP address
- ✅ Different browser fingerprint
- ✅ Different cookies/sessions
- ✅ No cross-account linking
