/* ============================================================
   SUBMANGA - shared app helpers (theme, nav, toast, dom utils)
   ============================================================ */

const App = (() => {
  /* -------- icons (Heroicons outline, inline SVG) -------- */
  const icons = {
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" stroke="white" stroke-width="2.2"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10.5L12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M12 3c2.5 2.7 4 5.6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-5.6-4-9s1.5-6.3 4-9z"/></svg>',
    dns: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16"/><path d="M7 4h.01M7 14h.01M7 9h.01M7 19h.01M17 6h.01M17 16h.01M17 11h.01" stroke-linecap="round" stroke-width="2.4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10.3 4.3a1.5 1.5 0 013 0l.3 1.9a1 1 0 00.62.83l1.8.7a1 1 0 001-.2l1.5-1.2a1.5 1.5 0 012.1 2.1l-1.2 1.5a1 1 0 00-.2 1l.7 1.8a1 1 0 00.84.62l1.9.3a1.5 1.5 0 010 3l-1.9.3a1 1 0 00-.83.62l-.7 1.8a1 1 0 00.2 1l1.2 1.5a1.5 1.5 0 01-2.1 2.1l-1.5-1.2a1 1 0 00-1-.2l-1.8.7a1 1 0 00-.62.84l-.3 1.9a1.5 1.5 0 01-3 0l-.3-1.9a1 1 0 00-.62-.83l-1.8-.7a1 1 0 00-1 .2l-1.5 1.2a1.5 1.5 0 01-2.1-2.1l1.2-1.5a1 1 0 00.2-1l-.7-1.8a1 1 0 00-.84-.62l-1.9-.3a1.5 1.5 0 010-3l1.9-.3a1 1 0 00.83-.62l.7-1.8a1 1 0 00-.2-1l-1.2-1.5a1.5 1.5 0 012.1-2.1l1.5 1.2a1 1 0 001 .2l1.8-.7a1 1 0 00.62-.84l.3-1.9z"/><circle cx="12" cy="12" r="3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.86 4.5a2.12 2.12 0 013 3L7.5 19.86 3 21l1.14-4.5L16.86 4.5z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M4 7h16"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M13.8 10.2a4.4 4.4 0 00-6.2-6.2l-3 3a4.4 4.4 0 006.2 6.2M10.2 13.8a4.4 4.4 0 006.2 6.2l3-3a4.4 4.4 0 00-6.2-6.2"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A8.5 8.5 0 1111.2 3a6.7 6.7 0 009.8 9.8z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 16v-4m0-4h.01"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="11" height="11" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    git: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19c-4.3 1.4-4.3-2.5-6-3 4 0 4 2.5 6 3zM9 19v-3a2 2 0 01.5-1.5M15 21v-3a2 2 0 00-.7-1.5L10.5 13"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4-4 4M21 12H9m-4 0H3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 2"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M20 9a8 8 0 00-14-4M4 15a8 8 0 0014 4"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5h6v6M20 5L10 15M10 5H5a1 1 0 00-1 1v13a1 1 0 001 1h13a1 1 0 001-1v-5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.3c-2-1.5-4.6-2-8-2V18c3.4 0 6 .5 8 2 2-1.5 4.6-2 8-2V4.3c-3.4 0-6 .5-8 2zM12 6.3V20"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="14" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M2 10h20M16 15h2"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  };

  /* -------- theme (dark-only, no light mode) -------- */
  function getTheme() {
    return 'dark';
  }
  function setTheme() {
    try { localStorage.removeItem(SubManga.KEYS.theme); } catch (e) {}
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeMeta();
  }
  function toggleTheme() {
    setTheme();
  }
  function updateThemeMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#0b1120');
  }

  /* -------- toasts -------- */
  function toast(msg, type = 'info') {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const ic = type === 'success' ? icons.check : type === 'error' ? icons.alert : icons.info;
    el.innerHTML = ic + '<span>' + msg + '</span>';
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => el.remove(), 320);
    }, 3200);
  }

  /* -------- copy to clipboard -------- */
  function copyText(text, label) {
    const done = (ok) => {
      if (ok) toast(label ? label + ' copied' : 'Copied to clipboard', 'success');
      else toast('Could not copy', 'error');
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { done(document.execCommand('copy')); } catch (e) { done(false); }
      ta.remove();
    }
  }

  /* -------- dom helpers -------- */
  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (m) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
    ));
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, html) {
    const node = document.createElement(tag);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  /* -------- reveal on scroll -------- */
  function initReveal() {
    $all('.reveal').forEach((n) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      io.observe(n);
    });
  }

  /* -------- modal helpers -------- */
  function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open'); }
  function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }

  /* -------- shared sidebar / topbar render (auth-aware) -------- */
  function renderShell(active) {
    const user = (window.Auth && Auth.current()) || null;
    const nav = [
      { id: 'dashboard', label: 'Dashboard', href: 'index.html', icon: 'home' },
      { id: 'subdomains', label: 'Subdomains', href: 'subdomains.html', icon: 'globe' },
      { id: 'dns', label: 'DNS & Deploy', href: 'dns.html', icon: 'dns' },
    ];
    if (user) {
      nav.push({ id: 'wallet', label: 'Wallet', href: 'funds.html', icon: 'wallet' });
      nav.push({ id: 'profile', label: 'Profile', href: 'profile.html', icon: 'user' });
    }
    nav.push({ id: 'settings', label: 'Settings', href: 'settings.html', icon: 'settings' });
    nav.push({ id: 'admin', label: 'Admin Panel', href: 'admin/admin.html', icon: 'spark', external: true });
    const sidebar = $('#sidebar');
    const navItems = nav.map((n) =>
      '<a class="nav-item' + (n.id === active ? ' active' : '') + '" href="' + n.href + '"' + (n.external ? ' target="_blank"' : '') + '>' +
        icons[n.icon] + '<span>' + n.label + '</span></a>'
    ).join('');

    let footer = '';
    if (user) {
      let display = user, credits = 0;
      try {
        if (window.Auth && Auth.profile) {
          const p = Auth.profile();
          if (p) { display = p.display; credits = p.credits; }
        }
      } catch (e) {}
      const initial = (display || 'U').trim().charAt(0).toUpperCase() || 'U';
      footer =
        '<div class="sidebar-footer">' +
          '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:12px;background:var(--muted)">' +
            '<div style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--brand-grad-2);color:#fff;font-weight:800;flex-shrink:0">' + esc(initial) + '</div>' +
            '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(display) + '</div>' +
            '<div style="font-size:11.5px;color:var(--c1);font-family:var(--font-code)">' + credits + ' credits</div></div>' +
          '</div>' +
          '<button class="nav-item" id="sideLogout" style="width:100%;background:none;border:none;text-align:left;cursor:pointer;margin-top:6px">' + icons.logout + '<span>Logout</span></button>' +
        '</div>';
    } else {
      footer =
        '<div class="sidebar-footer">' +
          '<a class="btn btn-primary btn-sm" href="login.html" style="width:100%;text-decoration:none">Login</a>' +
          '<a class="btn btn-ghost btn-sm" href="register.html" style="width:100%;text-decoration:none;margin-top:8px">Register</a>' +
        '</div>';
    }

    sidebar.innerHTML =
      '<div class="brand">' +
        '<div class="brand-logo">' + icons.logo + '</div>' +
        '<div><div class="brand-name">Sub<span>Manga</span></div>' +
        '<div class="brand-sub">' + App.esc(SubManga.getDomain()) + '</div></div>' +
      '</div>' +
      '<div class="nav-label">Main menu</div>' +
      navItems +
      footer;

    const lo = $('#sideLogout');
    if (lo && window.Auth) lo.addEventListener('click', () => Auth.logout());

    const hamburger = $('#hamburger');
    if (hamburger) {
      hamburger.innerHTML = icons.menu;
      /* backdrop: tap outside the drawer (right side) to close it */
      let backdrop = document.getElementById('sidebarBackdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebarBackdrop';
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', () => {
          sidebar.classList.remove('open');
          backdrop.classList.remove('show');
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            sidebar.classList.remove('open');
            backdrop.classList.remove('show');
          }
        });
      }
      const syncBackdrop = () => backdrop.classList.toggle('show', sidebar.classList.contains('open'));
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        syncBackdrop();
      });
      sidebar.addEventListener('click', (e) => {
        if (e.target.closest('a')) {
          sidebar.classList.remove('open');
          backdrop.classList.remove('show');
        }
      });
    }

    renderTopbarAuth();
  }

  /* balance pill (logged in) or login button (guest) in every topbar */
  function renderTopbarAuth() {
    if (!window.Auth) return;
    const bars = $all('.topbar-actions');
    if (!bars.length) return;
    const u = Auth.current();
    bars.forEach((bar) => {
      if (bar.querySelector('[data-auth-pill]')) return;
      const a = document.createElement('a');
      a.setAttribute('data-auth-pill', '1');
      a.style.textDecoration = 'none';
      if (u) {
        a.href = 'funds.html';
        a.className = 'btn btn-sm';
        a.id = 'walletPill';
        a.innerHTML = icons.wallet + '<span>' + Auth.credits() + ' credits</span>';
      } else {
        a.href = 'login.html';
        a.className = 'btn btn-sm btn-primary';
        a.textContent = 'Login';
      }
      bar.prepend(a);
    });
  }
  function refreshWalletPill() {
    if (!window.Auth) return;
    const pill = document.getElementById('walletPill');
    if (pill) pill.innerHTML = icons.wallet + '<span>' + Auth.credits() + ' credits</span>';
  }

  /* -------- init -------- */
  function init(active) {
    SubManga.ensureSeeded();
    document.documentElement.setAttribute('data-theme', getTheme());
    updateThemeMeta(getTheme());
    renderShell(active);
    /* fill any empty icon buttons (modal close etc.) */
    $all('.modal-close').forEach((b) => {
      if (!b.innerHTML.trim()) b.innerHTML = icons.x;
    });
    fitTopbarTitles();
    let rzT = null;
    window.addEventListener('resize', () => {
      clearTimeout(rzT);
      rzT = setTimeout(fitTopbarTitles, 150);
    });
    try {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitTopbarTitles());
    } catch (e) {}
  }

  /* shrink page titles to fit narrow screens: smaller text via CSS,
     plus shorten text itself ("Dashboard" -> "Dash…") as last resort */
  function fitTopbarTitles() {
    $all('.page-title h1').forEach((h1) => {
      if (h1.children.length) return;
      if (!h1.dataset.full) h1.dataset.full = h1.textContent.trim();
      const full = h1.dataset.full;
      h1.textContent = full;
      let text = full;
      let guard = 0;
      try {
        while (h1.scrollWidth > h1.clientWidth + 1 && text.length > 4 && guard++ < 24) {
          text = text.slice(0, -1);
          h1.textContent = text + '…';
        }
      } catch (e) {}
    });
  }

  return {
    icons, getTheme, setTheme, toggleTheme, toast, copyText,
    esc, $, $all, el, initReveal, openModal, closeModal, init,
    refreshWalletPill,
  };
})();
