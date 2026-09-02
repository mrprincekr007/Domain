/* ============================================================
   SUBMANGA - DNS & Deploy page
   ============================================================ */

(() => {
  App.init('dns');
  const $ = App.$;
  const $all = App.$all;
  const domain = SubManga.getDomain();

  document.querySelectorAll('[data-theme-switch]').forEach((b) => b.addEventListener('click', App.toggleTheme));
  setIcon();
  function setIcon() {
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.innerHTML = App.getTheme() === 'dark' ? App.icons.sun : App.icons.moon;
    });
  }

  $('#domainCallout').innerHTML =
    App.icons.globe +
    '<div>Aapka main domain: <code style="font-family:var(--font-code)"><strong>' + App.esc(domain) + '</strong></code>. ' +
    'Isko <a href="settings.html" style="color:var(--primary);font-weight:600">Settings</a> mein badal sakte hain.</div>';

  /* ---------- tabs ---------- */
  function activateTab(tabId) {
    $all('.tab').forEach((t) => t.classList.remove('active'));
    $all('.tab-panel').forEach((p) => p.classList.remove('active'));
    const tab = $('.tab[data-tab="' + tabId + '"]');
    if (tab) tab.classList.add('active');
    const panel = $('#tab-' + tabId);
    if (panel) panel.classList.add('active');
  }
  $all('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      activateTab(tab.getAttribute('data-tab'));
      if (window.history && history.replaceState) {
        history.replaceState(null, '', '#' + tab.getAttribute('data-tab'));
      }
    });
  });
  const hash = window.location.hash.replace('#', '');
  if (hash === 'dns' || hash === 'generator' || hash === 'faq' || hash === 'deploy') {
    activateTab(hash);
  }

  /* ---------- copy buttons ---------- */
  $all('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-copytarget');
      const text = document.getElementById(id).innerText;
      App.copyText(text, 'Record');
    });
  });

  /* ---------- DEPLOY SECTION ---------- */
  Cloudflare.load();
  const cfReady = Cloudflare.configured();
  if (cfReady) {
    $('#cfNotConfigured').style.display = 'none';
    $('#deployPrefix').textContent = '.' + domain;
  } else {
    $('#cfNotConfigured').style.display = 'block';
  }

  /* deploy form */
  $('#deployBtn').addEventListener('click', async () => {
    const name = $('#deployName').value.trim().toLowerCase();
    const gh = $('#deployGithub').value.trim();
    if (!name) { App.toast('Subdomain name daalo', 'error'); return; }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(name)) { App.toast('Invalid name — use letters, numbers, hyphens', 'error'); return; }
    if (!gh) { App.toast('GitHub username daalo', 'error'); return; }
    const target = gh + '.github.io';

    /* save to app */
    const existing = SubManga.findSubdomain(name);
    if (!existing) {
      SubManga.addSubdomain({ name, project: '', repo: gh, status: 'pending', desc: 'Deploy via Cloudflare' });
    } else {
      SubManga.updateSubdomain(existing.id, { repo: gh, status: 'pending' });
    }

    /* create DNS record via Cloudflare API */
    if (Cloudflare.configured()) {
      $('#deployBtn').disabled = true;
      $('#deployBtn').textContent = 'Creating DNS record...';
      const out = $('#deployOutput');
      const result = $('#deployResult');
      result.style.display = 'block';
      out.textContent = 'Deploying ' + name + '.' + domain + ' ...\n';
      function log(msg) { out.textContent += msg + '\n'; }
      log('CNAME  ' + name + '.' + domain + '  →  ' + target);
      log('---');
      try {
        const result = await Cloudflare.createRecord({
          type: 'CNAME',
          name: name,
          content: target,
          ttl: 1,
          proxied: true,
        });
        log('Response: ' + JSON.stringify(result, null, 2));
        if (result.success) {
          log('---');
          log('SUCCESS! DNS record ban gaya Cloudflare pe.');
          SubManga.updateSubdomain(SubManga.findSubdomain(name).id, { status: 'live' });
          App.toast(name + '.' + domain + ' → Cloudflare mein ban gaya!', 'success');
        } else {
          log('---');
          log('FAILED! Error: ' + JSON.stringify(result.errors));
          App.toast(name + '.' + domain + ' → Cloudflare mein nahi bana!', 'error');
        }
      } catch (e) {
        log('EXCEPTION: ' + e.message);
        App.toast('Cloudflare mein nahi bana: ' + e.message, 'error');
      }
      $('#deployBtn').disabled = false;
      $('#deployBtn').textContent = 'Deploy to Cloudflare DNS';
    } else {
      /* fallback — show manual instructions */
      const cfUrl = 'https://dash.cloudflare.com';
      showDeployResult(
        '<strong>Step 1: DNS Record</strong><br>' +
        'Type: <code>CNAME</code> | Name: <code>' + App.esc(name) + '</code> | Target: <code>' + App.esc(target) + '</code><br><br>' +
        '<strong>Step 2: GitHub</strong><br>' +
        'Repo → Settings → Pages → Custom domain → <code>' + App.esc(name + '.' + domain) + '</code><br><br>' +
        '<button class="btn btn-primary" onclick="window.open(\'' + cfUrl + '\',\'_blank\')" style="margin-top:8px">Open Cloudflare DNS →</button>',
        'success'
      );
    }

    renderExisting();
    $('#deployName').value = '';
  });

  function showDeployResult(msg, type) {
    const el = $('#deployResult');
    el.style.display = 'block';
    const colors = { success: 'var(--accent)', error: 'var(--destructive)', warning: 'var(--warning)' };
    el.innerHTML = '<div class="callout ' + (type === 'success' ? 'success' : type === 'error' ? 'warning' : '') + '">' +
      '<div style="color:' + (colors[type] || 'var(--foreground)') + '">' + msg + '</div></div>';
  }

  /* ---------- existing subdomains list ---------- */
  function renderExisting() {
    const subs = SubManga.getSubdomains();
    if (!subs.length) {
      $('#existingList').innerHTML = '<div style="color:var(--muted-fg);font-size:14px;padding:12px 0">Koi subdomain nahi hai. Pehle deploy karo ya app me add karo.</div>';
      return;
    }
    $('#existingList').innerHTML = subs.map((s) =>
      '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;background:var(--card)">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-family:var(--font-code);font-size:14px;font-weight:600;color:var(--c1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + App.esc(s.name + '.' + domain) + '</div>' +
          '<div style="font-size:12px;color:var(--muted-fg);margin-top:2px">' + App.esc(s.repo || 'No repo set') + '</div>' +
        '</div>' +
        '<span class="badge ' + (s.status === 'live' ? 'success' : s.status === 'pending' ? 'warning' : 'neutral') + '"><span class="dot"></span>' + s.status + '</span>' +
        '<button class="btn btn-sm check-dns" data-name="' + App.esc(s.name) + '" style="font-size:12px">Check DNS</button>' +
      '</div>'
    ).join('');

    $all('.check-dns').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const name = btn.getAttribute('data-name');
        btn.textContent = 'Checking...';
        btn.disabled = true;
        try {
          /* use Google DNS-over-HTTPS (CORS supported) */
          const fqdn = name + '.' + domain;
          const r = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=CNAME');
          const data = await r.json();
          let resolved = false;
          let target = '';
          if (data.Answer && data.Answer.length) {
            resolved = true;
            target = data.Answer[0].data;
          } else {
            const r2 = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=A');
            const d2 = await r2.json();
            if (d2.Answer && d2.Answer.length) {
              resolved = true;
              target = d2.Answer[0].data;
            }
          }
          if (resolved) {
            const sub = SubManga.findSubdomain(name);
            if (sub) SubManga.updateSubdomain(sub.id, { status: 'live' });
            App.toast(name + '.' + domain + ' is LIVE! (' + target + ')', 'success');
            renderExisting();
          } else {
            App.toast(name + ' — DNS not propagated yet. Wait 5-15 min.', 'warning');
          }
        } catch (e) {
          App.toast('Check failed: ' + e.message, 'error');
        }
        btn.textContent = 'Check DNS';
        btn.disabled = false;
      });
    });
  }
  renderExisting();

  /* ---------- generator ---------- */
  const ips = SubManga.githubPagesRecords();
  $('#genForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#genName').value.trim().toLowerCase();
    const user = $('#genUser').value.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/\/+$/, '');
    if (!name) { App.toast('Please enter a subdomain name', 'error'); return; }
    if (!user) { App.toast('Please enter your GitHub username', 'error'); return; }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(name)) { App.toast('Invalid subdomain name', 'error'); return; }

    const full = name + '.' + domain;
    $('#rec-a').innerText =
      'Host: ' + name + '   |   Type: A' + '\n' +
      ips.map((ip) => '  ' + ip).join('\n');
    $('#rec-cname').innerText = full;
    const r = $('#genResult');
    r.style.display = 'block';
    if (typeof r.scrollIntoView === 'function') r.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIconStatic();
  });

  function setIconStatic() {
    $('#genResult .gen-check-icon').innerHTML = App.icons.check;
  }

  /* ---------- FAQ ---------- */
  const faqs = [
    {
      q: 'Deploy tab kya karta hai?',
      a: 'Cloudflare API se ek click me DNS record auto-create ho jata hai. Bas subdomain name likho aur Deploy dabao — Hostinger/Cloudflare jaana nahi padega.',
    },
    {
      q: 'Cloudflare configure kaise karun?',
      a: 'Settings page pe jaao → Cloudflare API section me API Token aur Zone ID daalo → Save. Phir Deploy tab se deploy karo.',
    },
    {
      q: 'DNS propagate hone mein kitna time lagta hai?',
      a: 'Cloudflare ke saath aam taur par 5-15 minute lagte hain. "Check DNS" button se status check kar sakte ho.',
    },
    {
      q: 'Enforce HTTPS kyu kaam nahi kar raha?',
      a: 'Enforce HTTPS tabhi on hota hai jab DNS fully propagate ho jaye aur GitHub certificate issue kar sake. Pehle DNS live hone ka wait karein.',
    },
    {
      q: 'Kya main bina kisi domain ke bhi web host kar sakta hoon?',
      a: 'Haan! Har GitHub repo ka ek free URL hota hai: USERNAME.github.io/REPO. Custom subdomain tab chahiye jab branded domain use karna ho.',
    },
  ];
  $('#faqList').innerHTML = faqs.map((f, i) =>
    '<div class="faq-item" style="border-bottom:1px solid var(--border);padding:14px 0">' +
      '<button style="width:100%;display:flex;justify-content:space-between;align-items:center;background:none;border:none;color:var(--foreground);font-weight:600;font-size:15px;text-align:left;padding:4px 0" data-faq="' + i + '">' +
        '<span>' + App.esc(f.q) + '</span><span class="faq-chevron" style="transition:transform .2s">▾</span>' +
      '</button>' +
      '<div class="faq-answer" style="display:none;padding:8px 0 4px;font-size:14px;color:var(--muted-fg)">' + App.esc(f.a) + '</div>' +
    '</div>'
  ).join('');

  $all('[data-faq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ans = btn.parentElement.querySelector('.faq-answer');
      const chev = btn.querySelector('.faq-chevron');
      const open = ans.style.display === 'block';
      ans.style.display = open ? 'none' : 'block';
      chev.style.transform = open ? 'rotate(0)' : 'rotate(180deg)';
    });
  });

  FX.init({ links: true, onReady() { FX.initReveals(); FX.initTilt(); } });
})();
