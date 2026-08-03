# Mariam el Jamal — MARIAM®

Personal site for Mariam el Jamal, independent data consultant.
**Complicated problems, simple solutions.**

A scroll-driven one-pager inspired by [heynesh.com](https://heynesh.com/):
fixed sidebar of stacked glass widgets, preloader wordmark, pinned hero that
dissolves as you scroll, a journey timeline that draws itself, a dark
"Selected Work" section where cards travel horizontally on vertical scroll,
capability pills embedded mid-sentence, a chat-mockup CTA, and a giant-wordmark
FAQ footer — reinterpreted in Mariam's own brand palette (warm cream, terracotta,
near-black) from her character mood board.

## Stack

- Static HTML/CSS — no build step.
- [Lenis](https://lenis.darkroom.engineering/) smooth scroll + [GSAP](https://gsap.com/)
  (ScrollTrigger, SplitText) from CDN for the animation system.
- Typography: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque)
  (display) + [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) (body).
- Fully degrades: no JS / reduced motion / `?static` → clean static page.
- Content grounded in Mariam's real experience: ILO, UN ESCWA, AUB, IDRAAC,
  Right to Play, Action Against Hunger, MSF, USAID, LSE.

```
index.html      — the whole page
css/style.css   — design system + layout (+ static-mode fallbacks)
js/main.js      — preloader, sidebar assembly, pins/scrubs, reveals, counters
assets/         — character illustrations (from her mood board), favicon
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
