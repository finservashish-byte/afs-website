/**
 * AFS Phase 3 — Animation & Interaction Layer
 * Ashish Financial Services | ashishfinancialservices.in
 * Drop into Hugo /assets/ — bundled by Hugo Pipes alongside Phase 2 base JS
 * Version: 3.0.0 | April 2025
 *
 * Modules:
 *   1. Utilities
 *   2. Top Banner (dismiss & persistence)
 *   3. Navigation (scroll behaviour, hamburger, active link, dark-mode on hero)
 *   4. Scroll Animations (IntersectionObserver — fade/slide/scale/blur, stagger)
 *   5. Stat Counters (animated number roll-up)
 *   6. Swipe / Drag Scroll (testimonials, timeline, milestone strip)
 *   7. Swipe Indicator Dots
 *   8. Bottom Navigation Bar (active state, sync with scroll)
 *   9. Calculator Tab Switcher
 *  10. Page Load Entrance
 *  11. Smooth Anchor Scrolling (with nav offset)
 *  12. Micro-interaction: Button Ripple
 *  13. Performance Guard (skip heavy effects on low-end devices)
 *  14. Init
 *
 * Zero dependencies — vanilla JS only, no libraries.
 * Performance: all IntersectionObservers share a single rootMargin.
 * Memory: all observers disconnect once all targets are revealed.
 */

'use strict';

/* ============================================================
   1. UTILITIES
   ============================================================ */

const afs = {

  /** Shorthand querySelector */
  qs: (sel, ctx = document) => ctx.querySelector(sel),

  /** Shorthand querySelectorAll → Array */
  qsa: (sel, ctx = document) => [...ctx.querySelectorAll(sel)],

  /** Run fn once DOM is ready */
  ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  },

  /** Throttle — run at most once per `wait` ms */
  throttle(fn, wait = 100) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last < wait) return;
      last = now;
      fn.apply(this, args);
    };
  },

  /** Debounce */
  debounce(fn, wait = 150) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  },

  /** Clamp a number between min and max */
  clamp: (val, min, max) => Math.min(Math.max(val, min), max),

  /** Linear interpolation */
  lerp: (a, b, t) => a + (b - a) * t,

  /** Detect reduced motion preference */
  prefersReducedMotion: () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  /** Detect mobile viewport */
  isMobile: () => window.innerWidth < 768,

  /** localStorage helpers with try/catch (private/incognito safe) */
  store: {
    get(key) {
      try { return localStorage.getItem(key); }
      catch { return null; }
    },
    set(key, val) {
      try { localStorage.setItem(key, val); }
      catch { /* noop */ }
    },
  },

  /** CSS custom property getter */
  cssVar: (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
};


/* ============================================================
   2. TOP BANNER — DISMISS & PERSISTENCE
   ============================================================ */

function initBanner() {
  const banner  = afs.qs('.afs-banner');
  const nav     = afs.qs('.afs-nav');
  const closeBtn = afs.qs('.afs-banner__close');

  if (!banner) return;

  // Restore dismissed state across sessions
  if (afs.store.get('afs-banner-dismissed') === '1') {
    banner.classList.add('is-hidden');
    nav?.classList.add('banner-hidden');
    return;
  }

  closeBtn?.addEventListener('click', () => {
    banner.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    banner.classList.add('is-hidden');
    nav?.classList.add('banner-hidden');
    afs.store.set('afs-banner-dismissed', '1');
  });
}


/* ============================================================
   3. NAVIGATION
   ============================================================ */

function initNav() {
  const nav        = afs.qs('.afs-nav');
  const hamburger  = afs.qs('.afs-nav__hamburger');
  const drawer     = afs.qs('.afs-nav__drawer');
  const drawerLinks = afs.qsa('.afs-nav__drawer-link');
  const hero       = afs.qs('.hero');

  if (!nav) return;

  // ── 3A. Scroll behaviour ──
  let lastScrollY = 0;
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;

      // Scrolled past threshold → darken nav
      nav.classList.toggle('is-scrolled', scrollY > 40);

      // Hero overlap → navy glass nav
      if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        nav.classList.toggle('nav--dark', heroBottom > 0 && scrollY < 80);
      }

      lastScrollY = scrollY;
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // ── 3B. Hamburger / drawer toggle ──
  const openDrawer = () => {
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer?.classList.add('is-open');
    document.body.classList.add('nav-open');
  };

  const closeDrawer = () => {
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer?.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('is-open');
    isOpen ? closeDrawer() : openDrawer();
  });

  // Close drawer on link click
  drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Close on outside click (tap on overlay area)
  document.addEventListener('click', (e) => {
    if (
      drawer?.classList.contains('is-open') &&
      !drawer.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeDrawer();
    }
  });

  // ── 3C. Active link — based on current URL ──
  const currentPath = window.location.pathname;
  afs.qsa('.afs-nav__link, .afs-nav__drawer-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const isActive =
      currentPath === href ||
      (href !== '/' && currentPath.startsWith(href));
    link.classList.toggle('is-active', isActive);
  });
}


