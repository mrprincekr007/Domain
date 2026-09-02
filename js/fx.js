/* ============================================================
   SUBMANGA - FX engine
   Loader · page transition · reveals · counters · cursor
   particles · 3D tilt · magnetic · ripple
   ============================================================ */

const FX = (() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ambient background (aurora + particles) ---------- */
  function mountAmbient() {
    if (document.querySelector('.aurora')) return;
    document.querySelector('body').insertAdjacentHTML('afterbegin',
      '<div class="aurora">' +
        '<div class="blob blob-1"></div><div class="blob blob-2"></div>' +
        '<div class="blob blob-3"></div><div class="blob blob-4"></div>' +
      '</div><canvas class="fx-canvas" aria-hidden="true"></canvas>' +
      '<div class="cursor-glow" aria-hidden="true"></div>'
    );
    if (!reduceMotion) spawnParticles();
  }

  /* ---------- floating particles ---------- */
  function spawnParticles() {
    const cv = document.querySelector('.fx-canvas');
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let w, h;
    function resize() { w = cv.width = window.innerWidth; h = cv.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const N = Math.min(60, Math.floor(window.innerWidth / 26));
    const parts = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      hue: [196, 226, 280, 160][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.5 + 0.15,
      phase: Math.random() * Math.PI * 2,
    }));

    let running = true;
    function tick(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        const tw = 0.55 + 0.45 * Math.sin(t / 900 + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 78%, ${p.alpha * tw})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 70%, 0.6)`;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    window._fxStopParticles = () => { running = false; };
  }

  /* ---------- cursor glow -------------------------------- */
  function mountCursor() {
    if (matchMedia('(pointer: coarse)').matches || reduceMotion) return;
    const glow = document.querySelector('.cursor-glow');
    if (!glow) return;
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; glow.classList.add('on'); });
    document.addEventListener('mouseleave', () => glow.classList.remove('on'));
    (function loop() {
      cx += (x - cx) * 0.1; cy += (y - cy) * 0.1;
      glow.style.left = cx + 'px'; glow.style.top = cy + 'px';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- animated number counters ------------------- */
  function animateCounter(el, target, dur = 1200) {
    const fmt = (n) => (el.dataset.decimals ? n.toFixed(el.dataset.decimals) : Math.round(n).toString());
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = fmt(target) + suffix; return; }
    const start = performance.now();
    const from = 0;
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (target - from) * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- scroll reveals ----------------------------- */
  function initReveals(scope) {
    const root = scope || document;
    const els = root.querySelectorAll('.reveal, .reveal-left, .stagger, [data-reveal]');
    if (reduceMotion) {
      els.forEach((e) => e.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && en.target) {
          en.target.classList.add('visible');
          const delay = en.target.dataset.delay;
          if (delay) en.target.style.transitionDelay = delay + 'ms';
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- 3D tilt on hover --------------------------- */
  function initTilt(scope) {
    const root = scope || document;
    if (reduceMotion || matchMedia('(pointer: coarse)').matches) return;
    root.querySelectorAll('.tilt').forEach((card) => {
      let raf = null;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(900px) rotateX(${-py * 7}deg) rotateY(${px * 9}deg) translateY(-3px)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  /* ---------- magnetic buttons --------------------------- */
  function initMagnetic(scope) {
    const root = scope || document;
    if (reduceMotion || matchMedia('(pointer: coarse)').matches) return;
    root.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) * 0.3;
        const my = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.translate = `${mx}px ${my}px`;
      });
      el.addEventListener('mouseleave', () => { el.style.translate = ''; });
    });
  }

  /* ---------- ripple on click ---------------------------- */
  function initRipple(scope) {
    const root = scope || document;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, .btn-primary, .icon-btn');
      if (!btn || reduceMotion) return;
      const r = btn.getBoundingClientRect();
      const span = document.createElement('span');
      const size = Math.max(r.width, r.height);
      span.style.cssText =
        'position:absolute;border-radius:50%;background:rgba(255,255,255,0.35);' +
        `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;` +
        `top:${e.clientY - r.top - size / 2}px;transform:scale(0);animation:ripple .55s var(--ease);pointer-events:none;`;
      btn.style.position = btn.style.position || 'relative';
      btn.appendChild(span);
      setTimeout(() => span.remove(), 600);
    });
  }

  /* ---------- page loader -------------------------------- */
  let loaderTimer = null;
  function showLoader() {
    if (document.querySelector('.loader')) return;
    const div = document.createElement('div');
    div.className = 'loader';
    div.innerHTML =
      '<div class="loader-inner">' +
        '<div class="loader-logo">' + App.icons.logo + '<div class="loader-ring"></div></div>' +
        '<div class="loader-name">Sub<span>Manga</span></div>' +
        '<div class="loader-bar"><span></span></div>' +
      '</div>';
    document.body.appendChild(div);
    return div;
  }
  function hideLoader(cb) {
    const l = document.querySelector('.loader');
    if (!l) { if (cb) cb(); return; }
    clearTimeout(loaderTimer);
    loaderTimer = setTimeout(() => {
      l.classList.add('hide');
      setTimeout(() => { l.remove(); if (cb) cb(); }, 650);
    }, 350);
  }

  /* ---------- page transition on link click -------------- */
  function initPageLinks(only = '#sidebar a, .mobile-nav a, a[data-route]') {
    const curtain = document.createElement('div');
    curtain.className = 'page-curtain';
    document.body.appendChild(curtain);
    document.querySelectorAll(only).forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href === '') return;
      if (a.target === '_blank') return;
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        curtain.style.animation = 'none';
        void curtain.offsetWidth;
        curtain.style.animation = 'curtainIn .55s var(--ease) forwards';
        setTimeout(() => { window.location.href = href; }, 200);
      });
    });
  }

  /* ---------- run all on a page --------------------------- */
  function init(opts = {}) {
    const showLoaderFirst = opts.loader !== false;
    if (showLoaderFirst) showLoader();
    mountAmbient();
    if (opts.links) initPageLinks(opts.links);
    setTimeout(() => {
      initReveals();
      initTilt();
      initMagnetic();
      initRipple();
      mountCursor();
      hideLoader(() => { if (opts.onReady) opts.onReady(); });
    }, 30);
  }

  return {
    init, animateCounter, initReveals, initTilt, initMagnetic,
    initRipple, mountAmbient, showLoader, hideLoader, initPageLinks,
  };
})();
