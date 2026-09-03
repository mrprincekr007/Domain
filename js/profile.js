/* SUBMANGA - Profile page (login required) */
(() => {
  Auth.init();
  if (!Auth.current()) { window.location.href = 'login.html'; return; }
  App.init('profile');
  const $ = App.$;

  function render() {
    const p = Auth.profile();
    if (!p) { window.location.href = 'login.html'; return; }
    const subs = SubManga.getSubdomains();
    $('#avatarBig').textContent = (p.display || 'U').trim().charAt(0).toUpperCase() || 'U';
    $('#profName').textContent = p.display;
    $('#profUser').textContent = '@' + p.username;
    $('#profSites').textContent = subs.length + ' site' + (subs.length === 1 ? '' : 's');
    $('#profCredits').textContent = p.credits + ' credits';
    const d = new Date(p.createdAt);
    $('#profSince').textContent = 'member since ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    if (!$('#displayInput').value) $('#displayInput').value = p.display === p.username ? '' : p.display;
    App.refreshWalletPill();
  }

  $('#displayForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await Auth.updateDisplay($('#displayInput').value);
    if (res.ok) { App.toast('Display name saved', 'success'); render(); }
    else App.toast('Could not save', 'error');
  });

  $('#passForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await Auth.changePassword($('#oldPass').value, $('#newPass').value);
    if (res.ok) {
      App.toast('Password updated', 'success');
      $('#oldPass').value = '';
      $('#newPass').value = '';
    } else {
      App.toast(res.error || 'Update failed', 'error');
    }
  });

  $('#logoutBtn').addEventListener('click', () => Auth.logout());

  (async () => {
    await Auth.refreshAccount();
    render();
  })();
  render();

  FX.init({ links: true, onReady() { FX.initReveals(); } });
})();
