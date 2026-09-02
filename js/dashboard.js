/* ============================================================
   SUBMANGA - Dashboard page
   ============================================================ */

(() => {
  App.init('dashboard');
  const $ = App.$;
  const $all = App.$all;
  Cloudflare.load();

  /* topbar theme + nav icon */
  $('#navAddIcon').innerHTML = App.icons.plus;
  document.querySelectorAll('[data-theme-switch]').forEach((b) => b.addEventListener('click', App.toggleTheme));
  setIcon();
  function setIcon() {
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.innerHTML = App.getTheme() === 'dark' ? App.icons.sun : App.icons.moon;
    });
  }

  /* greeting */
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('#greeting').textContent = greet + ' — manage your sites from one place.';

  /* hero domain badge + live-sites panel */
  function renderHero() {
    const d = SubManga.getDomain();
    $('#heroDomain').innerHTML =
      App.icons.globe + '<span>root: <b>' + App.esc(d) + '</b> · unlimited subdomains</span>';

    const subs = SubManga.getSubdomains();
    const shown = subs.slice().sort((a, b) => (a.status === 'live' ? -1 : 1) - (b.status === 'live' ? -1 : 1)).slice(0, 4);
    const statusDot = { live: 'live', pending: 'pending', draft: 'draft' };
    $('#heroSites').innerHTML = shown.length
      ? shown.map((s) =>
          '<div class="hero-site"><span class="site-status ' + (statusDot[s.status] || 'draft') + '"></span>' +
          '<span class="site-url"><b>' + App.esc(s.name) + '.</b>' + App.esc(d) + '</span></div>'
        ).join('')
      : '<div class="hero-site"><span class="site-status draft"></span><span class="site-url" style="color:var(--muted-fg)">No sites yet — add your first</span></div>';
    $('#heroPanelCount').textContent = subs.length + ' subdomain' + (subs.length === 1 ? '' : 's') + ' · ' + subs.filter((s) => s.status === 'live').length + ' live';
  }

  /* ---------- stats with animated counters ---------- */
  function renderStats() {
    const subs = SubManga.getSubdomains();
    const live = subs.filter((s) => s.status === 'live').length;
    const pending = subs.filter((s) => s.status === 'pending').length;
    const drafts = subs.filter((s) => s.status === 'draft').length;
    const domain = SubManga.getDomain();

    const stats = [
      { label: 'Total subdomains', value: subs.length, icon: App.icons.globe, c1:'#38bdf8', c2:'#818cf8', tint:'rgba(56,189,248,0.14)', note:'on '+domain },
      { label: 'Live websites', value: live, icon: App.icons.check, c1:'#34d399', c2:'#22d3ee', tint:'rgba(52,211,153,0.14)', note:'all working' },
      { label: 'Pending deploy', value: pending, icon: App.icons.clock, c1:'#fbbf24', c2:'#fb923c', tint:'rgba(251,191,36,0.14)', note:'waiting on DNS' },
      { label: 'Drafts', value: drafts, icon: App.icons.pencil, c1:'#c084fc', c2:'#e879f9', tint:'rgba(192,132,252,0.14)', note:'not published' },
    ];

    $('#statsGrid').innerHTML = stats.map((s) =>
      '<div class="card stat-card tilt" style="--stat-c1:'+s.c1+';--stat-c2:'+s.c2+';--stat-tint:'+s.tint+'">' +
        '<div class="sheen"></div>' +
        '<div class="stat-icon">' + s.icon + '</div>' +
        '<div class="stat-value" data-counter="' + s.value + '">0</div>' +
        '<div class="stat-label">' + s.label + '</div>' +
        '<div class="stat-note">' + s.note + '</div>' +
      '</div>'
    ).join('');

    // animate counters once visible
    const values = $all('#statsGrid [data-counter]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && en.target) {
          FX.animateCounter(en.target, +en.target.dataset.counter);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    values.forEach((v) => io.observe(v));
  }

  /* ---------- quick actions ---------- */
  function renderQuickActions() {
    const actions = [
      { icon: App.icons.plus, title: 'Add new subdomain', desc: 'Create a site like blog.'+SubManga.getDomain(), modal: true },
      { icon: App.icons.dns, title: 'Set up DNS', desc: 'Point subdomains to GitHub Pages', href: 'dns.html' },
      { icon: App.icons.git, title: 'GitHub Pages', desc: 'Connect each repo to its subdomain', href: 'dns.html#dns' },
      { icon: App.icons.settings, title: 'Change domain', desc: 'Update your main domain name', href: 'settings.html' },
    ];
    $('#quickActions').innerHTML = actions.map((a) =>
      '<div class="card hoverable sub-card tilt" data-modal="'+(a.modal?1:0)+'" data-href="'+(a.href||'')+'" style="cursor:pointer">' +
        '<div class="sheen"></div>' +
        '<div class="stat-icon" style="--stat-c1:var(--c1);--stat-c2:var(--c2);--stat-tint:var(--muted);width:42px;height:42px;margin:0 0 12px">' + a.icon + '</div>' +
        '<div class="sub-project">' + a.title + '</div>' +
        '<div class="sub-desc" style="align-items:flex-start">' + a.desc + '</div>' +
      '</div>'
    ).join('');

    $all('#quickActions [data-modal]').forEach((c) => c.addEventListener('click', () => App.openModal('modal-add')));
    $all('#quickActions [data-href]:not([data-modal])').forEach((c) => {
      const href = c.getAttribute('data-href');
      if (href && href !== '#') c.addEventListener('click', () => { window.location.href = href; });
    });
    FX.initTilt($('#quickActions'));
  }

  /* ---------- recent ---------- */
  function statusBadge(status) {
    const map = { live: 'success', pending: 'warning', draft: 'neutral' };
    return '<span class="badge ' + (map[status] || 'neutral') + '"><span class="dot"></span>' + status + '</span>';
  }
  function timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'just now';
    const m = Math.floor(sec / 60); if (m < 60) return m + 'm ago';
    const hh = Math.floor(m / 60); if (hh < 24) return hh + 'h ago';
    const d = Math.floor(hh / 24); return d + 'd ago';
  }
  function renderRecent() {
    const subs = SubManga.getSubdomains().slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    const wrap = $('#recentWrap');
    if (!subs.length) {
      wrap.innerHTML = '<div class="empty-state">' + App.icons.globe +
        '<h3>No subdomains yet</h3><p>Add your first subdomain to get started.</p>' +
        '<button class="btn btn-primary magnetic" data-empty-add>+ Add subdomain</button></div>';
      wrap.querySelector('[data-empty-add]').addEventListener('click', () => App.openModal('modal-add'));
      FX.initTilt(wrap);
      return;
    }
    wrap.innerHTML =
      '<table>' +
      '<thead><tr><th>Subdomain</th><th>Project</th><th>Status</th><th>GitHub repo</th><th>Added</th></tr></thead>' +
      '<tbody>' + subs.map((s) =>
        '<tr>' +
          '<td class="domain-cell">' + App.esc(s.name + '.' + SubManga.getDomain()) + '</td>' +
          '<td>' + App.esc(s.project || '—') + '</td>' +
          '<td>' + statusBadge(s.status) + '</td>' +
          '<td style="font-family:var(--font-code);font-size:12.5px;color:var(--muted-fg)">' + App.esc(s.repo || '—') + '</td>' +
          '<td class="sub-desc">' + timeAgo(s.createdAt) + '</td>' +
        '</tr>'
      ).join('') +
      '</tbody></table>';
  }

  /* ---------- quick add form ---------- */
  $('#quickAddForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#quickName').value;
    if (!name) { App.toast('Please enter a subdomain name', 'error'); return; }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(name)) { App.toast('Invalid name — use letters, numbers, hyphens', 'error'); return; }
    if (SubManga.findSubdomain(name)) { App.toast('This subdomain already exists', 'error'); return; }
    const repo = $('#quickRepo').value;
    SubManga.addSubdomain({
      name: name, project: $('#quickProject').value, repo: repo,
      status: 'draft', desc: '',
    });

    const domain = SubManga.getDomain();

    /* try to create DNS record on Cloudflare */
    if (Cloudflare.configured() && repo) {
      const ghUser = repo.split('/')[0].trim();
      if (ghUser) {
        const target = ghUser + '.github.io';
        try {
          const res = await Cloudflare.createRecord({
            type: 'CNAME',
            name: name,
            content: target,
            ttl: 1,
            proxied: true,
          });
          if (res.success) {
            SubManga.updateSubdomain(SubManga.findSubdomain(name).id, { status: 'live' });
            App.toast(name + '.' + domain + ' → Cloudflare mein ban gaya!', 'success');
          } else {
            App.toast(name + '.' + domain + ' → Cloudflare mein nahi bana!', 'error');
          }
        } catch (err) {
          App.toast('Cloudflare mein nahi bana: ' + err.message, 'error');
        }
      } else {
        App.toast(name + '.' + domain + ' added (Cloudflare ke liye repo mein username daalo)', 'warning');
      }
    } else if (!Cloudflare.configured()) {
      App.toast(name + '.' + domain + ' added (Cloudflare configured nahi hai)', 'warning');
    } else {
      App.toast(name + '.' + domain + ' added', 'success');
    }

    App.closeModal('modal-add');
    e.target.reset();
    renderStats();
    renderRecent();
  });

  /* open-add triggers */
  $all('[data-open-add]').forEach((b) => b.addEventListener('click', () => App.openModal('modal-add')));

  /* modal close */
  $all('[data-close]').forEach((b) => b.addEventListener('click', () => App.closeModal(b.getAttribute('data-close'))));
  $all('.modal-backdrop').forEach((bd) => bd.addEventListener('click', (e) => {
    if (e.target === bd) bd.classList.remove('open');
  }));

  function setPrefix() { $('#quickPrefix').textContent = '.' + SubManga.getDomain(); }
  setPrefix();

  renderHero();
  renderStats();
  renderQuickActions();
  renderRecent();

  /* boot fx */
  FX.init({ links: true, onReady() { FX.initReveals(); FX.initTilt(); } });
})();
