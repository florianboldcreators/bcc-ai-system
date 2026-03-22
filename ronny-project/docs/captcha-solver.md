# TikTok CAPTCHA Solver

## How it works
1. Extract captcha image from DOM (canvas → base64 PNG)
2. Submit to 2Captcha API (rotatecaptcha method)
3. Get rotation angle (degrees)
4. Calculate slider drag distance: `(angle / 360) * trackWidth`
5. Use CDP `Input.dispatchTouchEvent` for the drag (NOT mouse events!)

## Why Touch Events?
- TikTok checks `isTrusted` property on events
- Puppeteer `page.mouse.move/down/up` → detected as bot
- CDP `Input.dispatchMouseEvent` → also detected
- CDP `Input.dispatchTouchEvent` → works! Not detected.
- Also: TikTok's slider uses `onDragStart/onDrag/onDragEnd` and `onTouchStart/onTouchMove/onTouchEnd`

## Slider Geometry
- Button: `#captcha_slide_button` (64x40px)
- Track: grandparent element (walk up until width > 200px)
- Available drag: `trackWidth - buttonWidth` (~284px)

## 2Captcha Config
- Method: `rotatecaptcha`
- Cost: ~$0.005 per solve
- Time: 10-30 seconds per solve