/* ============================================================
   4. SCROLL ANIMATIONS — INTERSECTION OBSERVER
   ============================================================ */

function initScrollAnimations() {
  if (afs.prefersReducedMotion()) return;

  // ── 4A. Individual animated elements ──
  const animatedEls = afs.qsa('[data-animate]');

  if (animatedEls.length) {
    const singleObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;

          // Support custom delay via data attribute: data-delay="200"
          const delay = parseInt(el.dataset.delay || '0', 10);

          setTimeout(() => {
            el.classList.add('is-visible');
          }, delay);

          observer.unobserve(el);
        });
      },
      {
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.10,
      }
    );

    animatedEls.forEach(el => singleObserver.observe(el));
  }

  // ── 4B. Stagger groups ──
  const groups = afs.qsa('[data-animate-group]');

  if (groups.length) {
    const groupObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08,
      }
    );

    groups.forEach(group => groupObserver.observe(group));
  }

  // ── 4C. Section heading clip reveal ──
  const headings = afs.qsa('.section-heading');

  if (headings.length) {
    const headingObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.20 }
    );

    headings.forEach(h => headingObserver.observe(h));
  }
}


/* ============================================================
   5. STAT COUNTERS — ANIMATED NUMBER ROLL-UP
   Triggered by IntersectionObserver when strip enters viewport.
   ============================================================ */

function initStatCounters() {
  const statValues = afs.qsa('.stat-card__value[data-target]');
  if (!statValues.length) return;

  /**
   * Animate a number from 0 to `target`.
   * Supports suffixes like '+', 'Cr+', '%', ' Years'.
   * Format large numbers with Indian comma grouping.
   */
  function animateCounter(el) {
    const raw     = el.dataset.target;           // e.g. "100", "2", "12", "100"
    const suffix  = el.dataset.suffix || '';      // e.g. "+", "Cr+", "% AMFI"
    const prefix  = el.dataset.prefix || '';      // e.g. "₹"
    const target  = parseFloat(raw);
    const isFloat = raw.includes('.');
    const duration = 1600; // ms
    const start   = performance.now();

    el.classList.add('is-counting');

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = afs.clamp(elapsed / duration, 0, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      const formatted = isFloat
        ? current.toFixed(1)
        : Math.floor(current).toLocaleString('en-IN');

      el.textContent = `${prefix}${formatted}${suffix}`;

      if (progress < 1) requestAnimationFrame(tick);
      else {
        el.textContent = `${prefix}${isFloat ? target.toFixed(1) : target.toLocaleString('en-IN')}${suffix}`;
        el.classList.remove('is-counting');
      }
    };

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.50 }
  );

  statValues.forEach(el => counterObserver.observe(el));
}


/* ============================================================
   6. SWIPE / DRAG SCROLL
   Handles: testimonials carousel, milestone timeline strip.
   Mouse drag + touch — no third-party library needed.
   ============================================================ */

function initSwipeContainers() {
  const containers = afs.qsa('.swipe-container, .timeline-strip');
  if (!containers.length) return;

  containers.forEach(container => {
    let isDown     = false;
    let startX     = 0;
    let scrollLeft = 0;
    let velocity   = 0;
    let lastX      = 0;
    let momentum   = null;

    // ── Mouse drag ──
    container.addEventListener('mousedown', (e) => {
      isDown     = true;
      startX     = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      lastX      = e.pageX;
      velocity   = 0;
      container.classList.add('is-dragging');
      cancelAnimationFrame(momentum);
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x    = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.4;
      velocity   = e.pageX - lastX;
      lastX      = e.pageX;
      container.scrollLeft = scrollLeft - walk;
    });

    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      container.classList.remove('is-dragging');

      // Momentum scroll
      const applyMomentum = () => {
        velocity *= 0.92;
        container.scrollLeft -= velocity;
        if (Math.abs(velocity) > 0.5) {
          momentum = requestAnimationFrame(applyMomentum);
        }
      };
      momentum = requestAnimationFrame(applyMomentum);
    };

    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);

    // Prevent link clicks when dragging
    container.addEventListener('click', (e) => {
      if (Math.abs(velocity) > 2) e.preventDefault();
    }, { capture: true });

    // ── Touch — already handled by CSS scroll-snap + -webkit-overflow-scrolling ──
    // Add velocity tracking for momentum on touch end
    let touchStartX    = 0;
    let touchScrollLeft = 0;

    container.addEventListener('touchstart', (e) => {
      touchStartX    = e.changedTouches[0].clientX;
      touchScrollLeft = container.scrollLeft;
    }, { passive: true });
  });
}


