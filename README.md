# Motion Lab

Open shelf for small, reusable **UI motion demos** (web + Swift when useful).

Not a design system. A place to keep motions we like, share them, and reuse later.

**Live:** *(filled after Vercel deploy)*

## Demos

| Demo | Path | Notes |
|------|------|--------|
| **Akureyri Ripple Heart** | [`demos/akureyri-ripple-heart/`](demos/akureyri-ripple-heart/) | 27-dot lattice, Akureyri red `#FF3366`, Light/Dark “Thinking” card, SwiftUI mirror, GIF/MP4 exports |

## Local

```bash
# any static server from repo root
npx --yes serve -l 8765 .
# open http://127.0.0.1:8765/
```

## Add another motion

1. Create `demos/<slug>/` with `index.html` (+ optional `lib/`, `swift/`, `export/`).
2. Link it from the root [`index.html`](index.html) gallery.
3. One-line row in this README.

## Credit

- Ripple heart lattice inspired by [Rocorgi · lovethinking](https://lovethinking.vercel.app/) and Akureyri’s heart-shaped traffic lights.
- Color `#FF3366` kept as the signature red for that demo.

## License

MIT — see [LICENSE](LICENSE).
