/* ============================================================
   SUBMANGA - Firebase init (CDN, no build step)
   Uses Firebase Realtime Database (matches the project databaseURL).
   Loaded as a plain <script> before app.js.
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

  function emit() {
    listeners.forEach((fn) => {
      try { fn(); } catch (e) {}
    });
  }

  function loadSDK(cb) {
    // Load the compat scripts via <script> tags dynamically so the app's
    // plain-script setup keeps working.
    const base = 'https://www.gstatic.com/firebasejs/';
    const scripts = [
      base + '10.7.1/firebase-app-compat.js',
      base + '10.7.1/firebase-database-compat.js',
      base + '10.7.1/firebase-analytics-compat.js',
    ];
    let idx = 0;
    function next() {
      if (idx >= scripts.length) { cb(); return; }
      const s = document.createElement('script');
      s.src = scripts[idx++];
      s.onload = next;
      s.onerror = next; // continue chain, init will fail gracefully later
      document.head.appendChild(s);
    }
    next();
  }

  function doInit() {
    try {
      if (!window.firebase || !window.firebase.database) {
        // SDK not available
        return;
      }
      const app = window.firebase.initializeApp(CONFIG);
      try { rtdb = window.firebase.database(app); } catch (e) { rtdb = null; }
      if (rtdb) {
        // push the app data key under a single node
        rtdb.ref('submanga/').on('value', (snap) => {
          hasValue = true;
          cache = snap.val() || {};
          emit();
        });
      }
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

    // callback once Firebase is initialized (or failed)
    ready: function (cb) {
      if (rtdb) { cb(); return; }
      onReady = cb;
    },

    onChange: function (fn) { listeners.push(fn); },

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
      try { rtdb.ref('submanga/subdomains').set(list); } catch (e) {}
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