/* ============================================================
   7. SWIPE INDICATOR DOTS — auto-sync to scroll position
   ============================================================ */

function initSwipeDots() {
  // Each .swipe-container may have a paired .swipe-dots
  afs.qsa('.swipe-container').forEach(container => {
    // Look for dots sibling
    const dotsEl = container.parentElement?.querySelector('.swipe-dots');
    if (!dotsEl) return;

    const dots = afs.qsa('.swipe-dot', dotsEl);
    if (!dots.length) return;

    const updateDots = afs.throttle(() => {
      const items     = afs.qsa('.swipe-item', container);
      if (!items.length) return;
      const itemWidth = items[0].offsetWidth + 16; // gap
      const index     = afs.clamp(
        Math.round(container.scrollLeft / itemWidth),
        0,
        dots.length - 1
      );
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    }, 80);

    container.addEventListener('scroll', updateDots, { passive: true });

    // Dot click → scroll to item
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const items = afs.qsa('.swipe-item', container);
        if (!items[i]) return;
        container.scrollTo({
          left: items[i].offsetLeft - parseInt(
            getComputedStyle(container).paddingLeft || '0', 10
          ),
          behavior: 'smooth',
        });
      });
    });

    // Initial state
    updateDots();
  });
}


/* ============================================================
   8. BOTTOM NAVIGATION BAR — ACTIVE STATE & SCROLL SYNC
   ============================================================ */

function initBottomNav() {
  const bottomNav = afs.qs('.bottom-nav');
  if (!bottomNav) return;

  const items = afs.qsa('.bottom-nav__item[data-section]', bottomNav);
  if (!items.length) return;

  // Collect sections from data-section attributes
  const sectionMap = items.map(item => ({
    item,
    section: afs.qs(`#${item.dataset.section}`),
  })).filter(({ section }) => section !== null);

  const updateActive = afs.throttle(() => {
    const scrollMid = window.scrollY + window.innerHeight * 0.4;

    let activeSection = null;
    sectionMap.forEach(({ section }) => {
      if (section.offsetTop <= scrollMid) activeSection = section;
    });

    sectionMap.forEach(({ item, section }) => {
      item.classList.toggle('is-active', section === activeSection);
    });
  }, 120);

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();

  // Tab click → smooth scroll to section
  items.forEach(item => {
    item.addEventListener('click', (e) => {
      const sectionId = item.dataset.section;
      const target    = afs.qs(`#${sectionId}`);
      if (!target) return;

      e.preventDefault();
      const navH = parseInt(afs.cssVar('--nav-height') || '68', 10);
      const bannerH = document.querySelector('.afs-banner:not(.is-hidden)')
        ? parseInt(afs.cssVar('--banner-height') || '44', 10) : 0;
      const offset = navH + bannerH + 12;

      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth',
      });
    });
  });
}


/* ============================================================
   9. CALCULATOR TAB SWITCHER
   ============================================================ */

function initCalcTabs() {
  afs.qsa('.calc-tabs').forEach(tabGroup => {
    const tabs    = afs.qsa('.calc-tab', tabGroup);
    const panelId = tabGroup.dataset.panelGroup;
    const panels  = panelId
      ? afs.qsa(`[data-panel-group="${panelId}"] .calc-panel`)
      : [];

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        // Update tabs
        tabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        // Update panels
        panels.forEach((panel, j) => {
          panel.hidden = j !== i;
          panel.setAttribute('aria-hidden', j !== i);
        });
      });
    });

    // Set initial state
    if (tabs[0]) {
      tabs[0].classList.add('is-active');
      tabs[0].setAttribute('aria-selected', 'true');
    }
    panels.forEach((panel, j) => {
      panel.hidden = j !== 0;
    });
  });
}


