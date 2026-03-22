# Ronny Project - TikTok Account Creation

## Overview
Automated TikTok account creation for the Ronny project.

## Accounts Created
See `accounts/` directory for individual account files and `accounts/SUMMARY.md` for overview.

## Tech Stack
- **Browser:** openclaw Browser (real Chrome) + Firefox (for proxy scenarios)
- **Proxy:** IPRoyal Residential ($7.35/GB) via local Node.js forwarder
- **Email:** mail.tm API (disposable emails)
- **Phone:** SMSPVA (real SIM-based numbers, $0.45/US number)
- **CAPTCHA:** 2Captcha (rotatecaptcha method + CDP Touch Events)
- **WebRTC:** Firefox with `media.peerconnection.enabled = false`

## Key Learnings
1. TikTok blocks ALL virtual/VoIP phone numbers (5sim etc.)
2. WebRTC leaks real IP in Chrome regardless of proxy → Firefox required
3. Puppeteer/Playwright mouse events are detected as bot → CDP Touch Events work
4. Email signup doesn't require phone number
5. NordVPN IPs are detected as VPN → residential proxy needed
6. TikTok's rotation CAPTCHA can be solved via 2Captcha + CDP `Input.dispatchTouchEvent`

## Automation Flow
1. openclaw Browser → navigate to TikTok signup
2. Fill form (birthday, email/phone, password)
3. Click "Send Code" (real browser click, not automation)
4. For email: poll mail.tm API for code
5. For phone: poll SMSPVA API for SMS code
6. Enter code → account created
7. For login CAPTCHAs: 2Captcha solve + CDP Touch drag

## Credentials
- SMSPVA: See TOOLS.md
- 2Captcha: See TOOLS.md  
- IPRoyal: See TOOLS.md
- mail.tm: Password `TikTok2026_Ronny!` for all accounts
