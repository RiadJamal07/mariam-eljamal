// heynesh-inspired animation system: Lenis smooth scroll + GSAP ScrollTrigger/SplitText.
// Everything degrades gracefully: with no JS (or reduced motion) the page is fully
// static and visible — hidden states are only ever applied from here.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const desktop = window.matchMedia('(min-width: 901px)');

// Reload always starts the story from the top — browser scroll restoration
// would otherwise drop you mid-page with the preloader/pins out of sync.
if (!new URLSearchParams(location.search).has('qy')) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.addEventListener('pageshow', () => window.scrollTo(0, 0));
}

/* ——— Utilities that work with or without GSAP ——— */

function initCounters(immediate) {
  const counters = document.querySelectorAll('[data-count]');
  counters.forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    if (immediate) { el.textContent = target; return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(el);
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / 1300, 1);
          el.textContent = Math.round((1 - Math.pow(1 - t, 3)) * target);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    io.observe(el);
  });
}

function initMenuSpy() {
  const menuLinks = [...document.querySelectorAll('.menu-link')];
  const sections = menuLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length) return;
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      menuLinks.forEach((a) =>
        a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`)
      );
    });
  }, { rootMargin: '-25% 0px -55% 0px' });
  sections.forEach((s) => spy.observe(s));
}

function initEmailCopy() {
  const w = document.querySelector('.widget-email');
  if (!w) return;
  const hint = w.querySelector('.email-hint');
  w.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(w.dataset.email);
      hint.textContent = 'Copied!';
    } catch {
      hint.textContent = w.dataset.email;
    }
    setTimeout(() => { hint.textContent = 'Click to copy'; }, 2000);
  });
}

// Masked text-swap on buttons (heynesh hover): label slides up, clone slides in.
function initButtonSwap() {
  document.querySelectorAll('.btn').forEach((btn) => {
    if (btn.querySelector('.btn-label')) return;
    const text = btn.textContent.trim();
    btn.innerHTML = `<span class="btn-label"><span class="btn-line">${text}</span><span class="btn-line" aria-hidden="true">${text}</span></span>`;
  });
}

initMenuSpy();
initEmailCopy();
initButtonSwap();

/* ——— Static fallback: no GSAP or reduced motion ——— */

const staticMode = new URLSearchParams(location.search).has('static');

if (!hasGsap || reduceMotion || staticMode) {
  document.querySelector('.preloader')?.remove();
  document.body.classList.add('no-anim');
  initCounters(reduceMotion);
} else {
  main();
}

function main() {
  gsap.registerPlugin(ScrollTrigger);
  const hasSplit = typeof SplitText !== 'undefined';
  if (hasSplit) gsap.registerPlugin(SplitText);

  /* Native scroll — no smoothing layer, 1:1 with the wheel. */

  /* ——— Intro: preloader → hero enters → sidebar assembles on scroll ——— */

  const pre = document.querySelector('.preloader');
  const sidebarWidgets = gsap.utils.toArray('.sidebar > *');
  const heroFront = gsap.utils.toArray('.hero-title, .hero-actions');

  gsap.set('.ghost-nav a', { autoAlpha: 0, y: -14 });
  gsap.set('.hero-figure', { autoAlpha: 0, yPercent: 8 });
  gsap.set(heroFront, { autoAlpha: 0, y: 26 });
  gsap.set('.hero-corner', { autoAlpha: 0 });
  gsap.set('.hero-card', { autoAlpha: 0, scale: 0.7, y: 14 });
  // nesh move: no sidebar at load — it assembles once you scroll (desktop)
  if (desktop.matches) gsap.set(sidebarWidgets, { autoAlpha: 0, scale: 0.9, y: 12 });

  // Wait for the display font (capped at 1.2s) so the preloader wordmark
  // never slides in mid-fontswap.
  const fontsReady = Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((r) => setTimeout(r, 1200)),
  ]);

  const revealAllNow = () => {
    pre?.remove();
    gsap.set([
      '.hero-wordmark', '.ghost-nav a', '.hero-figure', ...heroFront,
      '.hero-corner', '.hero-card',
    ], { autoAlpha: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1 });
    initCounters(true);
  };

  const qp = new URLSearchParams(location.search);
  if (qp.has('nopre')) revealAllNow();

  // Safety net: if anything stalls the intro (fonts, CDN), never leave the
  // user staring at the preloader — force everything visible.
  setTimeout(() => {
    if (document.querySelector('.preloader')) revealAllNow();
  }, 4000);

  fontsReady.then(() => {
    if (!document.querySelector('.preloader')) return;
    gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => { pre?.remove(); initCounters(false); },
    })
      // (the wordmark slide-in is a CSS animation — JS only lifts the overlay)
      .to(pre, { yPercent: -100, duration: 0.55, ease: 'expo.inOut', delay: 0.25 })
      // Wordmark rises out of its mask as one piece (® breaks char-splitting)
      .from('.hero-wordmark', { yPercent: 112, duration: 0.75 }, '-=0.28')
      .to('.hero-figure', { autoAlpha: 1, yPercent: 0, duration: 0.7 }, '-=0.55')
      .to('.ghost-nav a', { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.04 }, '-=0.55')
      .to(heroFront, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08 }, '-=0.4')
      .to('.hero-corner', { autoAlpha: 1, duration: 0.5 }, '-=0.4')
      .to('.hero-card', { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)', stagger: 0.09 }, '-=0.35');
  });

  // Sidebar assembles piece-by-piece scrubbed to hero progress (nesh move) —
  // and disassembles again when you scroll back to the top.
  if (desktop.matches) {
    gsap.to(sidebarWidgets, {
      autoAlpha: 1, scale: 1, y: 0,
      stagger: 0.12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-pin',
        start: '2% top',
        end: '60% bottom',
        scrub: 0.4,
      },
    });
  }

  /* ——— Hero exit: pinned stage dissolves as you scroll (desktop) ——— */

  ScrollTrigger.matchMedia({
    '(min-width: 901px)': () => {
      // Transform/opacity only — no blur or letter-spacing, they jank the scrub.
      gsap.timeline({
        scrollTrigger: {
          trigger: '.hero-pin',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
        },
      })
        .to('.hero-wordmark', { yPercent: -50, autoAlpha: 0.05, ease: 'none' }, 0)
        .to('.ghost-nav a', { y: -30, autoAlpha: 0, stagger: 0.03, ease: 'power1.in' }, 0)
        .to(heroFront, { yPercent: -120, autoAlpha: 0, stagger: 0.04, ease: 'power1.in' }, 0)
        .to('.hero-corner', { autoAlpha: 0, ease: 'none' }, 0.1)
        .to('.hero-figure', { yPercent: 14, scale: 0.97, autoAlpha: 0.25, ease: 'none' }, 0.1)
        .to('.hero-card-projects', { x: '-22vw', scale: 0.4, autoAlpha: 0, ease: 'power1.in' }, 0.05)
        .to('.hero-card-traits', { x: '18vw', scale: 0.4, autoAlpha: 0, ease: 'power1.in' }, 0.1);

      /* ——— Work: vertical scroll drives horizontal travel ——— */
      const track = document.querySelector('.work-track');
      const sticky = document.querySelector('.work-sticky');
      if (track && sticky) {
        const travel = () => -(track.scrollWidth - sticky.clientWidth + 60);
        gsap.to(track, {
          x: travel,
          ease: 'none',
          scrollTrigger: {
            trigger: '.work-pin',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        });
      }
    },
  });

  /* ——— Masked line reveals on headings ——— */

  const splitTargets = gsap.utils.toArray('[data-split]');
  const doSplits = () => {
    splitTargets.forEach((el) => {
      if (hasSplit) {
        const split = new SplitText(el, { type: 'lines', mask: 'lines' });
        gsap.from(split.lines, {
          yPercent: 110,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 82%' , toggleActions: 'play none none reverse' },
        });
      } else {
        gsap.from(el, {
          y: 40, autoAlpha: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 82%' , toggleActions: 'play none none reverse' },
        });
      }
    });
  };
  if (document.fonts?.ready) document.fonts.ready.then(doSplits);
  else doSplits();

  /* ——— Section entrances: labels, intros, cards pop ——— */

  gsap.utils.toArray('.label, .section-intro').forEach((el) => {
    gsap.from(el, {
      autoAlpha: 0, y: 18, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' , toggleActions: 'play none none reverse' },
    });
  });

  gsap.utils.toArray('.service-card, .faq-card, .chat-row').forEach((el, i) => {
    gsap.from(el, {
      autoAlpha: 0, scale: 0.88, y: 30, duration: 1.0, ease: 'expo.out',
      delay: (i % 3) * 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%' , toggleActions: 'play none none reverse' },
    });
  });

  // Work cards pop against the pinned panel's own scroll
  gsap.from('.work-card', {
    autoAlpha: 0, scale: 0.8, y: 30, duration: 1.0, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.work-pin', start: 'top 55%' , toggleActions: 'play none none reverse' },
  });

  /* ——— Timeline: nesh's curved path — an S-curve threads through the
     alternating cards, drawing itself as you scroll, dot nodes popping
     at each card's edge ——— */

  const timeline = document.querySelector('.timeline');
  if (timeline && desktop.matches) {
    const svg = timeline.querySelector('.tl-path');
    const line = svg.querySelector('.tl-line');
    const cards = gsap.utils.toArray('.tl-card');
    const NS = 'http://www.w3.org/2000/svg';
    const dots = cards.map(() => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'tl-dot');
      c.setAttribute('r', '6');
      svg.appendChild(c);
      return c;
    });

    let pathLen = 0;
    const computeGeometry = () => {
      // offsetLeft/Top are transform-free: entrance tweens shift the cards,
      // and the path must anchor to their resting layout positions.
      const W = timeline.offsetWidth;
      const H = timeline.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const pts = cards.map((card, i) => {
        const leftSide = i % 2 === 0;
        return {
          x: leftSide ? card.offsetLeft + card.offsetWidth + 10 : card.offsetLeft - 10,
          y: card.offsetTop + card.offsetHeight * 0.55,
          sign: leftSide ? 1 : -1,
        };
      });
      const box = { width: W };
      const k = Math.min(box.width * 0.28, 340);
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        d += ` C ${a.x + a.sign * k} ${a.y}, ${b.x + b.sign * k} ${b.y}, ${b.x} ${b.y}`;
      }
      line.setAttribute('d', d);
      pts.forEach((p, i) => {
        dots[i].setAttribute('cx', p.x);
        dots[i].setAttribute('cy', p.y);
      });
      pathLen = line.getTotalLength();
      line.style.strokeDasharray = pathLen;
    };

    computeGeometry();
    ScrollTrigger.addEventListener('refreshInit', computeGeometry);

    gsap.fromTo(line,
      { strokeDashoffset: () => pathLen },
      {
        strokeDashoffset: 0,
        ease: 'none',
        immediateRender: true,
        scrollTrigger: {
          trigger: timeline,
          start: 'top 62%',
          end: 'bottom 78%',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

    cards.forEach((card, i) => {
      gsap.from(card, {
        autoAlpha: 0,
        x: (i % 2 === 0 ? -60 : 60),
        scale: 0.96,
        duration: 0.9,
        ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 82%' , toggleActions: 'play none none reverse' },
      });
      gsap.from(dots[i], {
        attr: { r: 0 },
        autoAlpha: 0,
        duration: 0.45,
        ease: 'back.out(2.2)',
        scrollTrigger: { trigger: card, start: 'top 70%' , toggleActions: 'play none none reverse' },
      });
      gsap.from(card.querySelector('.tl-year'), {
        yPercent: 60, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: card, start: 'top 78%' , toggleActions: 'play none none reverse' },
      });
    });
  } else if (timeline) {
    // Mobile: simple staggered entrances
    gsap.utils.toArray('.tl-card').forEach((card) => {
      gsap.from(card, {
        autoAlpha: 0, y: 30, duration: 0.8, ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 88%' , toggleActions: 'play none none reverse' },
      });
    });
  }

  /* ——— Capability pills scale in mid-sentence ——— */

  gsap.from('.cap-pill', {
    scale: 0.55, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.09,
    scrollTrigger: { trigger: '.statement', start: 'top 78%' , toggleActions: 'play none none reverse' },
  });

  gsap.from('.statement', {
    autoAlpha: 0, y: 30, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '.statement', start: 'top 85%' , toggleActions: 'play none none reverse' },
  });

  /* ——— Footer wordmark rises and tightens ——— */

  gsap.from('.footer-wordmark', {
    yPercent: 45,
    autoAlpha: 0,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.footer',
      start: 'top 85%',
      end: 'top 30%',
      scrub: 0.6,
    },
  });

  // QA hook: ?qy=<px> jumps to a scroll position, then re-syncs triggers
  const qy = parseInt(qp.get('qy') || '0', 10);
  if (qy) {
    window.scrollTo(0, qy);
    setTimeout(() => {
      window.scrollTo(0, qy);
      ScrollTrigger.refresh();
    }, 400);
  }
}