/* ============================================================
   10. PAGE LOAD ENTRANCE — hero stagger on first paint
   ============================================================ */

function initPageEntrance() {
  if (afs.prefersReducedMotion()) return;

  const entranceEls = afs.qsa('[data-entrance]');
  if (!entranceEls.length) return;

  // Each el gets a staggered opacity/translateY reveal on DOMContentLoaded
  entranceEls.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = 'none';

    // Trigger after browser paint — avoids FOUC
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const delay = 120 + i * 100; // 120ms base + 100ms stagger
        el.style.transition = `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
        el.style.opacity    = '1';
        el.style.transform  = 'none';
      });
    });
  });
}


/* ============================================================
   11. SMOOTH ANCHOR SCROLLING — with nav height offset
   ============================================================ */

function initSmoothAnchors() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const navH    = parseInt(afs.cssVar('--nav-height') || '68', 10);
    const bannerH = document.querySelector('.afs-banner:not(.is-hidden)')
      ? parseInt(afs.cssVar('--banner-height') || '44', 10) : 0;
    const offset  = navH + bannerH + 8;

    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth',
    });

    // Update URL without scroll jump
    history.pushState(null, '', `#${targetId}`);
  });
}


/* ============================================================
   12. MICRO-INTERACTION: BUTTON RIPPLE
   CSS handles the ripple via :active::after transition, but
   we programmatically position it to originate from click point.
   ============================================================ */

function initButtonRipple() {
  // Delegate to document
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    // Get click position relative to button
    const rect = btn.getBoundingClientRect();
    const x    = ((e.clientX - rect.left) / rect.width) * 100;
    const y    = ((e.clientY - rect.top)  / rect.height) * 100;

    // Set radial-gradient origin
    btn.style.setProperty('--ripple-x', `${x}%`);
    btn.style.setProperty('--ripple-y', `${y}%`);
  }, { passive: true });
}


/* ============================================================
   13. PERFORMANCE GUARD
   On devices that signal "save-data" or report a slow
   connection, we skip the heavier ambient glow animations.
   ============================================================ */

function initPerformanceGuard() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData   = connection?.saveData;
  const slowConn   = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g';

  if (saveData || slowConn) {
    document.documentElement.classList.add('reduce-effects');
    // Inject override styles
    const style = document.createElement('style');
    style.textContent = `
      .reduce-effects .hero::before,
      .reduce-effects .hero::after,
      .reduce-effects .section--navy::before,
      .reduce-effects .digest-section::before { display: none; }
      .reduce-effects .glass-card,
      .reduce-effects .glass-card--dark { backdrop-filter: none; -webkit-backdrop-filter: none; }
    `;
    document.head.appendChild(style);
  }
}


/* ============================================================
   14. MILESTONE TIMELINE DRAG
   Separate from .swipe-container to support the specific
   .timeline-strip UX (horizontal stories-style strip).
   ============================================================ */

function initTimeline() {
  const strips = afs.qsa('.timeline-strip');
  strips.forEach(strip => {
    // Auto-scroll indicator (show that it's scrollable) — one gentle nudge
    if (strip.scrollWidth > strip.clientWidth) {
      setTimeout(() => {
        strip.scrollTo({ left: 60, behavior: 'smooth' });
        setTimeout(() => strip.scrollTo({ left: 0, behavior: 'smooth' }), 500);
      }, 1200);
    }
  });
}


/* ============================================================
   15. GLASS CARD TILT — subtle 3D on hover (desktop only)
   Applied only to .service-card.glass-card and
   .testimonial-card on non-touch screens.
   ============================================================ */

function initCardTilt() {
  if (afs.prefersReducedMotion()) return;
  if (window.matchMedia('(hover: none)').matches) return; // skip touch

  const tiltCards = afs.qsa('.service-card, .testimonial-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotateX = -dy * 5; // max ±5deg
      const rotateY =  dx * 5;

      card.style.transform = `
        translateY(-6px) scale(1.01)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
      `;
      card.style.transition = 'transform 0.08s linear';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = '';
    });
  });
}


/* ============================================================
   16. WHATSAPP FAB — hide on scroll down, show on scroll up
   ============================================================ */

