/* SUBMANGA - Login page (standalone, no app shell) */
(() => {
  if (Auth.current()) { window.location.href = 'index.html'; return; }
  try {
    const saved = Auth.rememberedId();
    if (saved) document.getElementById('loginId').value = saved;
  } catch (e) {}
  /* connection dot: green = Firebase Auth ready */
  (function connWatch() {
    let n = 0;
    const timer = setInterval(() => {
      const dot = document.getElementById('connDot');
      const txt = document.getElementById('connText');
      if (!dot || !txt) { clearInterval(timer); return; }
      let ok = false, failed = false;
      try {
        ok = !!(window.firebase && window.firebase.auth);
        const st = window.FirebaseSDKStatus || {};
        failed = st.auth === false || st.app === false;
      } catch (e) {}
      n++;
      if (ok) {
        dot.className = 'conn-dot on'; txt.textContent = 'Connected';
        clearInterval(timer);
      } else if (failed || n > 40) {
        dot.className = 'conn-dot off'; txt.textContent = 'Not connected';
        clearInterval(timer);
      }
    }, 500);
  })();
  const pass = document.getElementById('loginPass');
  document.getElementById('loginToggle').addEventListener('click', function () {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    this.textContent = show ? 'HIDE' : 'SHOW';
  });
  function fail(msg) {
    const e = document.getElementById('loginError');
    e.textContent = msg;
    e.style.display = 'block';
    const card = document.getElementById('loginCard');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginSubmit');
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    document.getElementById('loginError').style.display = 'none';
    try {
      const res = await Auth.login(
        document.getElementById('loginId').value,
        pass.value,
        !document.getElementById('rememberMe') || document.getElementById('rememberMe').checked
      );
      if (res.ok) {
        btn.textContent = 'Welcome!';
        window.location.href = 'index.html';
      } else {
        fail(res.error || 'Login failed.');
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    } catch (err) {
      fail('Something went wrong: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  });
})();
