/* ============================================================
   SUBMANGA - Settings page (User panel)
   Backup only. Domain, theme & danger zone = Admin panel.
   App is dark-only.
   ============================================================ */

(() => {
  Auth.init();
  App.init('settings');
  const $ = App.$;
  const $all = App.$all;

  /* domain — read-only, admin controlled */
  $('#domainDisplay').textContent = SubManga.getDomain();

  /* export / import */
  $('#exportBtn').addEventListener('click', () => SubManga.exportData());
  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    SubManga.importData(file, (res) => {
      if (res.ok) {
        App.toast('Backup imported successfully', 'success');
        setTimeout(() => location.reload(), 700);
      } else {
        App.toast(res.error || 'Import failed', 'error');
      }
    });
    e.target.value = '';
  });

  /* modal close (generic, future-proof) */
  $all('[data-close]').forEach((b) => b.addEventListener('click', () => App.closeModal(b.getAttribute('data-close'))));
  $all('.modal-backdrop').forEach((bd) => bd.addEventListener('click', (e) => {
    if (e.target === bd) bd.classList.remove('open');
  }));

  FX.init({ links: true, onReady() { FX.initReveals(); } });
})();
