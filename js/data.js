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
    domain: 'prince.com',
    ownerName: '',
    defaultDesc: '',
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
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
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

  /* -------- subdomains -------- */
  function getSubdomains() {
    // If Firebase has delivered a real cloud list, use it as the source
    // of truth (works across devices). Otherwise fall back to localStorage.
    if (Array.isArray(cloudList)) return cloudList;
    return read(KEYS.subs, []);
  }
  function saveSubdomains(list) {
    write(KEYS.subs, list);
    if (Sync) {
      cloudList = list;
      Sync.saveSubdomains(list);
    }
  }
  function addSubdomain(data) {
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
    return item;
  }
  function updateSubdomain(id, patch) {
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
    return found;
  }
  function deleteSubdomain(id) {
    const list = getSubdomains().filter((s) => s.id !== id);
    saveSubdomains(list);
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
    // Seed localStorage WITHOUT pushing to cloud yet — the cloud sync below
    // decides truth, so we never clobber existing cloud data with seeds.
    if (localStorage.getItem(KEYS.subs) === null) {
      write(KEYS.subs, SEED_SUBDOMAINS);
    }
    if (localStorage.getItem(KEYS.settings) === null) {
      write(KEYS.settings, DEFAULT_SETTINGS);
    }

    // ---- Cloud sync (non-blocking) ----
    if (!Sync) return;
    Sync.onChange(() => {
      // A real snapshot has arrived from Firebase -> remote is authoritative.
      const remote = Sync.load();
      const remoteSettings = Sync.loadSettings();
      if (Sync.hasValue) {
        if (Array.isArray(remote) && remote.length) {
          // cloud has data -> use it as truth (works across devices)
          cloudList = remote;
          write(KEYS.subs, remote);
        } else {
          // cloud exists but empty/absent -> push our local data up so that
          // every device ends up with the same state
          Sync.saveSubdomains(read(KEYS.subs, []));
        }
      }
      if (remoteSettings && remoteSettings.domain) {
        write(KEYS.settings, Object.assign({}, getSettings(), remoteSettings));
      }
    });
    // Once connected (even before first snapshot) we do nothing; the
    // onChange handles reconciliation as soon as the snapshot arrives.
    Sync.ready(() => {});
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
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data && data.app === 'submanga' && Array.isArray(data.subdomains)) {
          write(KEYS.subs, data.subdomains);
          if (data.settings) saveSettings(data.settings);
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

  return {
    KEYS,
    getSettings,
    saveSettings,
    getDomain,
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
  };
})();
