/* SUBMANGA - Register page (standalone, no app shell) */
(() => {
  if (Auth.current()) { window.location.href = 'index.html'; return; }
  const pass = document.getElementById('regPass');
  document.getElementById('regToggle').addEventListener('click', function () {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    this.textContent = show ? 'HIDE' : 'SHOW';
  });
  function fail(msg) {
    const e = document.getElementById('regError');
    e.textContent = msg;
    e.style.display = 'block';
    const card = document.getElementById('regCard');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }
  document.getElementById('regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('regSubmit');
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    document.getElementById('regError').style.display = 'none';
    try {
      const res = await Auth.register(
        document.getElementById('regEmail').value,
        document.getElementById('regUser').value,
        document.getElementById('regDisplay').value,
        pass.value
      );
      if (res.ok) {
        btn.textContent = 'Done! Taking you in...';
        window.location.href = 'index.html';
      } else {
        fail(res.error || 'Register failed.');
        btn.disabled = false;
        btn.textContent = 'Register & claim bonus';
      }
    } catch (err) {
      fail('Something went wrong: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Register & claim bonus';
    }
  });
})();
