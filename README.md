# Mariam el Jamal — MARIAM®

Personal site for Mariam el Jamal, independent data consultant.
**Complicated problems, simple solutions.**

A scroll-driven one-pager inspired by [heynesh.com](https://heynesh.com/):
full-viewport poster hero (edge-to-edge gold wordmark with Mariam's illustrated
figure standing over it), preloader wordmark, a fixed sidebar of glass widgets
that assembles as you scroll and disassembles on the way back up, a journey
timeline threaded on a self-drawing S-curve with dot nodes, a dark full-bleed
"Selected Work" section where illustrated cards travel horizontally under the
sidebar as you scroll vertically, capability pills embedded mid-sentence, a
chat-mockup CTA, and a giant-wordmark FAQ footer.

All in Mariam's own brand: warm cream canvas, black, and the gold of her
jewelry as the accent — with her original character art (cutout poses and
painted scenes) throughout.

## Stack

- Static HTML/CSS — no build step.
- [GSAP](https://gsap.com/) (ScrollTrigger, SplitText) from CDN; native scrolling.
- Typography: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque)
  (display) + [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) (body).
- Fully degrades: no JS / reduced motion / `?static` → clean static page.
- Content grounded in Mariam's real experience: ILO, UN ESCWA, AUB, IDRAAC,
  Right to Play, Action Against Hunger, MSF, USAID, LSE.

```
index.html      — the whole page
css/style.css   — design system + layout (+ static-mode fallbacks)
js/main.js      — preloader, sidebar assembly, pins/scrubs, timeline curve
assets/         — character art, scene illustrations, favicon
```

## Run locally

```sh
python3 -m http.server 8000
# → http://localhost:8000        (full experience)
# → http://localhost:8000?static (no-animation QA view)
```

## Deploy

Any static host (GitHub Pages, Netlify, Vercel). For GitHub Pages:
Settings → Pages → Deploy from branch → `main` / root.
