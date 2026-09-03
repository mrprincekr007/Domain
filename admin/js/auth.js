/* ============================================================
   SUBMANGA ADMIN - Auth + Wallet (self-contained copy)
   Twin of ../../js/auth.js — keep both files identical when changing
   account/wallet logic. (Admin folder is deployable as its own
   website / repo.)
   Gmail via Firebase Authentication. Passwords stay with Firebase
   only — never saved locally.
   ============================================================ */

const Auth = (() => {
  const ACCOUNTS_KEY = 'submanga.accounts';   // local mirror, uid-keyed
  const USERNAMES_KEY = 'submanga.usernames'; // local mirror {username: uid}
  const SESSION_KEY = 'submanga.session';     // {u, uid, email}
  const Sync = window.FirebaseSync || null;

  /* -------- storage helpers -------- */
  function ls(key, fallback) {
    try { const raw = localStorage.getItem(key); if (raw === null) return fallback; const val = JSON.parse(raw); return (val === null || val === undefined) ? fallback : val; }
    catch (e) { return fallback; }
  }
  function ws(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  function validUsername(u) { return /^[a-z0-9_]{3,16}$/.test(u || ''); }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || ''); }

  /* -------- Firebase Auth handle (null when SDK missing) -------- */
  function fb() {
    try { return (window.firebase && window.firebase.auth) ? window.firebase.auth() : null; }
    catch (e) { return null; }
  }
  /* specific message when the SDK itself failed (ad-blocker/CDN/offline) */
  function loadErr() {
    try {
      if (window.FirebaseSync && FirebaseSync.authLoadError) return FirebaseSync.authLoadError();
    } catch (e) {}
    return 'Auth service failed to load. Check your internet and reload.';
  }
  function fbError(e, fallback) {
    const code = (e && e.code) || '';
    if (code === 'auth/email-already-in-use') return 'This email is already registered. Please login.';
    if (code === 'auth/user-not-found') return 'Account not found. Please register first.';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Wrong email or password.';
    if (code === 'auth/invalid-email') return 'Enter a valid email (e.g. name@gmail.com).';
    if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
    if (code === 'auth/operation-not-allowed') return 'Enable Email/Password sign-in in the Firebase console (Authentication → Sign-in method).';
    if (code === 'auth/network-request-failed') return 'Check your internet connection and try again.';
    if (code === 'auth/requires-recent-login') return 'Please login again and retry (security).';
    return (fallback || 'Something went wrong.') + (code ? ' (' + code + ')' : '');
  }

  /* -------- session (sync fast-path; Firebase truth reconciles async) -------- */
  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return (s && s.u && s.uid) ? s : null;
    } catch (e) { return null; }
  }
  function current() { const s = readSession(); return s ? s.u : null; }
  function uid() { const s = readSession(); return s ? s.uid : null; }
  function email() { const s = readSession(); return s ? s.email : null; }
  function setSession(u, id, em) {
    try {
      if (u && id) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ u: u, uid: id, email: em || '' }));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  /* call FIRST on every user page */
  function init() {
    const s = readSession();
    if (s && Sync && Sync.setUser) {
      try { Sync.setUser(s.uid); } catch (e) {}
    }
    try {
      const fa = fb();
      if (fa && fa.onAuthStateChanged) {
        fa.onAuthStateChanged((user) => {
          if (user && user.uid) {
            ensureMirror(user.uid, user.email).then((acc) => {
              if (acc && acc.username) {
                setSession(acc.username, user.uid, user.email || acc.email);
                if (Sync && Sync.setUser) { try { Sync.setUser(user.uid); } catch (e) {} }
              }
            }).catch(() => {});
          }
        });
      }
    } catch (e) {}
    if (s) {
      getAccount(s.uid).then((acc) => {
        if (acc && acc.status === 'blocked') {
          logout();
          if (!/login\.html$/.test(window.location.pathname)) window.location.href = 'login.html';
        }
      }).catch(() => {});
    }
    return s ? s.u : null;
  }

  /* -------- accounts store (uid-keyed) -------- */
  function readLocalAccounts() { return ls(ACCOUNTS_KEY, {}); }
  function readLocalUsernames() { return ls(USERNAMES_KEY, {}); }
  async function fetchRemoteAccount(id) {
    if (!Sync || !Sync.dbGet) return null;
    try { return await Sync.dbGet('submanga/accounts/' + id); }
    catch (e) { return null; }
  }
  async function pushAccount(id, obj) {
    const all = readLocalAccounts();
    if (obj) all[id] = obj; else delete all[id];
    ws(ACCOUNTS_KEY, all);
    if (Sync && Sync.dbSet) {
      try { await Sync.dbSet('submanga/accounts/' + id, obj); } catch (e) {}
    }
  }
  async function pushUsername(username, id) {
    const map = readLocalUsernames();
    map[username] = id;
    ws(USERNAMES_KEY, map);
    if (Sync && Sync.dbSet) {
      try { await Sync.dbSet('submanga/usernames/' + username, id); } catch (e) {}
    }
  }
  async function getAccount(id) {
    if (!id) return null;
    const local = readLocalAccounts()[id];
    if (local) return local;
    const remote = await fetchRemoteAccount(id);
    if (remote) {
      const all = readLocalAccounts();
      all[id] = remote;
      ws(ACCOUNTS_KEY, all);
    }
    return remote;
  }
  async function ensureMirror(id, em) {
    let acc = await getAccount(id);
    if (!acc && em) {
      acc = {
        email: String(em).toLowerCase(), username: String(em).split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 16) || 'user',
        display: String(em).split('@')[0], credits: 0, status: 'active', createdAt: Date.now(),
      };
      await pushAccount(id, acc);
    }
    return acc;
  }
  async function uidForUsername(username) {
    username = (username || '').trim().toLowerCase();
    const local = readLocalUsernames()[username];
    if (local) return local;
    if (Sync && Sync.dbGet) {
      try {
        const remote = await Sync.dbGet('submanga/usernames/' + username);
        const rid = (typeof remote === 'string') ? remote : (remote && remote.uid);
        if (rid) {
          const map = readLocalUsernames();
          map[username] = rid;
          ws(USERNAMES_KEY, map);
          return rid;
        }
      } catch (e) {}
    }
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

  /* -------- remembered login id (email/username TEXT only — never password) -------- */
  const REMEMBER_KEY = 'submanga.remember';
  function rememberId(id) {
    try {
      if (id) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ id: String(id).slice(0, 80) }));
      else localStorage.removeItem(REMEMBER_KEY);
    } catch (e) {}
  }
  function rememberedId() {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return '';
      const o = JSON.parse(raw);
      return (o && o.id) || '';
    } catch (e) { return ''; }
  }

  /* -------- register / login / logout -------- */
  async function register(em, username, display, pass) {
    em = (em || '').trim().toLowerCase();
    username = (username || '').trim().toLowerCase();
    display = (display || '').trim() || username;
    if (!validEmail(em)) return { ok: false, error: 'Enter a valid email (e.g. name@gmail.com).' };
    if (!validUsername(username)) return { ok: false, error: 'Username: 3-16 chars, a-z, 0-9, _ only.' };
    if (!pass || pass.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    let fa = fb();
    if (!fa && !(await waitForFbAuth(4000))) return { ok: false, error: loadErr() };
    if (!fa) fa = fb();
    const takenLocal = readLocalUsernames()[username];
    if (takenLocal) return { ok: false, error: 'This username is already taken.' };
    if (Sync && Sync.dbGet) {
      try {
        const takenRemote = await Sync.dbGet('submanga/usernames/' + username);
        if (takenRemote && takenRemote.uid) {
          const map = readLocalUsernames();
          map[username] = takenRemote.uid;
          ws(USERNAMES_KEY, map);
          return { ok: false, error: 'This username is already taken.' };
        }
      } catch (e) {}
    }

    let cred;
    try {
      cred = await fa.createUserWithEmailAndPassword(em, pass);
    } catch (e) {
      return { ok: false, error: fbError(e, 'Register failed.') };
    }
    const id = cred.user.uid;

    let bonus = 20;
    try { if (window.SubManga) bonus = parseInt(SubManga.getSettings().signupBonus, 10); if (isNaN(bonus) || bonus < 0) bonus = 20; } catch (e) {}
    const acc = {
      email: em, username: username, display: display.slice(0, 30),
      credits: bonus, status: 'active', createdAt: Date.now(),
    };
    await pushAccount(id, acc);
    await pushUsername(username, id);

    let migrated = false;
    try { if (window.SubManga) migrated = SubManga.migrateLegacyTo(id); } catch (e) {}
    setSession(username, id, em);
    rememberId(em);
    if (Sync && Sync.setUser) { try { Sync.setUser(id); } catch (e) {} }
    await addTxn(id, 'bonus', bonus, 'Welcome signup bonus');
    if (window.SubManga) { try { SubManga.logActivity('settings', 'Account created (' + em + '). Bonus: ' + bonus + ' credits' + (migrated ? ' + old data migrated' : '')); } catch (e) {} }
    return { ok: true, uid: id };
  }

  async function login(identifier, pass, remember) {
    identifier = (identifier || '').trim();
    let em = identifier.toLowerCase();
    if (em.indexOf('@') === -1) {
    /* username login — resolve uid first, then Firebase login with email */
    if (!validUsername(em)) return { ok: false, error: 'Enter a correct username or email.' };
    const id = await uidForUsername(em);
    if (!id) return { ok: false, error: 'Account not found. Please register first.' };
    const acc = await getAccount(id);
    if (!acc || !acc.email) return { ok: false, error: 'Account not found. Please register first.' };
    em = String(acc.email).toLowerCase();
    } else if (!validEmail(em)) {
      return { ok: false, error: 'Enter a valid email.' };
    }
    let fa = fb();
    if (!fa && !(await waitForFbAuth(4000))) return { ok: false, error: loadErr() };
    if (!fa) fa = fb();
    /* remember checked (default) → stay logged in across restarts, else session-only */
    try {
      if (fa && typeof fa.setPersistence === 'function' && window.firebase && window.firebase.auth && window.firebase.auth.Auth && window.firebase.auth.Auth.Persistence) {
        await fa.setPersistence(remember === false ? window.firebase.auth.Auth.Persistence.SESSION : window.firebase.auth.Auth.Persistence.LOCAL);
      }
    } catch (e) { /* keep default persistence */ }
    let cred;
    try {
      cred = await fa.signInWithEmailAndPassword(em, pass || '');
    } catch (e) {
      return { ok: false, error: fbError(e, 'Login failed.') };
    }
    const id = cred.user.uid;
    let acc = await getAccount(id);
    if (!acc) {
      acc = { email: em, username: String(em).split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 16) || 'user', display: String(em).split('@')[0], credits: 0, status: 'active', createdAt: Date.now() };
      await pushAccount(id, acc);
      await pushUsername(acc.username, id);
    }
    if (acc.status === 'blocked') {
      try { await fa.signOut(); } catch (e) {}
      return { ok: false, error: 'This account has been blocked by the admin.' };
    }
    setSession(acc.username, id, em);
    rememberId(remember === false ? null : identifier);
    try { getAccount(id).then((a) => { if (a) { a.lastLoginAt = Date.now(); pushAccount(id, a); } }).catch(() => {}); } catch (e) {}
    if (Sync && Sync.setUser) { try { Sync.setUser(id); } catch (e) {} }
    return { ok: true };
  }

  function logout(redirect) {
    try {
      const fa = fb();
      if (fa && fa.signOut) fa.signOut().catch(() => {});
    } catch (e) {}
    setSession(null);
    if (Sync && Sync.clearUser) { try { Sync.clearUser(); } catch (e) {} }
    if (redirect !== false) window.location.href = 'login.html';
  }

  /* -------- wallet (uid-scoped) -------- */
  function credits() {
    const id = uid();
    if (!id) return 0;
    const acc = readLocalAccounts()[id];
    return acc ? (parseInt(acc.credits, 10) || 0) : 0;
  }
  async function refreshAccount() {
    const id = uid();
    if (!id) return null;
    const remote = await fetchRemoteAccount(id);
    if (remote) {
      const all = readLocalAccounts();
      all[id] = remote;
      ws(ACCOUNTS_KEY, all);
    }
    return remote || readLocalAccounts()[id] || null;
  }
  async function addFunds(amount, note) {
    const id = uid();
    if (!id) return { ok: false, error: 'Please login first.' };
    amount = Math.floor(Number(amount));
    if (!amount || amount < 1 || amount > 100000) return { ok: false, error: 'Amount must be 1–100000.' };
    const acc = (await getAccount(id)) || { credits: 0 };
    acc.credits = (parseInt(acc.credits, 10) || 0) + amount;
    await pushAccount(id, acc);
    await addTxn(id, 'topup', amount, note || 'Funds added');
    return { ok: true, balance: acc.credits };
  }
  /* returns {ok} — reason: 'login' | 'funds' */
  function canBuy() {
    if (!uid()) return { ok: false, reason: 'login' };
    let price = 10;
    try { if (window.SubManga) price = SubManga.getPrice(); } catch (e) {}
    if (credits() < price) return { ok: false, reason: 'funds', price: price, need: price - credits() };
    return { ok: true, price: price };
  }
  async function charge(price, note) {
    const id = uid();
    if (!id) return false;
    const acc = (await getAccount(id)) || { credits: 0 };
    const bal = parseInt(acc.credits, 10) || 0;
    if (bal < price) return false;
    acc.credits = bal - price;
    await pushAccount(id, acc);
    await addTxn(id, 'buy', -price, note || 'Subdomain purchased');
    return true;
  }

  /* -------- transactions (uid-scoped, last 50) -------- */
  function txnKey(id) { return 'submanga.user.' + id + '.txns'; }
  function getTxns() {
    const id = uid();
    if (!id) return [];
    return ls(txnKey(id), []);
  }
  async function addTxn(id, type, amount, note) {
    if (!id) return;
    try {
      const list = ls(txnKey(id), []);
      list.unshift({ id: 't' + Date.now().toString(36), type: type, amount: amount, note: note || '', time: Date.now() });
      if (list.length > 50) list.length = 50;
      ws(txnKey(id), list);
      if (Sync && Sync.dbSet) {
        try { await Sync.dbSet('submanga/users/' + id + '/txns', list); } catch (e) {}
      }
    } catch (e) {}
  }

  /* -------- profile -------- */
  function profile() {
    const s = readSession();
    if (!s) return null;
    const acc = readLocalAccounts()[s.uid] || {};
    return { username: s.u, email: s.email || acc.email || '', display: acc.display || s.u, credits: parseInt(acc.credits, 10) || 0, status: acc.status || 'active', createdAt: acc.createdAt || Date.now() };
  }
  async function updateDisplay(display) {
    const id = uid();
    if (!id) return { ok: false };
    display = (display || '').trim().slice(0, 30) || current();
    const acc = (await getAccount(id)) || {};
    acc.display = display;
    await pushAccount(id, acc);
    return { ok: true };
  }
  async function changePassword(oldPass, newPass) {
    const id = uid();
    if (!id) return { ok: false, error: 'Please login first.' };
    if (!newPass || newPass.length < 6) return { ok: false, error: 'New password must be at least 6 chars.' };
    try {
      const fa = fb();
      const fu = fa && fa.currentUser;
      if (fu && typeof fu.updatePassword === 'function') {
        await fu.updatePassword(newPass);
        return { ok: true };
      }
    } catch (e) {
      return { ok: false, error: fbError(e, 'Update failed.') };
    }
    return { ok: false, error: 'Go online and login again, then try.' };
  }

  /* -------- admin: users (uid-keyed merge) -------- */
  async function listUsers() {
    const merged = Object.assign({}, readLocalAccounts());
    if (Sync && Sync.dbGet) {
      try {
        const remote = await Sync.dbGet('submanga/accounts');
        if (remote && typeof remote === 'object') {
          Object.keys(remote).forEach((k) => { merged[k] = Object.assign({}, merged[k], remote[k]); });
          ws(ACCOUNTS_KEY, merged);
        }
      } catch (e) {}
    }
    return Object.keys(merged).map((id) => Object.assign({ uid: id }, merged[id]));
  }
  async function userSites(id) {
    try {
      const local = ls('submanga.user.' + id + '.subdomains', null);
      if (Array.isArray(local)) return local.length;
    } catch (e) {}
    if (Sync && Sync.dbGet) {
      try {
        const remote = await Sync.dbGet('submanga/users/' + id + '/subdomains');
        if (Array.isArray(remote)) return remote.length;
      } catch (e) {}
    }
    return 0;
  }
  async function adminAdjust(id, delta, note) {
    id = (id || '').trim();
    delta = Math.floor(Number(delta));
    if (!id || !delta) return { ok: false, error: 'Username and amount are required.' };
    const acc = (await getAccount(id)) || { display: id, credits: 0, status: 'active', createdAt: Date.now() };
    acc.credits = (parseInt(acc.credits, 10) || 0) + delta;
    if (acc.credits < 0) acc.credits = 0;
    await pushAccount(id, acc);
    await addTxn(id, delta > 0 ? 'grant' : 'deduct', delta, note || (delta > 0 ? 'Admin credit' : 'Admin deduct'));
    return { ok: true, balance: acc.credits };
  }
  async function setUserStatus(id, status) {
    id = (id || '').trim();
    const acc = await getAccount(id);
    if (!acc) return { ok: false, error: 'User not found.' };
    acc.status = status;
    await pushAccount(id, acc);
    return { ok: true };
  }
  async function deleteUser(id) {
    id = (id || '').trim();
    const acc = await getAccount(id);
    const all = readLocalAccounts();
    delete all[id];
    ws(ACCOUNTS_KEY, all);
    const map = readLocalUsernames();
    if (acc && acc.username && map[acc.username] === id) { delete map[acc.username]; ws(USERNAMES_KEY, map); }
    try { localStorage.removeItem('submanga.user.' + id + '.subdomains'); } catch (e) {}
    try { localStorage.removeItem('submanga.user.' + id + '.txns'); } catch (e) {}
    try { localStorage.removeItem('submanga.user.' + id + '.activity_log'); } catch (e) {}
    if (Sync && Sync.dbSet) {
      try { await Sync.dbSet('submanga/accounts/' + id, null); } catch (e) {}
      try { await Sync.dbSet('submanga/users/' + id, null); } catch (e) {}
      if (acc && acc.username) { try { await Sync.dbSet('submanga/usernames/' + acc.username, null); } catch (e) {} }
    }
    return { ok: true };
  }

  return {
    current, uid, email, init, register, login, logout,
    rememberId, rememberedId,
    credits, refreshAccount, addFunds, canBuy, charge,
    getTxns, profile, updateDisplay, changePassword,
    listUsers, userSites, adminAdjust, setUserStatus, deleteUser, getAccount, uidForUsername,
  };
})();

// expose as window property (const/let don't attach to window;
// app.js + data.js guard on window.Auth)
window.Auth = Auth;
