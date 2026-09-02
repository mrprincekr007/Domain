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
    localStorage.removeItem('cf_worker');
    localStorage.removeItem('cf_zone');
    App.closeModal('modal-reset');
    App.toast('All data reset. Reloading...', 'success');
    setTimeout(() => location.reload(), 700);
  });

  /* ---- Cloudflare config ---- */
  const cf = Cloudflare.load();
  if (cf.workerUrl) $('#cfWorker').value = cf.workerUrl;
  if (cf.zoneId) $('#cfZone').value = cf.zoneId;

  $('#cfSave').addEventListener('click', () => {
    const worker = $('#cfWorker').value.trim();
    const zone = $('#cfZone').value.trim();
    if (!worker || !zone) { App.toast('Worker URL aur Zone ID dono chahiye', 'error'); return; }
    Cloudflare.configure({ workerUrl: worker, zoneId: zone });
    App.toast('Config saved!', 'success');
    showCfStatus('Saved — ready for deploy.');
  });

  $('#cfTest').addEventListener('click', async () => {
    const worker = $('#cfWorker').value.trim();
    const zone = $('#cfZone').value.trim();
    if (!worker || !zone) { App.toast('Worker URL aur Zone ID pehle daalo', 'error'); return; }
    Cloudflare.configure({ workerUrl: worker, zoneId: zone });
    showCfStatus('Testing...');
    try {
      const res = await Cloudflare.testConnection();
      if (res.ok) {
        showCfStatus('Connected! Token status: ' + res.status);
      } else {
        showCfStatus('Error — Worker deploy sahi se hua? Environment variable set hai?');
      }
    } catch (e) {
      showCfStatus('Network error — Worker URL check karo');
    }
  });

  /* ---- Quick Deploy ---- */
  Cloudflare.load();
  function setQdPrefix() { $('#qdPrefix').textContent = '.' + SubManga.getDomain(); }
  setQdPrefix();

  $('#qdDeploy').addEventListener('click', async () => {
    const name = $('#qdName').value.trim().toLowerCase();
    const gh = $('#qdGithub').value.trim();
    const out = $('#qdOutput');
    const result = $('#qdResult');

    if (!name) { App.toast('Subdomain name daalo', 'error'); return; }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(name)) { App.toast('Invalid name — use letters, numbers, hyphens', 'error'); return; }
    if (!gh) { App.toast('GitHub username daalo', 'error'); return; }
    if (!Cloudflare.configured()) { App.toast('Pehle Worker URL aur Zone ID save karo', 'error'); return; }

    const domain = SubManga.getDomain();
    const target = gh + '.github.io';
    const fqdn = name + '.' + domain;

    result.style.display = 'block';
    out.textContent = 'Deploying ' + fqdn + ' ...\n';
    $('#qdDeploy').disabled = true;
    $('#qdDeploy').textContent = 'Creating DNS record...';

    function log(msg) { out.textContent += msg + '\n'; }

    log('CNAME  ' + fqdn + '  →  ' + target);
    log('---');

    try {
      const res = await Cloudflare.createRecord({
        type: 'CNAME',
        name: name,
        content: target,
        ttl: 1,
        proxied: true,
      });
      log('Response: ' + JSON.stringify(res, null, 2));

      if (res.success) {
        log('---');
        log('SUCCESS! DNS record ban gaya Cloudflare pe.');
        log('Ab GitHub pe jao → Repo → Settings → Pages → Custom domain → ' + fqdn);
        App.toast(fqdn + ' → Cloudflare mein ban gaya!', 'success');

        /* save to app */
        const existing = SubManga.findSubdomain(name);
        if (!existing) {
          SubManga.addSubdomain({ name, project: '', repo: gh, status: 'pending', desc: 'Deployed via Settings' });
        }
      } else {
        log('---');
        log('FAILED! Cloudflare ne reject kiya.');
        log('Error: ' + JSON.stringify(res.errors));
        App.toast(fqdn + ' → Cloudflare mein nahi bana!', 'error');
      }
    } catch (e) {
      log('EXCEPTION: ' + e.message);
      App.toast('Cloudflare mein nahi bana: ' + e.message, 'error');
    }

    $('#qdDeploy').disabled = false;
    $('#qdDeploy').textContent = 'Deploy to Cloudflare DNS';
  });

  function showCfStatus(msg) {
    const el = $('#cfStatus');
    el.style.display = 'block';
    el.textContent = msg;
  }

  $all('[data-close]').forEach((b) => b.addEventListener('click', () => App.closeModal(b.getAttribute('data-close'))));
  $all('.modal-backdrop').forEach((bd) => bd.addEventListener('click', (e) => {
    if (e.target === bd) bd.classList.remove('open');
  }));

  FX.init({ links: true, onReady() { FX.initReveals(); } });
})();
