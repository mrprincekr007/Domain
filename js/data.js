/* ============================================================
   SUBMANGA - data layer (localStorage)
   ============================================================ */

const SubManga = (() => {
  const KEYS = {
    subs: 'submanga.subdomains',
    settings: 'submanga.settings',
    theme: 'submanga.theme',
  };

  // Firebase sync — optional. If loaded, mirrors data to the cloud so it
  // works across devices. The app never depends on it: localStorage remains
  // the instant, always-working source.
  const Sync = window.FirebaseSync || null;
  let cloudList = null; // list coming from Firebase (null = none yet)

  const STORAGE_VERSION = 1;

  const DEFAULT_SETTINGS = {
    domain: 'princehacks.online',
    ownerName: '',
    defaultDesc: '',
    price: 10,
    signupBonus: 20,
    storageVersion: STORAGE_VERSION,
  };

  const SEED_SUBDOMAINS = [
    {
      id: 'seed-1',
      name: 'blog',
      project: 'My Blog',
      repo: 'myorg/blog',
      status: 'live',
      desc: 'Personal blog with notes and updates',
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: 'seed-2',
      name: 'shop',
      project: 'Online Store',
      repo: 'myorg/shop',
      status: 'live',
      desc: 'E-commerce storefront',
      createdAt: Date.now() - 86400000 * 20,
    },
    {
      id: 'seed-3',
      name: 'portfolio',
      project: 'Portfolio',
      repo: 'myorg/portfolio',
      status: 'pending',
      desc: 'Personal portfolio website',
      createdAt: Date.now() - 86400000 * 6,
    },
    {
      id: 'seed-4',
      name: 'tools',
      project: 'Utility Tools',
      repo: 'myorg/tools',
      status: 'draft',
      desc: 'Collection of small web tools',
      createdAt: Date.now() - 86400000 * 2,
    },
  ];

  /* -------- generic read/write -------- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const val = JSON.parse(raw);
      return val === null || val === undefined ? fallback : val;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* -------- per-user storage (multi-tenant: har user ka alag data) -------- */
  function currentUser() {
    try { return (window.Auth && Auth.current()) || null; } catch (e) { return null; }
  }
  /* data scope = Firebase uid (stable even if username/display changes) */
  function scopeUid() {
    try { return (window.Auth && Auth.uid()) || null; } catch (e) { return null; }
  }
  function userKey(suffix) {
    const id = scopeUid();
    return id ? 'submanga.user.' + id + '.' + suffix : null;
  }
  /* one-time: give legacy shared data to the first registered user */
  function migrateLegacyTo(id) {
    try {
      if (localStorage.getItem('submanga.migrated') === '1') return false;
      const legacy = read(KEYS.subs, []);
      if (legacy.length) write('submanga.user.' + id + '.subdomains', legacy);
      try { localStorage.removeItem(KEYS.subs); } catch (e) {}
      try { localStorage.setItem('submanga.migrated', '1'); } catch (e) {}
      return legacy.length > 0;
    } catch (e) { return false; }
  }

  /* -------- settings -------- */
  function getSettings() {
    const s = Object.assign({}, DEFAULT_SETTINGS, read(KEYS.settings, {}));
    return s;
  }
  function saveSettings(s) {
    s.storageVersion = STORAGE_VERSION;
    write(KEYS.settings, s);
    if (Sync) Sync.saveSettings(s);
  }

  /* -------- domain name -------- */
  function getDomain() {
    return (getSettings().domain || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }

  /* -------- price per subdomain (admin sets it) -------- */
  function getPrice() {
    const p = parseInt(getSettings().price, 10);
    return isNaN(p) || p < 0 ? 10 : p;
  }

  /* -------- subdomains (per-user) -------- */
  function getSubdomains() {
    const k = userKey('subdomains');
    if (!k) return [];
    // If Firebase has delivered this user's cloud list, use it as truth.
    if (Array.isArray(cloudList)) return cloudList;
    return read(k, []);
  }
  function saveSubdomains(list) {
    const k = userKey('subdomains');
    if (!k) return;
    write(k, list);
    if (Sync) {
      cloudList = list;
      Sync.saveSubdomains(list);
    }
  }
  function addSubdomain(data) {
    if (!currentUser()) return null;
    const list = getSubdomains();
    const item = {
      id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: data.name.trim().toLowerCase(),
      project: (data.project || '').trim(),
      repo: (data.repo || '').trim().replace(/^https?:\/\/(www\.)?github\.com\//i, ''),
      status: data.status || 'draft',
      desc: (data.desc || '').trim(),
      createdAt: Date.now(),
    };
    list.push(item);
    saveSubdomains(list);
    logActivity('add', 'Added subdomain: ' + item.name + '.' + getDomain());
    return item;
  }
  function updateSubdomain(id, patch) {
    if (!currentUser()) return null;
    let list = getSubdomains();
    let found = null;
    list = list.map((s) => {
      if (s.id === id) {
        found = Object.assign({}, s, patch);
        if (found.name) found.name = found.name.trim().toLowerCase();
        if (found.repo) found.repo = found.repo.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
        return found;
      }
      return s;
    });
    saveSubdomains(list);
    logActivity('update', 'Updated subdomain: ' + (found ? found.name : id));
    return found;
  }
  function deleteSubdomain(id) {
    if (!currentUser()) return;
    const sub = getSubdomains().find((s) => s.id === id);
    const list = getSubdomains().filter((s) => s.id !== id);
    saveSubdomains(list);
    logActivity('delete', 'Deleted subdomain: ' + (sub ? sub.name : id));
  }
  function findSubdomain(name) {
    const n = name.trim().toLowerCase();
    return getSubdomains().find((s) => s.name === n);
  }
  function fullUrl(name) {
    const d = getDomain();
    return name ? name + '.' + d : d;
  }

  /* -------- seed on first run -------- */
  function ensureSeeded() {
    // Global settings (domain/price) seed once — shared for all users.
    if (localStorage.getItem(KEYS.settings) === null) {
      write(KEYS.settings, DEFAULT_SETTINGS);
    }
    // Legacy shared subdomain key: never seed it anymore (fresh users
    // start empty in their own namespace; migration handled at register).
    const u = scopeUid();
    if (!u || !Sync) return;

    // ---- Cloud sync (non-blocking, per-user scope set by Auth.init) ----
    Sync.onChange(() => {
      const k = userKey('subdomains');
      if (!k) return;
      const remote = Sync.load();
      if (Sync.hasValue) {
        if (Array.isArray(remote) && remote.length) {
          cloudList = remote;
          write(k, remote);
        } else {
          Sync.saveSubdomains(read(k, []));
        }
      }
    });
    // Global settings (domain/price set by admin anywhere) — merge once.
    if (Sync.dbGet) {
      Sync.dbGet('submanga/settings').then((rs) => {
        if (rs && rs.domain) write(KEYS.settings, Object.assign({}, getSettings(), rs));
      }).catch(() => {});
    }
    Sync.onReady(() => {});
  }

  /* -------- export / import -------- */
  function exportData() {
    const payload = {
      app: 'submanga',
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      settings: getSettings(),
      subdomains: getSubdomains(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'submanga-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  function importData(file, callback) {
    const k = userKey('subdomains');
    if (!k) { callback({ ok: false, error: 'Please login first.' }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data && data.app === 'submanga' && Array.isArray(data.subdomains)) {
          write(k, data.subdomains);
          if (Sync) { cloudList = data.subdomains; Sync.saveSubdomains(data.subdomains); }
          callback({ ok: true });
        } else {
          callback({ ok: false, error: 'Invalid backup file format.' });
        }
      } catch (e) {
        callback({ ok: false, error: 'Could not parse file.' });
      }
    };
    reader.readAsText(file);
  }

  /* -------- DNS & GitHub helpers -------- */
  function githubPagesRecords() {
    return ['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'];
  }

  function dnsTxtRecord(domain) {
    const d = getDomain();
    return {
      host: '_github-pages-challenge-' + (domain.username || '__youruser__') + '.' + (d === '' ? '__domain__' : d),
    };
  }

  /* -------- activity log (per-user) -------- */
  const LOG_SUFFIX = 'activity_log';
  const MAX_LOG = 200;

  function logActivity(action, detail) {
    const k = userKey(LOG_SUFFIX);
    if (!k) return;
    const entry = {
      id: 'log' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      action: action,
      detail: detail || '',
      time: Date.now(),
    };
    const list = read(k, []);
    list.unshift(entry);
    if (list.length > MAX_LOG) list.length = MAX_LOG;
    write(k, list);
    /* mirror to global log so admin sees every user's activity */
    try {
      const g = read('submanga.activity_log', []);
      g.unshift({ id: entry.id, action: action, detail: '@' + currentUser() + ' ' + detail, time: entry.time });
      if (g.length > MAX_LOG) g.length = MAX_LOG;
      write('submanga.activity_log', g);
    } catch (e) {}
  }
  function getActivityLog() {
    const k = userKey(LOG_SUFFIX);
    return k ? read(k, []) : [];
  }
  function clearActivityLog() {
    const k = userKey(LOG_SUFFIX);
    if (k) write(k, []);
  }

  return {
    KEYS,
    getSettings,
    saveSettings,
    getDomain,
    getPrice,
    migrateLegacyTo,
    getSubdomains,
    saveSubdomains,
    addSubdomain,
    updateSubdomain,
    deleteSubdomain,
    findSubdomain,
    fullUrl,
    ensureSeeded,
    exportData,
    importData,
    githubPagesRecords,
    logActivity,
    getActivityLog,
    clearActivityLog,
  };
})();

// expose as window property (auth.js guards on window.SubManga)
window.SubManga = SubManga;
