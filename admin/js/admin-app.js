/* ============================================================
   SUBMANGA ADMIN - Core logic
   Icons · Theme · Toast · Auth · Data · Cloudflare · Layout
   Shares localStorage keys with the user panel.
   ============================================================ */

const AdminApp = (() => {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------- icons -------- */
  const icons = {
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" stroke="white" stroke-width="2.2"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16"/><path d="M7 4h.01M7 14h.01M7 9h.01M7 19h.01M17 6h.01M17 16h.01M17 11h.01" stroke-linecap="round" stroke-width="2.4"/></svg>',
    health: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    bulk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10.3 4.3a1.5 1.5 0 013 0l.3 1.9a1 1 0 00.62.83l1.8.7a1 1 0 001-.2l1.5-1.2a1.5 1.5 0 012.1 2.1l-1.2 1.5a1 1 0 00-.2 1l.7 1.8a1 1 0 00.84.62l1.9.3a1.5 1.5 0 010 3l-1.9.3a1 1 0 00-.83.62l-.7 1.8a1 1 0 00.2 1l1.2 1.5a1.5 1.5 0 01-2.1 2.1l-1.5-1.2a1 1 0 00-1-.2l-1.8.7a1 1 0 00-.62.84l-.3 1.9a1.5 1.5 0 01-3 0l-.3-1.9a1 1 0 00-.62-.83l-1.8-.7a1 1 0 00-1 .2l-1.5 1.2a1.5 1.5 0 01-2.1-2.1l1.2-1.5a1 1 0 00.2-1l-.7-1.8a1 1 0 00-.84-.62l-1.9-.3a1.5 1.5 0 010-3l1.9-.3a1 1 0 00.83-.62l.7-1.8a1 1 0 00-.2-1l-1.2-1.5a1.5 1.5 0 012.1-2.1l1.5 1.2a1 1 0 001 .2l1.8-.7a1 1 0 00.62-.84l.3-1.9z"/><circle cx="12" cy="12" r="3"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18M8 17V9m5 8V5m5 12v-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M3 12h18M12 3c2.5 2.7 4 5.6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-5.6-4-9s1.5-6.3 4-9z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 16v-4m0-4h.01"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.9 12.1A2 2 0 0116.1 21H7.9a2 2 0 01-2-1.9L5 7m5 4v6m4-6v6M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M4 7h16"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.86 4.5a2.12 2.12 0 013 3L7.5 19.86 3 21l1.14-4.5L16.86 4.5z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M20 9a8 8 0 00-14-4M4 15a8 8 0 0014 4"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A8.5 8.5 0 1111.2 3a6.7 6.7 0 009.8 9.8z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7l7 7 7-7"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 2"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M13.8 10.2a4.4 4.4 0 00-6.2-6.2l-3 3a4.4 4.4 0 006.2 6.2M10.2 13.8a4.4 4.4 0 006.2 6.2l3-3a4.4 4.4 0 00-6.2-6.2"/></svg>',
  };

  /* -------- DOM helpers -------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  /* -------- theme (dark-only, no light mode) -------- */
  function getTheme() { return 'dark'; }
  function setTheme() {
    try { localStorage.removeItem('submanga.admin.theme'); } catch (e) {}
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  function toggleTheme() { setTheme(); }

  /* -------- toast + prefs-aware notify -------- */
  function toast(msg, type) {
    type = type || 'info';
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    const ic = type === 'success' ? icons.check : type === 'error' ? icons.alert : icons.info;
    el.innerHTML = ic + '<span>' + msg + '</span>';
    wrap.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; setTimeout(() => el.remove(), 320); }, 3200);
  }
  function notify(msg, type) {
    var prefs = getPrefs();
    if (type === 'success' && !prefs.toastSuccess) return;
    if (type === 'error' && !prefs.toastError) return;
    toast(msg, type);
  }

  /* -------- auth: Firebase email+password, admin allowlist --------
     Only uids listed under `submanga/admins` may enter. First ever
     login claims admin (bootstrap); manage more via Users page. */
  const AUTH_KEY = 'submanga.admin.auth';
  const REMEMBER_KEY = 'submanga.admin.remember';
  const ADMINS_KEY = 'submanga.admins';

  function fb() {
    try { return (window.firebase && window.firebase.auth) ? window.firebase.auth() : null; }
    catch (e) { return null; }
  }
  function cacheAdmins(obj) {
    if (obj !== undefined) { try { localStorage.setItem(ADMINS_KEY, JSON.stringify(obj || {})); } catch (e) {} return obj; }
    try { return JSON.parse(localStorage.getItem(ADMINS_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  var _adminUser = null;
  function getAdminUser() { return _adminUser; }

  /* sync best-effort (login page redirect check) */
  function isLoggedIn() {
    try {
      const fa = fb();
      if (fa && fa.currentUser && fa.currentUser.uid) return true;
    } catch (e) {}
    try { return sessionStorage.getItem(AUTH_KEY) === '1' || localStorage.getItem(AUTH_KEY) === '1'; }
    catch (e) { return false; }
  }

  function waitForAuthUser(ms) {
    return new Promise((resolve) => {
      try {
        const fa = fb();
        if (!fa) return resolve(null);
        if (fa.currentUser && fa.currentUser.uid) return resolve(fa.currentUser);
        let done = false;
        const timer = setTimeout(() => { if (!done) { done = true; resolve(null); } }, ms || 3500);
        let unsub = null;
        try {
          unsub = fa.onAuthStateChanged((u) => {
            if (!done && u && u.uid) { done = true; clearTimeout(timer); try { if (unsub) unsub(); } catch (e) {} resolve(u); }
          });
        } catch (e) { if (!done) { done = true; clearTimeout(timer); resolve(null); } }
      } catch (e) { resolve(null); }
    });
  }

  async function checkAdmin(id) {
    if (!id) return false;
    let remote = null, reachable = false;
    try {
      if (window.FirebaseSync && FirebaseSync.ready) {
        reachable = true;
        remote = await FirebaseSync.dbGet('submanga/admins');
      }
    } catch (e) { reachable = false; }
    if (reachable) {
      if (remote && typeof remote === 'object' && Object.keys(remote).length) {
        cacheAdmins(remote);
        return remote[id] === true;
      }
      /* first run (or emptied): only an allowed uid can claim —
         DB rules reject everyone else, so verify the write */
      let wrote = false;
      try { wrote = await FirebaseSync.dbSet('submanga/admins/' + id, true); } catch (e) { wrote = false; }
      if (!wrote) return false;
      try {
        const verify = await FirebaseSync.dbGet('submanga/admins/' + id);
        if (verify !== true) return false;
      } catch (e) { return false; }
      cacheAdmins(Object.assign(cacheAdmins(), { [id]: true }));
      try { logActivity('settings', 'First admin claimed'); } catch (e) {}
      return true;
    }
    /* unreachable (offline/tests): local mirror decides; fresh mirror = first claim */
    const local = cacheAdmins();
    if (!Object.keys(local).length) {
      local[id] = true;
      cacheAdmins(local);
      return true;
    }
    return local[id] === true;
  }

  /* page boot gate — resolves admin user or null */
  async function requireAdmin() {
    try {
      const fa = fb();
      const already = fa && fa.currentUser && fa.currentUser.uid ? fa.currentUser : null;
      const fu = already || await waitForAuthUser(3500);
      if (fu && fu.uid) {
        const ok = await checkAdmin(fu.uid);
        if (ok) {
          _adminUser = { uid: fu.uid, email: fu.email || '' };
          return _adminUser;
        }
        try { await fa.signOut(); } catch (e) {}
        return null;
      }
    } catch (e) {}
    /* offline fallback: remembered/local session flag */
    try {
      if (localStorage.getItem(AUTH_KEY) === '1' || sessionStorage.getItem(AUTH_KEY) === '1') {
        _adminUser = { uid: 'local', email: '' };
        return _adminUser;
      }
    } catch (e) {}
    return null;
  }

  /* wait a little for the SDK if it is still loading (slow network) */
  function waitForFbAuth(ms) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      (function poll() {
        try {
          if (fb()) return resolve(true);
        } catch (e) {}
        if (Date.now() - t0 > (ms || 4000)) return resolve(false);
        setTimeout(poll, 200);
      })();
    });
  }

  async function login(identifier, pass, remember) {
    identifier = (identifier || '').trim();
    let em = identifier.toLowerCase();
    if (em.indexOf('@') === -1) {
      /* username login (same as user panel) — resolve email via shared store */
      if (!/^[a-z0-9_]{3,16}$/.test(em)) return { ok: false, error: 'Enter a correct username or email.' };
      if (!window.Auth) return { ok: false, error: 'Auth service failed to load. Check your internet and reload.' };
      try {
        const id = await Auth.uidForUsername(em);
        if (!id) return { ok: false, error: 'Account not found.' };
        const acc = await Auth.getAccount(id);
        if (!acc || !acc.email) return { ok: false, error: 'Account not found.' };
        em = String(acc.email).toLowerCase();
      } catch (e) {
        return { ok: false, error: 'Account lookup failed. Check your internet.' };
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      return { ok: false, error: 'Enter a valid email.' };
    }
    let fa = fb();
    if (!fa && !(await waitForFbAuth(4000))) {
      try {
        if (window.FirebaseSync && FirebaseSync.authLoadError) return { ok: false, error: FirebaseSync.authLoadError() };
      } catch (e) {}
      return { ok: false, error: 'Auth service failed to load. Check your internet and reload.' };
    }
    if (!fa) fa = fb();
    let cred;
    try {
      cred = await fa.signInWithEmailAndPassword(em, pass || '');
    } catch (e) {
      const code = (e && e.code) || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') return { ok: false, error: 'Wrong email or password.' };
      if (code === 'auth/invalid-email') return { ok: false, error: 'Enter a valid email.' };
      if (code === 'auth/operation-not-allowed') return { ok: false, error: 'Enable Email/Password sign-in in the Firebase console.' };
      if (code === 'auth/network-request-failed') return { ok: false, error: 'Check your internet and try again.' };
      return { ok: false, error: 'Login failed.' + (code ? ' (' + code + ')' : '') };
    }
    const id = cred.user.uid;
    const allowed = await checkAdmin(id);
    if (!allowed) {
      try { await fa.signOut(); } catch (e) {}
      return { ok: false, error: 'This account is not an admin.' };
    }
    _adminUser = { uid: id, email: (cred.user && cred.user.email) || em };
    try {
      sessionStorage.setItem(AUTH_KEY, '1');
      if (remember) {
        localStorage.setItem(AUTH_KEY, '1');
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: _adminUser.email }));
      } else {
        localStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {}
    return { ok: true };
  }
  function logout() {
    _adminUser = null;
    try {
      const fa = fb();
      if (fa && fa.signOut) fa.signOut().catch(() => {});
    } catch (e) {}
    try { sessionStorage.removeItem(AUTH_KEY); localStorage.removeItem(AUTH_KEY); } catch (e) {}
    window.location.href = 'admin-login.html';
  }
  function rememberedUser() {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return '';
      const o = JSON.parse(raw);
      return (o && o.email) || '';
    } catch (e) { return ''; }
  }
  /* admin allowlist management (used by Users page) */
  async function getAdmins() {
    try {
      if (window.FirebaseSync && FirebaseSync.ready) {
        const remote = await FirebaseSync.dbGet('submanga/admins');
        if (remote && typeof remote === 'object') { cacheAdmins(remote); return remote; }
      }
    } catch (e) {}
    return cacheAdmins();
  }
  async function setAdmin(id, on) {
    id = (id || '').trim();
    if (!id) return { ok: false };
    const local = cacheAdmins();
    if (on) local[id] = true; else delete local[id];
    cacheAdmins(local);
    try {
      if (window.FirebaseSync && FirebaseSync.ready) {
        await FirebaseSync.dbSet('submanga/admins/' + id, on ? true : null);
      }
    } catch (e) {}
    return { ok: true };
  }

  /* -------- read/write -------- */
  function ls(key, fallback) { try { var raw = localStorage.getItem(key); if (raw === null) return fallback; var val = JSON.parse(raw); return (val === null || val === undefined) ? fallback : val; } catch (e) { return fallback; } }
  function ws(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  /* -------- data layer (same keys as user panel) -------- */
  var KEYS = { subs: 'submanga.subdomains', settings: 'submanga.settings', theme: 'submanga.theme' };
  var PREFS_KEY = 'submanga.admin.prefs';
  var UCTL_KEY = 'submanga.usercontrol';

  function getSettings() { return Object.assign({ domain: 'princehacks.online', ownerName: '', defaultDesc: '' }, ls(KEYS.settings, {})); }
  function saveSettings(s) {
    ws(KEYS.settings, Object.assign({}, getSettings(), s));
    logActivity('settings', 'Settings updated: ' + Object.keys(s).join(', '));
  }
  function getDomain() { return (getSettings().domain || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, ''); }
  function getSubdomains() { return ls(KEYS.subs, []); }

  /* seed on first run — same seeds as user panel so both stay consistent */
  function ensureSeeded() {
    var justSeededSubs = false;
    try {
      if (localStorage.getItem(KEYS.subs) === null) {
        var now = Date.now();
        ws(KEYS.subs, [
          { id: 'seed-1', name: 'blog', project: 'My Blog', repo: 'myorg/blog', status: 'live', desc: 'Personal blog with notes and updates', createdAt: now - 86400000 * 30 },
          { id: 'seed-2', name: 'shop', project: 'Online Store', repo: 'myorg/shop', status: 'live', desc: 'E-commerce storefront', createdAt: now - 86400000 * 20 },
          { id: 'seed-3', name: 'portfolio', project: 'Portfolio', repo: 'myorg/portfolio', status: 'pending', desc: 'Personal portfolio website', createdAt: now - 86400000 * 6 },
          { id: 'seed-4', name: 'tools', project: 'Utility Tools', repo: 'myorg/tools', status: 'draft', desc: 'Collection of small web tools', createdAt: now - 86400000 * 2 },
        ]);
        justSeededSubs = true;
      }
      if (localStorage.getItem(KEYS.settings) === null) {
        ws(KEYS.settings, { domain: 'princehacks.online', ownerName: '', defaultDesc: '' });
      }
      /* backfill: old users have subdomains but never got log entries
         (logging started later) — one honest system entry wakes the widget */
      if (!justSeededSubs) {
        var existingLog = ls(LOG_KEY, []);
        var existingSubs = getSubdomains();
        if (!existingLog.length && existingSubs.length) {
          logActivity('settings', existingSubs.length + ' existing subdomains — activity tracking started');
        }
      }
    } catch (e) { /* ignore */ }
  }
  function addSubdomain(data) {
    var list = getSubdomains();
    var item = { id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name: data.name.trim().toLowerCase(), project: (data.project || '').trim(), repo: (data.repo || '').trim(), status: data.status || 'draft', desc: (data.desc || '').trim(), createdAt: Date.now() };
    list.push(item); ws(KEYS.subs, list); logActivity('add', 'Added: ' + item.name + '.' + getDomain());
    return item;
  }
  function updateSubdomain(id, patch) {
    var list = getSubdomains().map(function (s) { return s.id === id ? Object.assign({}, s, patch) : s; });
    ws(KEYS.subs, list); logActivity('update', 'Updated: ' + id);
  }
  function deleteSubdomain(id) {
    var sub = getSubdomains().find(function (s) { return s.id === id; });
    var list = getSubdomains().filter(function (s) { return s.id !== id; });
    ws(KEYS.subs, list); logActivity('delete', 'Deleted: ' + (sub ? sub.name : id));
  }
  function findSubdomain(name) { var n = name.trim().toLowerCase(); return getSubdomains().find(function (s) { return s.name === n; }); }

  /* -------- admin prefs + user-panel control flags -------- */
  function getPrefs() { return Object.assign({ toastSuccess: true, toastError: true, autoRefresh: false }, ls(PREFS_KEY, {})); }
  function savePrefs(p) { ws(PREFS_KEY, Object.assign({}, getPrefs(), p)); }
  function getUserControl() { return Object.assign({ allowCreate: true, showHealth: true }, ls(UCTL_KEY, {})); }
  function saveUserControl(u) {
    ws(UCTL_KEY, Object.assign({}, getUserControl(), u));
    logActivity('settings', 'User panel control updated');
  }

  /* -------- activity log -------- */
  var LOG_KEY = 'submanga.activity_log';
  function logActivity(action, detail) {
    var list = ls(LOG_KEY, []);
    list.unshift({ id: 'l' + Date.now().toString(36), action: action, detail: detail || '', time: Date.now() });
    if (list.length > 200) list.length = 200;
    ws(LOG_KEY, list);
  }
  function getActivityLog() { return ls(LOG_KEY, []); }
  function clearActivityLog() { ws(LOG_KEY, []); }

  /* -------- Cloudflare -------- */
  var _workerUrl = '', _zoneId = '';
  function cfLoad() { _workerUrl = localStorage.getItem('cf_worker') || ''; _zoneId = localStorage.getItem('cf_zone') || ''; return { workerUrl: _workerUrl, zoneId: _zoneId }; }
  function cfConfigure(workerUrl, zoneId) { _workerUrl = workerUrl; _zoneId = zoneId; localStorage.setItem('cf_worker', workerUrl); localStorage.setItem('cf_zone', zoneId); }
  function cfReset() { _workerUrl = ''; _zoneId = ''; localStorage.removeItem('cf_worker'); localStorage.removeItem('cf_zone'); }
  function cfConfigured() { return !!_workerUrl && !!_zoneId; }

  async function cfApiCall(path) {
    if (!_workerUrl) throw new Error('Worker URL not configured');
    var r = await fetch(_workerUrl + '?path=' + encodeURIComponent(path) + '&zoneId=' + _zoneId);
    return await r.json();
  }
  async function cfCreateRecord(opts) {
    var body = JSON.stringify({ type: opts.type || 'CNAME', name: opts.name + '.' + getDomain(), content: opts.content, ttl: opts.ttl || 1, proxied: opts.proxied !== undefined ? opts.proxied : true });
    var r = await fetch(_workerUrl + '?path=' + encodeURIComponent('/zones/' + _zoneId + '/dns_records') + '&zoneId=' + _zoneId, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body });
    var data = await r.json();
    return { success: data.success, errors: data.errors || [], result: data.result };
  }
  async function cfGetRecords() {
    var data = await cfApiCall('/zones/' + _zoneId + '/dns_records?per_page=100');
    return { ok: data.success, records: data.result || [] };
  }
  async function cfDeleteRecord(recordId) {
    var r = await fetch(_workerUrl + '?path=' + encodeURIComponent('/zones/' + _zoneId + '/dns_records/' + recordId) + '&zoneId=' + _zoneId, { method: 'DELETE' });
    var data = await r.json();
    return { success: data.success };
  }
  async function cfTestConnection() {
    var data = await cfApiCall('/user/tokens/verify');
    return { ok: data.success, status: data.result ? data.result.status : 'unknown' };
  }

  /* -------- helpers -------- */
  function timeAgo(ts) {
    var sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'abhi';
    var m = Math.floor(sec / 60); if (m < 60) return m + 'm ago';
    var hh = Math.floor(m / 60); if (hh < 24) return hh + 'h ago';
    var d = Math.floor(hh / 24); return d + 'd ago';
  }
  function statusBadge(status) {
    var map = { live: 'success', pending: 'warning', draft: 'neutral' };
    return '<span class="badge ' + (map[status] || 'neutral') + '"><span class="dot"></span>' + status + '</span>';
  }
  function formatNumber(n) { return Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function formatDate(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function animateCounter(el, target, dur) {
    if (!el) return;
    dur = dur || 1200;
    if (reduceMotion) { el.textContent = formatNumber(target); return; }
    var start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNumber(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatNumber(target);
    }
    requestAnimationFrame(step);
  }
  function getAnalytics() {
    var subs = getSubdomains();
    var log = getActivityLog();
    var total = subs.length;
    var live = subs.filter(function (s) { return s.status === 'live'; }).length;
    var pending = subs.filter(function (s) { return s.status === 'pending'; }).length;
    var drafts = subs.filter(function (s) { return s.status === 'draft'; }).length;
    var totalActions = log.length;
    var actionsByType = {};
    log.forEach(function (l) { actionsByType[l.action] = (actionsByType[l.action] || 0) + 1; });
    var thirtyDaysAgo = Date.now() - 30 * 86400000;
    var dailyGrowth = {};
    subs.forEach(function (s) {
      if (s.createdAt >= thirtyDaysAgo) {
        var day = new Date(s.createdAt).toISOString().slice(0, 10);
        dailyGrowth[day] = (dailyGrowth[day] || 0) + 1;
      }
    });
    var sevenDaysAgo = Date.now() - 7 * 86400000;
    var activityByDay = {};
    log.forEach(function (l) {
      if (l.time >= sevenDaysAgo) {
        var d2 = new Date(l.time).toISOString().slice(0, 10);
        activityByDay[d2] = (activityByDay[d2] || 0) + 1;
      }
    });
    var subActivity = {};
    log.forEach(function (l) {
      subs.forEach(function (s) {
        if ((l.detail || '').indexOf(s.name) !== -1) { subActivity[s.name] = (subActivity[s.name] || 0) + 1; }
      });
    });
    var mostActive = Object.keys(subActivity).map(function (name) { return { name: name, count: subActivity[name] }; });
    mostActive.sort(function (a, b) { return b.count - a.count; });
    mostActive = mostActive.slice(0, 5);
    var firstActivity = log.length ? log[log.length - 1].time : null;
    var lastActivity = log.length ? log[0].time : null;
    var avgActions = totalActions > 0 ? (totalActions / 7).toFixed(1) : '0';
    return {
      total: total, live: live, pending: pending, drafts: drafts,
      totalActions: totalActions, actionsByType: actionsByType,
      growthDays: Object.keys(dailyGrowth).length, dailyGrowth: dailyGrowth, activityByDay: activityByDay,
      mostActive: mostActive, firstActivity: firstActivity, lastActivity: lastActivity,
      avgActions: avgActions, storageKB: Math.round(JSON.stringify(localStorage).length / 1024),
      subdomains: subs,
    };
  }
  function exportCSV(filename, rows) {
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  /* -------- shared layout: sidebar + topbar -------- */
  var NAV = [
    { section: 'Management' },
    { id: 'dashboard', label: 'Dashboard', href: 'admin.html', icon: 'dashboard' },
    { id: 'subdomains', label: 'Subdomains', href: 'subdomains.html', icon: 'globe' },
    { id: 'zone', label: 'Cloudflare Zone', href: 'zone.html', icon: 'list' },
    { id: 'health', label: 'Health Check', href: 'health.html', icon: 'health' },
    { id: 'bulk', label: 'Bulk Operations', href: 'bulk.html', icon: 'bulk' },
    { id: 'users', label: 'Users', href: 'users.html', icon: 'user' },
    { section: 'Analytics' },
    { id: 'analytics', label: 'Analytics', href: 'analytics.html', icon: 'chart' },
    { id: 'activity', label: 'Activity Log', href: 'activity.html', icon: 'log' },
    { section: 'Config' },
    { id: 'cfconfig', label: 'Cloudflare Config', href: 'cfconfig.html', icon: 'settings' },
    { id: 'settings', label: 'System Settings', href: 'settings.html', icon: 'sliders' },
  ];

  function renderLayout(active, title, desc) {
    document.documentElement.setAttribute('data-theme', getTheme());
    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
      var html = '<div class="brand"><div class="brand-logo">' + icons.logo + '</div>' +
        '<div><div class="brand-name">Sub<em>Manga</em></div><div class="brand-sub">Admin Panel</div></div></div>' +
        '<div class="admin-badge" style="margin:0 10px 14px">' + icons.lock + '<span>Administrator</span></div>';
      NAV.forEach(function (n) {
        if (n.section) { html += '<div class="nav-label">' + n.section + '</div>'; return; }
        html += '<a class="nav-item' + (n.id === active ? ' active' : '') + '" href="' + n.href + '">' + icons[n.icon] + '<span>' + n.label + '</span></a>';
      });
      html += '<a class="nav-item" href="../index.html">' + icons.link + '<span>User Panel</span></a>';
      html += '<div class="sidebar-footer">' +
        '<button class="nav-item" id="logoutBtn" style="width:100%;background:none;border:none;text-align:left;cursor:pointer">' + icons.logout + '<span>Logout</span></button></div>';
      sidebar.innerHTML = html;
      var lo = document.getElementById('logoutBtn');
      if (lo) lo.addEventListener('click', logout);
      sidebar.addEventListener('click', function (e) {
        if (e.target.closest('a')) sidebar.classList.remove('open');
      });
    }
    var topbar = document.getElementById('topbar');
    if (topbar) {
      topbar.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;min-width:0">' +
          '<button id="hamburger" class="icon-btn hamburger" aria-label="Menu">' + icons.menu + '</button>' +
          '<div class="page-title"><h1 id="pageTitle">' + esc(title || 'Admin') + '</h1><p id="pageDesc">' + esc(desc || '') + '</p></div>' +
        '</div>' +
        '<div class="topbar-actions">' +
          '<button class="btn btn-primary btn-sm" id="refreshAll">' + icons.refresh + '<span>Refresh</span></button>' +
        '</div>';
      var ham = document.getElementById('hamburger');
      if (ham && sidebar) ham.addEventListener('click', function () { sidebar.classList.toggle('open'); });
    }
  }

  return {
    icons, esc, $, $all, getTheme, setTheme, toggleTheme, toast, notify,
    isLoggedIn, login, logout, rememberedUser, requireAdmin, getAdminUser,
    getAdmins, setAdmin, getSettings, saveSettings, getDomain,
    getSubdomains, addSubdomain, updateSubdomain, deleteSubdomain, findSubdomain, ensureSeeded,
    getPrefs, savePrefs, getUserControl, saveUserControl,
    logActivity, getActivityLog, clearActivityLog,
    cfLoad, cfConfigure, cfReset, cfConfigured, cfCreateRecord, cfGetRecords, cfDeleteRecord, cfTestConnection,
    timeAgo, statusBadge, formatNumber, formatDate, animateCounter, getAnalytics, exportCSV,
    renderLayout, NAV, KEYS,
  };
})();