function initFAB() {
  const fab = afs.qs('.whatsapp-fab');
  if (!fab) return;

  let lastY   = 0;
  let hidden  = false;

  const onScroll = afs.throttle(() => {
    const y = window.scrollY;
    const scrollingDown = y > lastY && y > 200;

    if (scrollingDown && !hidden) {
      fab.style.transform = 'translateY(calc(100% + 20px))';
      hidden = true;
    } else if (!scrollingDown && hidden) {
      fab.style.transform = '';
      hidden = false;
    }

    lastY = y;
  }, 120);

  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ============================================================
   17. LAZY IMAGE LOADING — IntersectionObserver based
   For images with data-src attribute (Hugo template will
   output these for below-fold images).
   ============================================================ */

function initLazyImages() {
  const lazyImgs = afs.qsa('img[data-src]');
  if (!lazyImgs.length) return;

  const imgObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        img.classList.add('is-loaded');
        observer.unobserve(img);
      });
    },
    { rootMargin: '200px 0px' }
  );

  lazyImgs.forEach(img => imgObserver.observe(img));
}


/* ============================================================
   18. ACTIVE NAV LINK — SCROLL SPY
   Highlights the correct nav link as sections scroll into view.
   ============================================================ */

function initScrollSpy() {
  const sections = afs.qsa('section[id], div[id][data-spy]');
  const navLinks = afs.qsa('.afs-nav__link[href^="#"], .afs-nav__link[href*="/#"]');
  if (!sections.length || !navLinks.length) return;

  const spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(link => {
          const linkId = link.getAttribute('href').split('#')[1];
          link.classList.toggle('is-active', linkId === id);
        });
      });
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
  );

  sections.forEach(s => spyObserver.observe(s));
}


/* ============================================================
   19. RISK PROFILER — result reveal helper
   The Phase 1 calculator logic stays in the Hugo base JS.
   Phase 3 adds the animated result reveal.
   ============================================================ */

function initRiskProfiler() {
  const form   = afs.qs('[data-risk-profiler]');
  const result = afs.qs('[data-risk-result]');
  if (!form || !result) return;

  form.addEventListener('risk-result', (e) => {
    result.hidden = false;
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Trigger entrance animation
    result.style.opacity   = '0';
    result.style.transform = 'scale(0.92)';
    result.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        result.style.opacity   = '1';
        result.style.transform = 'none';
      });
    });
  });
}


/* ============================================================
   20. ASSET-ALLOCATION BAR — animated on visibility
   For model portfolio pages (Phase 1 static data, Phase 2+ CMS).
   ============================================================ */

function initAllocationBars() {
  if (afs.prefersReducedMotion()) return;

  const bars = afs.qsa('[data-allocation-bar]');
  if (!bars.length) return;

  const barObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        const pct = bar.dataset.allocationBar;
        bar.style.width = '0%';
        bar.style.transition = 'width 1s cubic-bezier(0.16, 1, 0.3, 1)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { bar.style.width = `${pct}%`; });
        });
        observer.unobserve(bar);
      });
    },
    { rootMargin: '0px 0px -80px 0px', threshold: 0.30 }
  );

  bars.forEach(bar => barObserver.observe(bar));
}


/* ============================================================
   14. INIT — Execute all modules
   ============================================================ */

afs.ready(() => {
  // Performance guard first — may inject override styles
  initPerformanceGuard();

  // Core UI
  initBanner();
  initNav();
  initScrollSpy();

  // Animations
  initPageEntrance();
  initScrollAnimations();
  initStatCounters();
  initAllocationBars();

  // Interactivity
  initSwipeContainers();
  initSwipeDots();
  initBottomNav();
  initCalcTabs();
  initSmoothAnchors();
  initButtonRipple();
  initCardTilt();
  initFAB();
  initTimeline();
  initLazyImages();
  initRiskProfiler();

  // Signal to CSS that JS has initialised (enables JS-dependent styles)
  document.documentElement.classList.add('js-ready');
});


/* ============================================================
   EXPORT — for Hugo ESBuild / module bundling
   If Hugo Pipes bundles as ESM, named exports allow tree-shaking.
   If loaded as classic script, all functions exist in module scope.
   ============================================================ */

// Expose the afs namespace for Phase 4 tools that extend it
window.afs = afs;

/* ── Sticky adaptive navbar ── */
(function(){
  const nav = document.querySelector('.afs-nav');
  if (!nav) return;
  const btn = document.getElementById('backToTop');

  window.addEventListener('scroll', function() {
    const scrolled = window.scrollY > 60;
    nav.classList.toggle('is-scrolled', scrolled);
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
})();
