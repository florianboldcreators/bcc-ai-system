# TikTok Account #1 - Ronny Project

**Created:** 2026-03-22 18:06 CET
**Username:** chicago800
**Email:** 75o0jobo7n@sharebot.net
**Email Password (mail.tm):** TikTok2026_Ronny!
**TikTok Password:** Ronny2026!!
**Method:** Email signup via Firefox + IPRoyal residential proxy
**Proxy IP:** Chicago, Comcast (residential)
**Phone:** None (email only)

## Setup Used
- Firefox with WebRTC disabled (`media.peerconnection.enabled = false`)
- IPRoyal residential proxy via local forwarder (port 18080)
- Disposable email via mail.tm API
- No phone number needed for email signup

## Key Learnings
1. Phone signup via 5sim FAILED — all virtual numbers blocked by TikTok
2. WebRTC leak was the main blocker — München IP leaked through Chrome
3. Firefox `media.peerconnection.enabled = false` = only reliable WebRTC fix
4. Email signup works WITHOUT phone number
5. TikTok assigns random username (chicago800)
