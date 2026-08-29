# Akureyri Ripple Heart

27-dot heart lattice with distance-normalized ripple phase. Signature red `#FF3366`.

## Files

| Path | Role |
|------|------|
| `index.html` | Social dual card (Light / Dark + Thinking) |
| `playground.html` | Param playground |
| `lib/ripple-heart.js` | Shared math (browser / Node) |
| `swift/RoseauHeartbeatView.swift` | SwiftUI `Canvas` + `TimelineView` mirror |
| `export/*.gif` / `*.mp4` | Share assets |
| `scripts/export-media.mjs` | Re-record GIF/MP4 (needs Chrome + ffmpeg) |

## Web vs SwiftUI

Same grid and phase math. Anti-aliasing, DPR, and frame timing differ — always check on device for product UI.

## Export

```bash
cd demos/akureyri-ripple-heart
npm install
npm run export   # uses Playwright channel: chrome
```

## Credit

Inspired by [Rocorgi · lovethinking](https://lovethinking.vercel.app/).
