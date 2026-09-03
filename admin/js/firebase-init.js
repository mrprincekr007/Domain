/* ============================================================
   SUBMANGA ADMIN - Firebase init (CDN, no build step)
   SELF-CONTAINED COPY of ../../js/firebase-init.js — keep both
   files identical when changing Firebase logic. (Admin folder is
   deployable as its own website / repo.)
   Uses Firebase Realtime Database (matches the project databaseURL).
   Loaded as a plain <script> before admin-app.js.
   Exposes window.FirebaseSync with a minimal, non-blocking API so the
   app keeps working instantly from localStorage even while Firebase
   connects/syncs in the background.
   ============================================================ */

(function () {
  'use strict';

  const CONFIG = {
    apiKey: "AIzaSyD-gYBFLbbBMy3wac6L6woR-aclsNSWEsw",
    authDomain: "testing-233c1.firebaseapp.com",
    databaseURL: "https://testing-233c1-default-rtdb.firebaseio.com",
    projectId: "testing-233c1",
    storageBucket: "testing-233c1.firebasestorage.app",
    messagingSenderId: "119697068614",
    appId: "1:119697068614:web:efd1045499924f457fb047",
    measurementId: "G-X4GQ0J7QY8",
  };

  // Local in-memory cache. Keeps the sync layer usable even if Firebase
  // SDK fails to load (offline / blocked network). The app never crashes
  // because of Firebase.
  let rtdb = null;            // database ref helper
  let onReady = null;         // current ready callback
  let readyCalled = false;
  const listeners = [];       // change listeners
  let scopeUser = null;       // logged-in username or null (global scope)
  let currentRef = null;      // active RTDB listener ref

  function basePath() { return scopeUser ? 'submanga/users/' + scopeUser : 'submanga'; }
  function attach() {
    if (!rtdb) return;
    try {
      if (currentRef) currentRef.off();
      hasValue = false;
      currentRef = rtdb.ref(basePath() + '/');
      currentRef.on('value', (snap) => {
        hasValue = true;
        cache = snap.val() || {};
        emit();
      });
    } catch (e) { /* ignore */ }
  }

  function emit() {
    listeners.forEach((fn) => {
      try { fn(); } catch (e) {}
    });
  }

  /* per-library load status: null = loading, true/false = settled (diagnostics) */
  const sdkStatus = { app: null, database: null, auth: null, analytics: null };
  window.FirebaseSDKStatus = sdkStatus;

  function loadScript(src, ms) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      try {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => finish(true);
        s.onerror = () => finish(false);
        document.head.appendChild(s);
        setTimeout(() => finish(false), ms || 12000);
      } catch (e) { finish(false); }
    });
  }

  function loadSDK(cb) {
    // App core first (others register onto it), then the rest in parallel.
    // Each lib tries gstatic first, then jsdelivr fallback (CDN-specific blocks).
    const g = 'https://www.gstatic.com/firebasejs/';
    const j = 'https://cdn.jsdelivr.net/npm/firebase@10.7.1/';
    const rest = [
      { key: 'database', file: 'firebase-database-compat.js' },
      { key: 'auth', file: 'firebase-auth-compat.js' },
      { key: 'analytics', file: 'firebase-analytics-compat.js' },
    ];
    async function loadOne(lib) {
      if (await loadScript(g + lib.file)) { sdkStatus[lib.key] = true; return; }
      if (await loadScript(j + lib.file)) { sdkStatus[lib.key] = true; return; }
      sdkStatus[lib.key] = false;
    }
    (async () => {
      if (await loadScript(g + 'firebase-app-compat.js')) sdkStatus.app = true;
      else if (await loadScript(j + 'firebase-app-compat.js')) sdkStatus.app = true;
      if (sdkStatus.app) await Promise.all(rest.map(loadOne));
      try { cb(); } catch (e) {}
    })();
  }

  function doInit() {
    try {
      if (!window.firebase) {
        // SDK not available
        return;
      }
      let app = null;
      try { app = window.firebase.initializeApp(CONFIG); }
      catch (e) {
        try { app = (window.firebase.apps && window.firebase.apps[0]) || null; } catch (e2) { app = null; }
        if (!app) return;
      }
      try { rtdb = window.firebase.database ? window.firebase.database(app) : null; } catch (e) { rtdb = null; }
      if (rtdb) attach();
    } catch (e) {
      /* ignore - fall back to localStorage only */
    } finally {
      if (onReady && !readyCalled) { readyCalled = true; onReady(); }
    }
  }

  // mirror of localStorage data kept in memory
  let cache = { subdomains: [], settings: null };
  let hasValue = false; // true once a real snapshot has arrived from RTDB

  const FirebaseSync = {
    get ready() { return !!rtdb; },

    // true once Firebase has delivered at least one snapshot (even empty)
    get hasValue() { return hasValue; },

    // callback once Firebase is initialized (or failed).
    // NOTE: named onReady (not ready) so it can't collide with the
    // `ready` boolean getter above — object literals keep only one.
    onReady: function (cb) {
      if (rtdb) { cb(); return; }
      onReady = cb;
    },

    onChange: function (fn) { listeners.push(fn); },

    setUser: function (u) { scopeUser = u || null; attach(); },
    clearUser: function () { scopeUser = null; attach(); },
    getUser: function () { return scopeUser; },

    /* generic one-shot read/write for accounts + admin ops */
    dbGet: function (path) {
      if (!rtdb) return Promise.resolve(null);
      try { return rtdb.ref(path).once('value').then((s) => s.val()); }
      catch (e) { return Promise.resolve(null); }
    },
    dbSet: function (path, val) {
      if (!rtdb) return Promise.resolve(false);
      try { return rtdb.ref(path).set(val).then(() => true).catch(() => false); }
      catch (e) { return Promise.resolve(false); }
    },

    /* per-library load status (null = still loading) */
    sdkStatus: function () { return window.FirebaseSDKStatus || null; },

    /* human message when Firebase Auth is unavailable */
    authLoadError: function () {
      try {
        const st = window.FirebaseSDKStatus || {};
        if (!window.firebase) {
          if (st.app === false) return 'Login blocked: scripts failed to load. Disable ad-blocker/VPN and reload.';
          return 'Login service is still loading. Wait a moment and retry.';
        }
        if (!window.firebase.auth || st.auth === false) {
          return 'Auth part failed to load. Reload the page (disable ad-blocker).';
        }
        return 'Login service is still loading. Wait a moment and retry.';
      } catch (e) {}
      return 'Auth service failed to load. Check your internet and reload.';
    },

    /* --- subdomains --- */
    load: function () {
      if (!rtdb) return null;
      try {
        return Array.isArray(cache.subdomains) ? cache.subdomains : null;
      } catch (e) { return null; }
    },

    saveSubdomains: function (list) {
      cache.subdomains = list;
      if (!rtdb) return;
      try { rtdb.ref(basePath() + '/subdomains').set(list); } catch (e) {}
    },

    saveSettings: function (settings) {
      cache.settings = settings;
      if (!rtdb) return;
      try { rtdb.ref('submanga/settings').set(settings); } catch (e) {}
    },

    /* --- settings --- */
    loadSettings: function () {
      return cache.settings;
    },
  };

  // Kick off loading. Do NOT block app start.
  loadSDK(doInit);

  window.FirebaseSync = FirebaseSync;
})();
