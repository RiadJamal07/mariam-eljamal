// heynesh-inspired animation system: Lenis smooth scroll + GSAP ScrollTrigger/SplitText.
// Everything degrades gracefully: with no JS (or reduced motion) the page is fully
// static and visible — hidden states are only ever applied from here.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const desktop = window.matchMedia('(min-width: 901px)');

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

  /* ——— Lenis smooth scroll wired to ScrollTrigger ——— */
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ lerp: 0.18, wheelMultiplier: 1.15 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    // Anchor links go through Lenis so pinned sections scroll correctly
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      });
    });
  }

  /* ——— Intro: preloader → sidebar assembles → hero enters ——— */

  const pre = document.querySelector('.preloader');
  const sidebarWidgets = gsap.utils.toArray('.sidebar > *');
  const heroCopyBits = gsap.utils.toArray('.hero-kicker, .hero-title, .hero-actions, .hero-scroll-hint');

  gsap.set('.pre-wordmark', { xPercent: -115 });
  gsap.set(sidebarWidgets, { autoAlpha: 0, scale: 0.9, y: 12 });
  gsap.set(heroCopyBits, { autoAlpha: 0, y: 22 });
  gsap.set('.hero-media > img', { autoAlpha: 0, scale: 0.96 });
  gsap.set('.hero-card', { autoAlpha: 0, scale: 0.7, y: 14 });

  // Wait for the display font (capped at 1.2s) so the preloader wordmark
  // never slides in mid-fontswap — that's what "mangled" looks like.
  const fontsReady = Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((r) => setTimeout(r, 1200)),
  ]);

  fontsReady.then(() => {
    gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => { pre?.remove(); initCounters(false); },
    })
      .to('.pre-wordmark', { xPercent: 0, duration: 0.7 })
      .to(pre, { yPercent: -100, duration: 0.6, ease: 'expo.inOut', delay: 0.25 })
      // Whole wordmark rises out of its own mask — no char splitting,
      // so the ® superscript can't break the metrics.
      .from('.hero-wordmark', { yPercent: 112, duration: 0.8 }, '-=0.3')
      .to(sidebarWidgets, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, stagger: 0.05 }, '-=0.5')
      .to(heroCopyBits, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.07 }, '-=0.45')
      .to('.hero-media > img', { autoAlpha: 1, scale: 1, duration: 0.7 }, '-=0.5')
      .to('.hero-card', { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.5)', stagger: 0.1 }, '-=0.35');
  });

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
        .to('.hero-wordmark', { yPercent: -35, autoAlpha: 0.08, ease: 'none' }, 0)
        .to(heroCopyBits, { yPercent: -130, autoAlpha: 0, stagger: 0.04, ease: 'power1.in' }, 0)
        .to('.hero-media > img', { yPercent: -8, scale: 0.95, autoAlpha: 0.15, ease: 'none' }, 0.1)
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
          scrollTrigger: { trigger: el, start: 'top 82%' },
        });
      } else {
        gsap.from(el, {
          y: 40, autoAlpha: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 82%' },
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
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  gsap.utils.toArray('.tl-card, .service-card, .faq-card, .chat-row').forEach((el, i) => {
    gsap.from(el, {
      autoAlpha: 0, scale: 0.88, y: 30, duration: 1.0, ease: 'expo.out',
      delay: (i % 3) * 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // Work cards pop against the pinned panel's own scroll
  gsap.from('.work-card', {
    autoAlpha: 0, scale: 0.8, y: 30, duration: 1.0, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.work-pin', start: 'top 55%' },
  });

  /* ——— Timeline line draws itself ——— */

  gsap.from('.timeline-line', {
    scaleY: 0,
    transformOrigin: 'top center',
    ease: 'none',
    scrollTrigger: {
      trigger: '.timeline',
      start: 'top 75%',
      end: 'bottom 65%',
      scrub: 0.5,
    },
  });

  // Year numerals slide in with a small overshoot
  gsap.utils.toArray('.tl-year').forEach((el) => {
    gsap.from(el, {
      x: -34, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.7)',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  /* ——— Capability pills scale in mid-sentence ——— */

  gsap.from('.cap-pill', {
    scale: 0.55, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.09,
    scrollTrigger: { trigger: '.statement', start: 'top 78%' },
  });

  gsap.from('.statement', {
    autoAlpha: 0, y: 30, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '.statement', start: 'top 85%' },
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
}
