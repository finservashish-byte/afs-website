// AFS — main.js | Nav, Banner, FAQ, Mobile Menu

document.addEventListener('DOMContentLoaded', () => {

  /* ---- WhatsApp Banner Dismiss ---- */
  const waBanner = document.getElementById('wa-banner');
  const waClose  = document.getElementById('wa-banner-close');
  if (waClose && waBanner) {
    if (sessionStorage.getItem('wa-banner-dismissed')) {
      waBanner.remove();
    } else {
      waClose.addEventListener('click', () => {
        waBanner.style.height = waBanner.offsetHeight + 'px';
        waBanner.style.overflow = 'hidden';
        requestAnimationFrame(() => {
          waBanner.style.transition = 'height 0.3s ease, opacity 0.3s ease';
          waBanner.style.height = '0';
          waBanner.style.opacity = '0';
          waBanner.style.padding = '0';
        });
        setTimeout(() => waBanner.remove(), 350);
        sessionStorage.setItem('wa-banner-dismissed', '1');
      });
    }
  }

  /* ---- Mobile Menu ---- */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---- Navbar offset after banner ---- */
  function updateNavOffset() {
    const banner = document.getElementById('wa-banner');
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const bannerH = banner ? banner.offsetHeight : 0;
      navbar.style.top = bannerH + 'px';
    }
  }
  updateNavOffset();
  window.addEventListener('resize', updateNavOffset);

  /* ---- FAQ Accordion ---- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ---- Calculator Tabs ---- */
  document.querySelectorAll('.calc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById(target);
      if (panel) { panel.classList.add('active'); initCalc(target); }
    });
  });

  /* ---- Activate first tab if on tools page ---- */
  const firstTab = document.querySelector('.calc-tab');
  if (firstTab) {
    firstTab.click();
  }

});

/* ── Count-up animation for stats ── */
(function(){
  const stats = document.querySelectorAll('.stat-item');
  if(!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if(!entry.isIntersecting) return;
      const el = entry.target;
      el.style.transitionDelay = (i * 120) + 'ms';
      el.classList.add('visible');
      const numEl = el.querySelector('[data-countup]');
      if(!numEl || numEl.dataset.counted) return;
      numEl.dataset.counted = '1';
      const target = parseInt(numEl.dataset.target) || 0;
      const prefix = numEl.dataset.prefix || '';
      const suffix = numEl.dataset.suffix || '';
      const duration = 1400;
      const step = 16;
      const steps = duration / step;
      let current = 0;
      numEl.classList.add('counting');
      const timer = setInterval(() => {
        current = Math.min(current + Math.ceil(target / steps), target);
        numEl.textContent = prefix + current + suffix;
        if(current >= target){
          clearInterval(timer);
          numEl.classList.remove('counting');
        }
      }, step);
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });

  stats.forEach(el => observer.observe(el));
})();
