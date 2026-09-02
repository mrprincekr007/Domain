/* ============================================================
   SUBMANGA - Settings page
   ============================================================ */

(() => {
  App.init('settings');
  const $ = App.$;
  const $all = App.$all;
  const settings = SubManga.getSettings();

  document.querySelectorAll('[data-theme-switch]').forEach((b) => b.addEventListener('click', App.toggleTheme));
  setThemeButton();
  function setThemeButton() {
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.innerHTML = App.getTheme() === 'dark' ? App.icons.sun : App.icons.moon;
    });
    $('#themeToggle').innerHTML =
      '<span data-tog>Theme: ' + (App.getTheme() === 'dark' ? 'Dark' : 'Light') + '</span>';
  }

  /* domain form */
  $('#domainInput').value = settings.domain || '';
  $('#domainForm').addEventListener('submit', (e) => {
    e.preventDefault();
    let d = $('#domainInput').value.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
    if (!d) { App.toast('Please enter a domain', 'error'); return; }
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(d)) {
      App.toast('Looks invalid — use format: mywebsite.com', 'error'); return;
    }
    settings.domain = d.toLowerCase();
    SubManga.saveSettings(settings);
    App.toast('Domain updated to ' + settings.domain, 'success');
  });

  /* theme */
  $('#themeToggle').addEventListener('click', () => { App.toggleTheme(); setThemeButton(); });
  $('#resetTheme').addEventListener('click', () => {
    localStorage.removeItem(SubManga.KEYS.theme);
    App.setTheme('dark');
    setThemeButton();
    App.toast('Theme reset to dark', 'success');
  });

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

  /* reset */
  $('#resetBtn').addEventListener('click', () => App.openModal('modal-reset'));
  $('#confirmReset').addEventListener('click', () => {
    localStorage.removeItem(SubManga.KEYS.subs);
    localStorage.removeItem(SubManga.KEYS.settings);
    localStorage.removeItem(SubManga.KEYS.theme);
    App.closeModal('modal-reset');
    App.toast('All data reset. Reloading...', 'success');
    setTimeout(() => location.reload(), 700);
  });

  $all('[data-close]').forEach((b) => b.addEventListener('click', () => App.closeModal(b.getAttribute('data-close'))));
  $all('.modal-backdrop').forEach((bd) => bd.addEventListener('click', (e) => {
    if (e.target === bd) bd.classList.remove('open');
  }));

  FX.init({ links: true, onReady() { FX.initReveals(); } });
})();
