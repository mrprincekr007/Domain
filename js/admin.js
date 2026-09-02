/* ============================================================
   SUBMANGA - Admin Panel
   ============================================================ */

(() => {
  App.init('admin');
  const $ = App.$;
  const $all = App.$all;

  document.querySelectorAll('[data-theme-switch]').forEach((b) => b.addEventListener('click', App.toggleTheme));
  setIcon();
  function setIcon() {
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.innerHTML = App.getTheme() === 'dark' ? App.icons.sun : App.icons.moon;
    });
  }

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
  if (['overview', 'zone', 'health', 'bulk', 'activity'].includes(hash)) {
    activateTab(hash);
  }

  /* ---------- OVERVIEW ---------- */
  function renderOverview() {
    const subs = SubManga.getSubdomains();
    const live = subs.filter((s) => s.status === 'live').length;
    const pending = subs.filter((s) => s.status === 'pending').length;
    const drafts = subs.filter((s) => s.status === 'draft').length;
    const domain = SubManga.getDomain();
    const cfConfigured = Cloudflare.configured();

    const stats = [
      { label: 'Total Subdomains', value: subs.length, icon: App.icons.globe, c1:'#38bdf8', c2:'#818cf8', tint:'rgba(56,189,248,0.14)', note: domain },
      { label: 'Live', value: live, icon: App.icons.check, c1:'#34d399', c2:'#22d3ee', tint:'rgba(52,211,153,0.14)', note: 'DNS active' },
      { label: 'Pending', value: pending, icon: App.icons.clock, c1:'#fbbf24', c2:'#fb923c', tint:'rgba(251,191,36,0.14)', note: 'waiting deploy' },
      { label: 'Drafts', value: drafts, icon: App.icons.pencil, c1:'#c084fc', c2:'#e879f9', tint:'rgba(192,132,252,0.14)', note: 'not published' },
    ];

    $('#adminStats').innerHTML = stats.map((s) =>
      '<div class="card stat-card tilt" style="--stat-c1:' + s.c1 + ';--stat-c2:' + s.c2 + ';--stat-tint:' + s.tint + '">' +
        '<div class="sheen"></div>' +
        '<div class="stat-icon">' + s.icon + '</div>' +
        '<div class="stat-value" data-counter="' + s.value + '">0</div>' +
        '<div class="stat-label">' + s.label + '</div>' +
        '<div class="stat-note">' + s.note + '</div>' +
      '</div>'
    ).join('');

    /* animate counters */
    $all('#adminStats [data-counter]').forEach((v) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            FX.animateCounter(en.target, +en.target.dataset.counter);
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      io.observe(v);
    });

    /* system info */
    const log = SubManga.getActivityLog();
    $('#systemInfo').innerHTML =
      '<div style="display:flex;flex-direction:column;gap:8px">' +
        '<div><strong>Domain:</strong> ' + App.esc(domain) + '</div>' +
        '<div><strong>Cloudflare:</strong> ' + (cfConfigured ? '<span style="color:var(--accent)">Connected</span>' : '<span style="color:var(--warning)">Not configured</span>') + '</div>' +
        '<div><strong>Firebase:</strong> ' + (window.FirebaseSync && FirebaseSync.ready ? '<span style="color:var(--accent)">Connected</span>' : '<span style="color:var(--faint)">Offline</span>') + '</div>' +
        '<div><strong>Total Actions:</strong> ' + log.length + '</div>' +
        '<div><strong>Storage:</strong> ' + Math.round(JSON.stringify(localStorage).length / 1024) + ' KB</div>' +
      '</div>';

    /* recent activity */
    const recent = log.slice(0, 8);
    $('#recentActivity').innerHTML = recent.length
      ? recent.map((l) =>
          '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' +
            '<span style="color:var(--c1);font-size:12px;white-space:nowrap">' + timeAgo(l.time) + '</span>' +
            '<span style="flex:1;font-size:13px">' + App.esc(l.detail) + '</span>' +
          '</div>'
        ).join('')
      : '<div style="color:var(--muted-fg);padding:12px 0">Koi activity nahi abhi.</div>';

    /* status breakdown */
    const statuses = [
      { label: 'Live', count: live, color: 'var(--accent)', bg: 'rgba(52,211,153,0.1)' },
      { label: 'Pending', count: pending, color: 'var(--warning)', bg: 'rgba(251,191,36,0.1)' },
      { label: 'Draft', count: drafts, color: 'var(--muted-fg)', bg: 'var(--muted)' },
    ];
    $('#statusBreakdown').innerHTML = statuses.map((s) =>
      '<div style="padding:16px;border-radius:12px;background:' + s.bg + ';border:1px solid var(--border)">' +
        '<div style="font-size:28px;font-weight:800;font-family:var(--font-display);color:' + s.color + '">' + s.count + '</div>' +
        '<div style="font-size:13px;color:var(--muted-fg);margin-top:4px">' + s.label + '</div>' +
      '</div>'
    ).join('');

    FX.initTilt($('#adminStats'));
  }

  /* ---------- CLOUDFLARE ZONE ---------- */
  let zoneRecords = [];
  async function loadZoneRecords() {
    if (!Cloudflare.configured()) {
      $('#zoneNotConfigured').style.display = 'block';
      $('#zoneRecords').style.display = 'none';
      return;
    }
    $('#zoneNotConfigured').style.display = 'none';
    $('#zoneRecords').style.display = 'block';
    $('#zoneTable').innerHTML = '<div style="color:var(--muted-fg);padding:12px 0">Loading records...</div>';
    try {
      const res = await Cloudflare.getRecords();
      if (res.ok) {
        zoneRecords = res.records;
        renderZoneRecords();
      } else {
        $('#zoneTable').innerHTML = '<div style="color:var(--destructive);padding:12px 0">Records load nahi ho paye.</div>';
      }
    } catch (e) {
      $('#zoneTable').innerHTML = '<div style="color:var(--destructive);padding:12px 0">Error: ' + App.esc(e.message) + '</div>';
    }
  }

  function renderZoneRecords() {
    const filter = $('#zoneFilter').value;
    const filtered = filter === 'all' ? zoneRecords : zoneRecords.filter((r) => r.type === filter);
    $('#zoneCount').textContent = filtered.length + ' of ' + zoneRecords.length + ' records';

    if (!filtered.length) {
      $('#zoneTable').innerHTML = '<div style="color:var(--muted-fg);padding:12px 0">No records found.</div>';
      return;
    }

    $('#zoneTable').innerHTML =
      '<div class="table-wrap">' +
      '<table>' +
      '<thead><tr><th>Type</th><th>Name</th><th>Content</th><th>TTL</th><th>Proxied</th><th>Actions</th></tr></thead>' +
      '<tbody>' + filtered.map((r) =>
        '<tr>' +
          '<td><span class="badge info">' + App.esc(r.type) + '</span></td>' +
          '<td style="font-family:var(--font-code);font-size:13px;color:var(--c1)">' + App.esc(r.name) + '</td>' +
          '<td style="font-family:var(--font-code);font-size:13px">' + App.esc(r.content) + '</td>' +
          '<td>' + (r.ttl === 1 ? 'Auto' : r.ttl) + '</td>' +
          '<td>' + (r.proxied ? 'Yes' : 'No') + '</td>' +
          '<td><button class="btn btn-sm btn-danger" data-del-zone="' + r.id + '">Delete</button></td>' +
        '</tr>'
      ).join('') +
      '</tbody></table></div>';

    $all('[data-del-zone]').forEach((btn) => btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del-zone');
      if (!confirm('Ye DNS record delete karna chahte ho?')) return;
      btn.disabled = true;
      btn.textContent = '...';
      try {
        const res = await Cloudflare.deleteRecord(id);
        if (res.success) {
          App.toast('DNS record deleted', 'success');
          SubManga.logActivity('zone_delete', 'Deleted DNS record: ' + id);
          loadZoneRecords();
        } else {
          App.toast('Delete failed', 'error');
        }
      } catch (e) {
        App.toast('Error: ' + e.message, 'error');
      }
      btn.disabled = false;
      btn.textContent = 'Delete';
    }));
  }

  $('#refreshZone').addEventListener('click', loadZoneRecords);
  $('#zoneFilter').addEventListener('change', renderZoneRecords);

  /* ---------- HEALTH CHECK ---------- */
  async function checkHealth(name) {
    const domain = SubManga.getDomain();
    const fqdn = name + '.' + domain;
    try {
      const r = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=CNAME');
      const data = await r.json();
      if (data.Answer && data.Answer.length) {
        return { status: 'live', target: data.Answer[0].data };
      }
      const r2 = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=A');
      const d2 = await r2.json();
      if (d2.Answer && d2.Answer.length) {
        return { status: 'live', target: d2.Answer[0].data };
      }
      return { status: 'down', target: '' };
    } catch (e) {
      return { status: 'error', target: e.message };
    }
  }

  $('#checkAllHealth').addEventListener('click', async () => {
    const subs = SubManga.getSubdomains();
    if (!subs.length) { App.toast('Koi subdomain nahi hai', 'error'); return; }
    $('#healthResults').innerHTML = '<div style="color:var(--muted-fg);padding:12px 0">Checking ' + subs.length + ' subdomains...</div>';
    const results = [];
    for (const s of subs) {
      const h = await checkHealth(s.name);
      results.push({ ...s, health: h });
    }
    renderHealthResults(results);
  });

  function renderHealthResults(results) {
    if (!results.length) {
      $('#healthResults').innerHTML = '<div style="color:var(--muted-fg);padding:12px 0">Pehle "Check All" dabao.</div>';
      return;
    }
    $('#healthResults').innerHTML = results.map((r) =>
      '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;background:var(--card)">' +
        '<span style="width:10px;height:10px;border-radius:50%;flex-shrink:0;background:' +
          (r.health.status === 'live' ? 'var(--accent)' : r.health.status === 'down' ? 'var(--destructive)' : 'var(--warning)') +
        ';box-shadow:0 0 8px ' + (r.health.status === 'live' ? 'var(--accent)' : 'transparent') + '"></span>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-family:var(--font-code);font-size:13px;font-weight:600;color:var(--c1)">' + App.esc(r.name + '.' + SubManga.getDomain()) + '</div>' +
          '<div style="font-size:12px;color:var(--muted-fg);margin-top:2px">' +
            (r.health.status === 'live' ? 'Resolves → ' + App.esc(r.health.target) : r.health.status === 'down' ? 'DNS not found' : r.health.target) +
          '</div>' +
        '</div>' +
        '<span class="badge ' + (r.health.status === 'live' ? 'success' : r.health.status === 'down' ? 'danger' : 'warning') + '">' + r.health.status + '</span>' +
      '</div>'
    ).join('');
  }

  $('#clearHealth').addEventListener('click', () => { $('#healthResults').innerHTML = ''; });

  /* ---------- BULK OPERATIONS ---------- */
  let selectedIds = new Set();

  function renderBulkList() {
    const subs = SubManga.getSubdomains();
    if (!subs.length) {
      $('#bulkList').innerHTML = '<div style="color:var(--muted-fg);padding:12px 0">Koi subdomain nahi hai.</div>';
      return;
    }
    $('#bulkList').innerHTML = subs.map((s) =>
      '<label style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;background:var(--card);cursor:pointer">' +
        '<input type="checkbox" data-bulk-id="' + s.id + '"' + (selectedIds.has(s.id) ? ' checked' : '') + ' style="width:18px;height:18px;accent-color:var(--c2)">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-family:var(--font-code);font-size:13px;font-weight:600;color:var(--c1)">' + App.esc(s.name + '.' + SubManga.getDomain()) + '</div>' +
          '<div style="font-size:12px;color:var(--muted-fg)">' + App.esc(s.repo || 'No repo') + '</div>' +
        '</div>' +
        '<span class="badge ' + (s.status === 'live' ? 'success' : s.status === 'pending' ? 'warning' : 'neutral') + '">' + s.status + '</span>' +
      '</label>'
    ).join('');

    $all('[data-bulk-id]').forEach((cb) => cb.addEventListener('change', () => {
      const id = cb.getAttribute('data-bulk-id');
      if (cb.checked) selectedIds.add(id); else selectedIds.delete(id);
      updateBulkButtons();
    }));
  }

  function updateBulkButtons() {
    const n = selectedIds.size;
    $('#selectedCount').textContent = n + ' selected';
    $('#bulkDeploy').disabled = n === 0;
    $('#bulkCheck').disabled = n === 0;
    $('#bulkDelete').disabled = n === 0;
  }

  $('#selectAll').addEventListener('click', () => {
    const subs = SubManga.getSubdomains();
    subs.forEach((s) => selectedIds.add(s.id));
    renderBulkList();
    updateBulkButtons();
  });

  $('#deselectAll').addEventListener('click', () => {
    selectedIds.clear();
    renderBulkList();
    updateBulkButtons();
  });

  $('#bulkDeploy').addEventListener('click', async () => {
    if (!Cloudflare.configured()) { App.toast('Cloudflare configured nahi hai', 'error'); return; }
    const subs = SubManga.getSubdomains().filter((s) => selectedIds.has(s.id));
    let ok = 0, fail = 0;
    for (const s of subs) {
      const ghUser = s.repo ? s.repo.split('/')[0].trim() : '';
      if (!ghUser) { fail++; continue; }
      try {
        const res = await Cloudflare.createRecord({
          type: 'CNAME', name: s.name, content: ghUser + '.github.io', ttl: 1, proxied: true,
        });
        if (res.success) {
          SubManga.updateSubdomain(s.id, { status: 'live' });
          SubManga.logActivity('bulk_deploy', 'Deployed: ' + s.name + '.' + SubManga.getDomain());
          ok++;
        } else { fail++; }
      } catch (e) { fail++; }
    }
    App.toast(ok + ' deployed, ' + fail + ' failed', ok > 0 ? 'success' : 'error');
    renderBulkList();
  });

  $('#bulkCheck').addEventListener('click', async () => {
    const subs = SubManga.getSubdomains().filter((s) => selectedIds.has(s.id));
    const results = [];
    for (const s of subs) {
      const h = await checkHealth(s.name);
      results.push({ ...s, health: h });
    }
    activateTab('health');
    renderHealthResults(results);
  });

  $('#bulkDelete').addEventListener('click', () => {
    if (!confirm(selectedIds.size + ' subdomains delete karna chahte ho?')) return;
    selectedIds.forEach((id) => SubManga.deleteSubdomain(id));
    SubManga.logActivity('bulk_delete', 'Bulk deleted ' + selectedIds.size + ' subdomains');
    App.toast(selectedIds.size + ' subdomains deleted', 'success');
    selectedIds.clear();
    renderBulkList();
    updateBulkButtons();
  });

  /* ---------- ACTIVITY LOG ---------- */
  function renderActivityLog() {
    const log = SubManga.getActivityLog();
    $('#logCount').textContent = log.length + ' entries';
    if (!log.length) {
      $('#activityLog').innerHTML = '<div style="color:var(--muted-fg);padding:12px 0">Koi activity nahi abhi.</div>';
      return;
    }
    const actionIcons = {
      add: App.icons.plus,
      update: App.icons.edit,
      delete: App.icons.trash,
      zone_delete: App.icons.trash,
      bulk_deploy: App.icons.globe,
      bulk_delete: App.icons.trash,
    };
    const actionColors = {
      add: 'var(--accent)',
      update: 'var(--c2)',
      delete: 'var(--destructive)',
      zone_delete: 'var(--destructive)',
      bulk_deploy: 'var(--c1)',
      bulk_delete: 'var(--destructive)',
    };
    $('#activityLog').innerHTML = log.map((l) =>
      '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;background:var(--card)">' +
        '<span style="color:' + (actionColors[l.action] || 'var(--muted-fg)') + '">' + (actionIcons[l.action] || App.icons.info) + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:13px;font-weight:600">' + App.esc(l.detail || l.action) + '</div>' +
          '<div style="font-size:11px;color:var(--faint)">' + l.action + '</div>' +
        '</div>' +
        '<span style="font-size:12px;color:var(--faint);white-space:nowrap">' + timeAgo(l.time) + '</span>' +
      '</div>'
    ).join('');
  }

  $('#refreshLog').addEventListener('click', renderActivityLog);
  $('#clearLog').addEventListener('click', () => {
    if (!confirm('Saara activity log delete karna chahte ho?')) return;
    SubManga.clearActivityLog();
    renderActivityLog();
    App.toast('Activity log cleared', 'success');
  });

  /* ---------- helpers ---------- */
  function timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'abhi';
    const m = Math.floor(sec / 60); if (m < 60) return m + 'm ago';
    const hh = Math.floor(m / 60); if (hh < 24) return hh + 'h ago';
    const d = Math.floor(hh / 24); return d + 'd ago';
  }

  /* ---------- refresh ---------- */
  $('#refreshAll').addEventListener('click', () => {
    renderOverview();
    loadZoneRecords();
    renderBulkList();
    renderActivityLog();
    App.toast('Refreshed!', 'success');
  });

  /* ---------- init ---------- */
  renderOverview();
  loadZoneRecords();
  renderBulkList();
  renderHealthResults([]);
  renderActivityLog();

  FX.init({ links: true, onReady() { FX.initReveals(); FX.initTilt(); } });
})();
