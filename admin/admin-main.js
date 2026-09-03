/* ============================================================
   SUBMANGA ADMIN - Page router + 9 page modules
   Each HTML page sets <body data-admin-page="..."> and this
   file runs only that page's module. No cross-page errors.
   ============================================================ */

(function () {
  'use strict';
  /* shell renders immediately; page module runs after admin gate */
  var $ = AdminApp.$, $all = AdminApp.$all;
  var page = (document.body && document.body.getAttribute('data-admin-page')) || 'dashboard';

  var TITLES = {
    dashboard: ['Admin Dashboard', 'System overview'],
    subdomains: ['Subdomains', 'Add, edit, delete, search'],
    zone: ['Cloudflare Zone', 'Live DNS records'],
    health: ['Health Check', 'Live DNS status'],
    bulk: ['Bulk Operations', 'Batch actions'],
    analytics: ['Analytics', 'Charts and trends'],
    activity: ['Activity Log', 'Every action logged'],
    cfconfig: ['Cloudflare Config', 'Worker URL and Zone ID'],
    settings: ['System Settings', 'App configuration'],
    users: ['Users', 'Users and credits'],
  };

  var t = TITLES[page] || ['Admin', ''];
  AdminApp.renderLayout(page, t[0], t[1]);
  AdminApp.ensureSeeded();
  AdminApp.cfLoad();

  function onRefresh(fn) {
    var b = document.getElementById('refreshAll');
    if (b) b.addEventListener('click', fn);
  }

  /* ============================================================
     SHARED: DNS health via Google DoH
     ============================================================ */
  async function checkHealth(name) {
    var domain = AdminApp.getDomain();
    var fqdn = name + '.' + domain;
    try {
      var r = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=CNAME');
      var data = await r.json();
      if (data.Answer && data.Answer.length) return { status: 'live', target: data.Answer[0].data };
      var r2 = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=A');
      var d2 = await r2.json();
      if (d2.Answer && d2.Answer.length) return { status: 'live', target: d2.Answer[0].data };
      return { status: 'down', target: '' };
    } catch (e) { return { status: 'error', target: e.message }; }
  }

  function last30Days() {
    var out = [];
    for (var i = 29; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
  function last7Days() {
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(Date.now() - i * 86400000);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
  function shortDay(iso) { return iso.slice(8, 10) + '/' + iso.slice(5, 7); }

  /* ============================================================
     DASHBOARD — overview only
     ============================================================ */
  function initDashboard() {
    function render() {
      var subs = AdminApp.getSubdomains();
      var live = subs.filter(function (s) { return s.status === 'live'; }).length;
      var pending = subs.filter(function (s) { return s.status === 'pending'; }).length;
      var drafts = subs.filter(function (s) { return s.status === 'draft'; }).length;
      var domain = AdminApp.getDomain();
      var stats = [
        { label: 'Total Subdomains', value: subs.length, icon: 'globe', c1: '#38bdf8', c2: '#818cf8', tint: 'rgba(56,189,248,0.14)', note: domain },
        { label: 'Live', value: live, icon: 'check', c1: '#34d399', c2: '#22d3ee', tint: 'rgba(52,211,153,0.14)', note: 'DNS active' },
        { label: 'Pending', value: pending, icon: 'clock', c1: '#fbbf24', c2: '#fb923c', tint: 'rgba(251,191,36,0.14)', note: 'waiting deploy' },
        { label: 'Drafts', value: drafts, icon: 'edit', c1: '#c084fc', c2: '#e879f9', tint: 'rgba(192,132,252,0.14)', note: 'not published' },
      ];
      document.getElementById('adminStats').innerHTML = stats.map(function (s) {
        return '<div class="card stat-card" style="--stat-c1:' + s.c1 + ';--stat-c2:' + s.c2 + ';--stat-tint:' + s.tint + '">' +
          '<div class="sheen"></div><div class="stat-icon">' + AdminApp.icons[s.icon] + '</div>' +
          '<div class="stat-value" data-counter="' + s.value + '">0</div>' +
          '<div class="stat-label">' + s.label + '</div><div class="stat-note">' + AdminApp.esc(s.note) + '</div></div>';
      }).join('');
      $all('#adminStats [data-counter]').forEach(function (v) { AdminApp.animateCounter(v, +v.getAttribute('data-counter')); });

      var log = AdminApp.getActivityLog();
      var cfOk = AdminApp.cfConfigured();
      document.getElementById('systemInfo').innerHTML =
        '<div style="display:flex;flex-direction:column;gap:7px">' +
        '<div><strong>Domain:</strong> ' + AdminApp.esc(domain) + '</div>' +
        '<div><strong>Cloudflare:</strong> ' + (cfOk ? '<span style="color:var(--accent)">Connected</span>' : '<span style="color:var(--warning)">Not configured</span>') + '</div>' +
        '<div><strong>Total Actions:</strong> ' + log.length + '</div>' +
        '<div><strong>Storage:</strong> ' + Math.round(JSON.stringify(localStorage).length / 1024) + ' KB</div></div>';

      var recent = log.slice(0, 8);
      document.getElementById('recentActivity').innerHTML = recent.length
        ? recent.map(function (l) {
          return '<div style="display:flex;gap:9px;padding:7px 0;border-bottom:1px solid var(--border)">' +
            '<span style="color:var(--c1);font-size:11.5px;white-space:nowrap">' + AdminApp.timeAgo(l.time) + '</span>' +
            '<span style="flex:1;font-size:12.5px">' + AdminApp.esc(l.detail) + '</span></div>';
        }).join('')
        : '<div style="color:var(--muted-fg);padding:10px 0">No activity yet.<br><a href="subdomains.html" style="color:var(--c1);font-size:12.5px">Go to Subdomains →</a></div>';

      var statuses = [
        { label: 'Live', count: live, color: 'var(--accent)', bg: 'rgba(52,211,153,0.1)' },
        { label: 'Pending', count: pending, color: 'var(--warning)', bg: 'rgba(251,191,36,0.1)' },
        { label: 'Draft', count: drafts, color: 'var(--muted-fg)', bg: 'var(--muted)' },
      ];
      document.getElementById('statusBreakdown').innerHTML = statuses.map(function (s) {
        return '<div style="padding:14px;border-radius:11px;background:' + s.bg + ';border:1px solid var(--border)">' +
          '<div style="font-size:26px;font-weight:800;font-family:var(--font-display);color:' + s.color + '">' + s.count + '</div>' +
          '<div style="font-size:12.5px;color:var(--muted-fg);margin-top:3px">' + s.label + '</div></div>';
      }).join('');

      /* sparklines (cumulative growth reads as a real curve, not flat noise) */
      function drawSparks() {
        if (typeof AdminCharts === 'undefined') return;
        var days30 = last30Days();
        var cum = 0;
        var growth = days30.map(function (d) {
          cum += subs.filter(function (s) { return new Date(s.createdAt).toISOString().slice(0, 10) === d; }).length;
          return cum;
        });
        var sg = document.getElementById('sparkGrowth');
        if (sg) AdminCharts.drawSparkline(sg, growth, { color: '#38bdf8', height: 60 });
        var days7 = last7Days();
        var act = days7.map(function (d) {
          return log.filter(function (l) { return new Date(l.time).toISOString().slice(0, 10) === d; }).length;
        });
        var sa = document.getElementById('sparkActivity');
        if (sa) AdminCharts.drawSparkline(sa, act, { color: '#818cf8', height: 60 });
      }
      drawSparks();
      window.__adminRedrawCharts = drawSparks;
    }
    render();
    onRefresh(function () { render(); AdminApp.notify('Refreshed!', 'success'); });
    if (AdminApp.getPrefs().autoRefresh) setInterval(render, 60000);
  }

  /* ============================================================
     SUBDOMAINS — full CRUD
     ============================================================ */
  function initSubdomains() {
    var state = { query: '', filter: 'all', sort: 'new', editingId: null, deleteId: null };
    function setPrefix() { document.getElementById('prefix').textContent = '.' + AdminApp.getDomain(); }
    setPrefix();

    function filtered() {
      var list = AdminApp.getSubdomains().filter(function (s) {
        if (state.filter !== 'all' && s.status !== state.filter) return false;
        if (state.query) {
          var q = state.query.toLowerCase();
          var hay = (s.name + ' ' + (s.project || '') + ' ' + (s.repo || '')).toLowerCase();
          if (hay.indexOf(q) === -1) return false;
        }
        return true;
      });
      if (state.sort === 'new') list.sort(function (a, b) { return b.createdAt - a.createdAt; });
      else if (state.sort === 'old') list.sort(function (a, b) { return a.createdAt - b.createdAt; });
      else if (state.sort === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      else if (state.sort === 'za') list.sort(function (a, b) { return b.name.localeCompare(a.name); });
      return list;
    }

    function render() {
      var list = filtered();
      var total = AdminApp.getSubdomains().length;
      document.getElementById('resultCount').textContent = 'Showing ' + list.length + ' of ' + total + ' subdomains';
      var domain = AdminApp.getDomain();
      var isDesktop = window.innerWidth >= 1024;
      var tw = document.getElementById('subTableWrap');
      var cw = document.getElementById('subCardsWrap');
      if (!list.length) {
        tw.innerHTML = '<div class="empty-state">' + AdminApp.icons.globe + '<h3>No subdomains</h3><p>Click Add to create your first subdomain.</p></div>';
        tw.style.display = 'block'; cw.style.display = 'none';
        return;
      }
      tw.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Subdomain</th><th>Project</th><th>Repo</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>' +
        list.map(function (s) {
          return '<tr><td class="domain-cell">' + AdminApp.esc(s.name + '.' + domain) + '</td>' +
            '<td>' + AdminApp.esc(s.project || '—') + '</td>' +
            '<td style="font-family:var(--font-code);font-size:12.5px;color:var(--muted-fg)">' + AdminApp.esc(s.repo || '—') + '</td>' +
            '<td>' + AdminApp.statusBadge(s.status) + '</td>' +
            '<td><div class="row-actions"><button class="btn btn-sm" data-edit="' + s.id + '">Edit</button>' +
            '<button class="btn btn-sm btn-danger" data-del="' + s.id + '">Delete</button></div></td></tr>';
        }).join('') + '</tbody></table></div>';
      cw.innerHTML = list.map(function (s) {
        return '<div class="card hoverable" style="display:flex;flex-direction:column;gap:10px">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div class="domain-cell" style="font-size:14px">' + AdminApp.esc(s.name + '.' + domain) + '</div>' + AdminApp.statusBadge(s.status) + '</div>' +
          '<div style="font-size:14px;font-weight:600">' + AdminApp.esc(s.project || 'Untitled') + '</div>' +
          (s.repo ? '<div style="font-family:var(--font-code);font-size:12px;color:var(--muted-fg)">' + AdminApp.esc(s.repo) + '</div>' : '') +
          '<div style="display:flex;gap:8px;margin-top:auto"><button class="btn btn-sm" data-edit="' + s.id + '">Edit</button>' +
          '<button class="btn btn-sm btn-danger" data-del="' + s.id + '">Delete</button></div></div>';
      }).join('');
      tw.style.display = isDesktop ? 'block' : 'none';
      cw.style.display = isDesktop ? 'none' : 'grid';
      $all('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { openEdit(b.getAttribute('data-edit')); }); });
      $all('[data-del]').forEach(function (b) { b.addEventListener('click', function () { openDelete(b.getAttribute('data-del')); }); });
    }

    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    function openAdd() {
      state.editingId = null;
      document.getElementById('formTitle').textContent = 'Add subdomain';
      document.getElementById('formSubmit').textContent = 'Add subdomain';
      document.getElementById('editId').value = '';
      document.getElementById('subForm').reset();
      setPrefix();
      openModal('modal-form');
    }
    function openEdit(id) {
      var s = AdminApp.getSubdomains().find(function (x) { return x.id === id; });
      if (!s) return;
      state.editingId = id;
      document.getElementById('formTitle').textContent = 'Edit subdomain';
      document.getElementById('formSubmit').textContent = 'Save changes';
      document.getElementById('editId').value = id;
      document.getElementById('fName').value = s.name;
      document.getElementById('fProject').value = s.project || '';
      document.getElementById('fRepo').value = s.repo || '';
      document.getElementById('fStatus').value = s.status || 'draft';
      document.getElementById('fDesc').value = s.desc || '';
      setPrefix();
      openModal('modal-form');
    }
    function openDelete(id) {
      var s = AdminApp.getSubdomains().find(function (x) { return x.id === id; });
      if (!s) return;
      state.deleteId = id;
      document.getElementById('delName').textContent = s.name + '.' + AdminApp.getDomain();
      openModal('modal-delete');
    }

    document.getElementById('subAdd').addEventListener('click', openAdd);
    var deb = null;
    document.getElementById('subSearch').addEventListener('input', function (e) {
      clearTimeout(deb);
      deb = setTimeout(function () { state.query = e.target.value; render(); }, 250);
    });
    document.getElementById('subFilter').addEventListener('change', function (e) { state.filter = e.target.value; render(); });
    document.getElementById('subSort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
    window.addEventListener('resize', render);

    document.getElementById('subForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim().toLowerCase();
      if (!name) { AdminApp.notify('Enter a subdomain name', 'error'); return; }
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(name)) { AdminApp.notify('Invalid name', 'error'); return; }
      var existing = AdminApp.findSubdomain(name);
      if (existing && existing.id !== state.editingId) { AdminApp.notify('Ye subdomain already hai', 'error'); return; }
      var data = {
        name: name,
        project: document.getElementById('fProject').value,
        repo: document.getElementById('fRepo').value,
        status: document.getElementById('fStatus').value,
        desc: document.getElementById('fDesc').value,
      };
      if (state.editingId) {
        AdminApp.updateSubdomain(state.editingId, data);
        AdminApp.notify('Subdomain updated', 'success');
      } else {
        AdminApp.addSubdomain(data);
        if (AdminApp.cfConfigured() && data.repo) {
          var ghUser = data.repo.split('/')[0].trim();
          if (ghUser) {
            try {
              var res = await AdminApp.cfCreateRecord({ type: 'CNAME', name: name, content: ghUser + '.github.io', ttl: 1, proxied: true });
              if (res.success) {
                var created = AdminApp.findSubdomain(name);
                if (created) AdminApp.updateSubdomain(created.id, { status: 'live' });
                AdminApp.notify(name + '.' + AdminApp.getDomain() + ' → created on Cloudflare!', 'success');
              } else { AdminApp.notify(name + ' → failed on Cloudflare!', 'error'); }
            } catch (err) { AdminApp.notify('Cloudflare failed: ' + err.message, 'error'); }
          } else { AdminApp.notify('Subdomain added (add username in repo for Cloudflare)', 'success'); }
        } else { AdminApp.notify('Subdomain added', 'success'); }
      }
      closeModal('modal-form');
      render();
    });

    document.getElementById('confirmDelete').addEventListener('click', function () {
      if (state.deleteId) { AdminApp.deleteSubdomain(state.deleteId); AdminApp.notify('Subdomain deleted', 'success'); }
      closeModal('modal-delete');
      render();
    });
    $all('[data-close]').forEach(function (b) { b.addEventListener('click', function () { closeModal(b.getAttribute('data-close')); }); });
    $all('.modal-backdrop').forEach(function (bd) { bd.addEventListener('click', function (e) { if (e.target === bd) bd.classList.remove('open'); }); });

    render();
    onRefresh(function () { render(); AdminApp.notify('Refreshed!', 'success'); });
  }

  /* ============================================================
     ZONE — DNS records + bulk delete
     ============================================================ */
  function initZone() {
    var zoneRecords = [];
    var selected = {};
    var query = '';

    function load() {
      if (!AdminApp.cfConfigured()) {
        document.getElementById('zoneNotConfigured').style.display = 'block';
        document.getElementById('zoneRecords').style.display = 'none';
        return;
      }
      document.getElementById('zoneNotConfigured').style.display = 'none';
      document.getElementById('zoneRecords').style.display = 'block';
      document.getElementById('zoneTable').innerHTML = '<div class="skeleton" style="height:120px"></div>';
      AdminApp.cfGetRecords().then(function (res) {
        if (res.ok) { zoneRecords = res.records; selected = {}; render(); }
        else { document.getElementById('zoneTable').innerHTML = '<div style="color:var(--destructive);padding:10px 0">Could not load records.</div>'; }
      }).catch(function (e) {
        document.getElementById('zoneTable').innerHTML = '<div style="color:var(--destructive);padding:10px 0">Error: ' + AdminApp.esc(e.message) + '</div>';
      });
    }

    function render() {
      var filter = document.getElementById('zoneFilter').value;
      var filtered = zoneRecords.filter(function (r) {
        if (filter !== 'all' && r.type !== filter) return false;
        if (query) {
          var hay = ((r.name || '') + ' ' + (r.content || '')).toLowerCase();
          if (hay.indexOf(query.toLowerCase()) === -1) return false;
        }
        return true;
      });
      var selCount = Object.keys(selected).filter(function (k) { return selected[k]; }).length;
      document.getElementById('zoneCount').textContent = filtered.length + ' of ' + zoneRecords.length + ' records';
      document.getElementById('zoneDeleteSel').disabled = selCount === 0;
      document.getElementById('zoneDeleteSel').textContent = selCount ? 'Delete selected (' + selCount + ')' : 'Delete selected';
      if (!filtered.length) { document.getElementById('zoneTable').innerHTML = '<div style="color:var(--muted-fg);padding:10px 0">No records found.</div>'; return; }
      document.getElementById('zoneTable').innerHTML =
        '<div class="table-wrap"><table><thead><tr><th><input type="checkbox" id="zoneAll" style="width:16px;height:16px;accent-color:var(--c2)"></th><th>Type</th><th>Name</th><th>Content</th><th>TTL</th><th>Proxied</th><th style="text-align:right">Actions</th></tr></thead><tbody>' +
        filtered.map(function (r) {
          return '<tr><td><input type="checkbox" data-zone-sel="' + r.id + '"' + (selected[r.id] ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:var(--c2)"></td>' +
            '<td><span class="badge info">' + AdminApp.esc(r.type) + '</span></td>' +
            '<td style="font-family:var(--font-code);font-size:12.5px;color:var(--c1)">' + AdminApp.esc(r.name) + '</td>' +
            '<td style="font-family:var(--font-code);font-size:12.5px">' + AdminApp.esc(r.content) + '</td>' +
            '<td>' + (r.ttl === 1 ? 'Auto' : r.ttl) + '</td>' +
            '<td>' + (r.proxied ? 'Yes' : 'No') + '</td>' +
            '<td><div class="row-actions"><button class="btn btn-sm btn-danger" data-del-zone="' + r.id + '">Del</button></div></td></tr>';
        }).join('') + '</tbody></table></div>';
      var all = document.getElementById('zoneAll');
      if (all) all.addEventListener('change', function () {
        filtered.forEach(function (r) { selected[r.id] = all.checked; });
        render();
      });
      $all('[data-zone-sel]').forEach(function (cb) {
        cb.addEventListener('change', function () { selected[cb.getAttribute('data-zone-sel')] = cb.checked; render(); });
      });
      $all('[data-del-zone]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var id = btn.getAttribute('data-del-zone');
          if (!confirm('Delete this DNS record?')) return;
          btn.disabled = true; btn.textContent = '...';
          try {
            var res = await AdminApp.cfDeleteRecord(id);
            if (res.success) { AdminApp.notify('DNS record deleted', 'success'); AdminApp.logActivity('zone_delete', 'Deleted DNS record: ' + id); delete selected[id]; load(); }
            else { AdminApp.notify('Delete failed', 'error'); btn.disabled = false; btn.textContent = 'Del'; }
          } catch (e) { AdminApp.notify('Error: ' + e.message, 'error'); btn.disabled = false; btn.textContent = 'Del'; }
        });
      });
    }

    document.getElementById('refreshZone').addEventListener('click', load);
    document.getElementById('zoneFilter').addEventListener('change', render);
    var deb = null;
    document.getElementById('zoneSearch').addEventListener('input', function (e) {
      clearTimeout(deb);
      deb = setTimeout(function () { query = e.target.value; render(); }, 250);
    });
    document.getElementById('zoneDeleteSel').addEventListener('click', async function () {
      var ids = Object.keys(selected).filter(function (k) { return selected[k]; });
      if (!ids.length || !confirm('Delete ' + ids.length + ' DNS records?')) return;
      var ok = 0;
      for (var i = 0; i < ids.length; i++) {
        try {
          var res = await AdminApp.cfDeleteRecord(ids[i]);
          if (res.success) { ok++; delete selected[ids[i]]; }
        } catch (e) { /* continue */ }
      }
      AdminApp.logActivity('zone_delete', 'Bulk deleted ' + ok + ' DNS records');
      AdminApp.notify(ok + ' records deleted', ok ? 'success' : 'error');
      load();
    });

    load();
    onRefresh(function () { load(); AdminApp.notify('Refreshed!', 'success'); });
  }

  /* ============================================================
     HEALTH — progress + summary + export
     ============================================================ */
  var healthCache = [];
  function renderHealthResults(results) {
    healthCache = results;
    var box = document.getElementById('healthResults');
    var exp = document.getElementById('exportHealth');
    if (!results.length) { box.innerHTML = '<div style="color:var(--muted-fg);padding:10px 0">Press "Check All" first.</div>'; if (exp) exp.disabled = true; return; }
    var live = results.filter(function (r) { return r.health.status === 'live'; }).length;
    var down = results.filter(function (r) { return r.health.status === 'down'; }).length;
    var err = results.length - live - down;
    var sum = document.getElementById('healthSummary');
    if (sum) {
      sum.style.display = 'block';
      sum.innerHTML = '<span class="badge success">' + live + ' live</span> <span class="badge danger">' + down + ' down</span> <span class="badge warning">' + err + ' error</span>';
    }
    if (exp) exp.disabled = false;
    box.innerHTML = results.map(function (r) {
      var dot = r.health.status === 'live' ? 'live' : r.health.status === 'down' ? 'down' : 'error';
      var badge = r.health.status === 'live' ? 'success' : r.health.status === 'down' ? 'danger' : 'warning';
      var sub = r.sub ? r.sub : r;
      return '<div class="health-item"><span class="health-dot ' + dot + '"></span>' +
        '<div style="flex:1;min-width:0"><div style="font-family:var(--font-code);font-size:12.5px;font-weight:600;color:var(--c1)">' + AdminApp.esc(sub.name + '.' + AdminApp.getDomain()) + '</div>' +
        '<div style="font-size:11.5px;color:var(--muted-fg);margin-top:2px">' + (r.health.status === 'live' ? 'Resolves → ' + AdminApp.esc(r.health.target) : r.health.status === 'down' ? 'DNS not found' : AdminApp.esc(r.health.target)) + '</div></div>' +
        '<span class="badge ' + badge + '">' + r.health.status + '</span></div>';
    }).join('');
  }

  function initHealth() {
    /* results coming from the bulk page */
    try {
      var cached = sessionStorage.getItem('submanga.admin.healthResults');
      if (cached) { renderHealthResults(JSON.parse(cached)); sessionStorage.removeItem('submanga.admin.healthResults'); }
    } catch (e) { /* ignore */ }

    document.getElementById('checkAllHealth').addEventListener('click', async function () {
      var subs = AdminApp.getSubdomains();
      if (!subs.length) { AdminApp.notify('No subdomains yet', 'error'); return; }
      var prog = document.getElementById('healthProgress');
      var fill = document.getElementById('healthProgressFill');
      var label = document.getElementById('healthProgressLabel');
      prog.style.display = 'block';
      var results = [];
      for (var i = 0; i < subs.length; i++) {
        label.textContent = 'Checking ' + (i + 1) + '/' + subs.length + ' — ' + subs[i].name;
        fill.style.width = Math.round(((i + 1) / subs.length) * 100) + '%';
        var h = await checkHealth(subs[i].name);
        results.push({ sub: subs[i], health: h });
      }
      prog.style.display = 'none';
      renderHealthResults(results);
    });
    document.getElementById('clearHealth').addEventListener('click', function () {
      renderHealthResults([]);
      document.getElementById('healthSummary').style.display = 'none';
    });
    document.getElementById('exportHealth').addEventListener('click', function () {
      if (!healthCache.length) return;
      AdminApp.exportCSV('health-' + new Date().toISOString().slice(0, 10) + '.csv',
        [['subdomain', 'status', 'target']].concat(healthCache.map(function (r) {
          var sub = r.sub ? r.sub : r;
          return [sub.name + '.' + AdminApp.getDomain(), r.health.status, r.health.target];
        })));
      AdminApp.notify('Health report exported', 'success');
    });
    onRefresh(function () { AdminApp.notify('Refreshed!', 'success'); });
  }

  /* ============================================================
     BULK — progress + cross-page check
     ============================================================ */
  function initBulk() {
    var selectedIds = {};
    function list() { return AdminApp.getSubdomains(); }
    function render() {
      var subs = list();
      if (!subs.length) { document.getElementById('bulkList').innerHTML = '<div class="empty-state">' + AdminApp.icons.globe + '<h3>No subdomains</h3><p>Add some from the subdomains page first.</p></div>'; return; }
      document.getElementById('bulkList').innerHTML = subs.map(function (s) {
        return '<label class="bulk-item"><input type="checkbox" data-bulk-id="' + s.id + '"' + (selectedIds[s.id] ? ' checked' : '') + '>' +
          '<div style="flex:1;min-width:0"><div style="font-family:var(--font-code);font-size:12.5px;font-weight:600;color:var(--c1)">' + AdminApp.esc(s.name + '.' + AdminApp.getDomain()) + '</div>' +
          '<div style="font-size:11.5px;color:var(--muted-fg)">' + AdminApp.esc(s.repo || 'No repo') + '</div></div>' +
          AdminApp.statusBadge(s.status) + '</label>';
      }).join('');
      $all('[data-bulk-id]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var id = cb.getAttribute('data-bulk-id');
          if (cb.checked) selectedIds[id] = true; else delete selectedIds[id];
          updateBtns();
        });
      });
    }
    function selSubs() { return list().filter(function (s) { return selectedIds[s.id]; }); }
    function updateBtns() {
      var n = selSubs().length;
      document.getElementById('selectedCount').textContent = n + ' selected';
      document.getElementById('bulkDeploy').disabled = n === 0;
      document.getElementById('bulkCheck').disabled = n === 0;
      document.getElementById('bulkDelete').disabled = n === 0;
    }
    function progress(show, label, pct) {
      var p = document.getElementById('bulkProgress');
      p.style.display = show ? 'block' : 'none';
      if (label) document.getElementById('bulkProgressLabel').textContent = label;
      if (pct != null) document.getElementById('bulkProgressFill').style.width = pct + '%';
    }

    document.getElementById('selectAll').addEventListener('click', function () { list().forEach(function (s) { selectedIds[s.id] = true; }); render(); updateBtns(); });
    document.getElementById('deselectAll').addEventListener('click', function () { selectedIds = {}; render(); updateBtns(); });

    document.getElementById('bulkDeploy').addEventListener('click', async function () {
      if (!AdminApp.cfConfigured()) { AdminApp.notify('Cloudflare is not configured', 'error'); return; }
      var subs = selSubs();
      var ok = 0, fail = 0;
      for (var i = 0; i < subs.length; i++) {
        var s = subs[i];
        progress(true, 'Deploying ' + (i + 1) + '/' + subs.length + ' — ' + s.name, Math.round(((i + 1) / subs.length) * 100));
        var ghUser = s.repo ? s.repo.split('/')[0].trim() : '';
        if (!ghUser) { fail++; continue; }
        try {
          var res = await AdminApp.cfCreateRecord({ type: 'CNAME', name: s.name, content: ghUser + '.github.io', ttl: 1, proxied: true });
          if (res.success) { AdminApp.updateSubdomain(s.id, { status: 'live' }); AdminApp.logActivity('bulk_deploy', 'Deployed: ' + s.name + '.' + AdminApp.getDomain()); ok++; }
          else { fail++; }
        } catch (e) { fail++; }
      }
      progress(false);
      AdminApp.notify(ok + ' deployed, ' + fail + ' failed', ok ? 'success' : 'error');
      render();
    });
    document.getElementById('bulkCheck').addEventListener('click', async function () {
      var subs = selSubs();
      var results = [];
      for (var i = 0; i < subs.length; i++) {
        progress(true, 'Checking ' + (i + 1) + '/' + subs.length + ' — ' + subs[i].name, Math.round(((i + 1) / subs.length) * 100));
        var h = await checkHealth(subs[i].name);
        results.push({ sub: subs[i], health: h });
      }
      try { sessionStorage.setItem('submanga.admin.healthResults', JSON.stringify(results)); } catch (e) { /* ignore */ }
      window.location.href = 'health.html';
    });
    document.getElementById('bulkDelete').addEventListener('click', function () {
      var n = selSubs().length;
      if (!n || !confirm('Delete ' + n + ' subdomains?')) return;
      selSubs().forEach(function (s) { AdminApp.deleteSubdomain(s.id); });
      AdminApp.logActivity('bulk_delete', 'Bulk deleted ' + n + ' subdomains');
      AdminApp.notify(n + ' subdomains deleted', 'success');
      selectedIds = {}; render(); updateBtns();
    });

    render(); updateBtns();
    onRefresh(function () { render(); updateBtns(); AdminApp.notify('Refreshed!', 'success'); });
  }

  /* ============================================================
     ANALYTICS — charts
     ============================================================ */
  function initAnalytics() {
    var a = AdminApp.getAnalytics();
    var cards = [
      { label: 'Total Subdomains', value: a.total, icon: 'globe', c1: '#38bdf8', c2: '#818cf8', tint: 'rgba(56,189,248,0.14)', note: AdminApp.getDomain() },
      { label: 'Live', value: a.live, icon: 'check', c1: '#34d399', c2: '#22d3ee', tint: 'rgba(52,211,153,0.14)', note: 'DNS active' },
      { label: 'Total Actions', value: a.totalActions, icon: 'log', c1: '#fbbf24', c2: '#fb923c', tint: 'rgba(251,191,36,0.14)', note: 'avg ' + a.avgActions + '/day' },
      { label: 'Storage Used', value: a.storageKB, icon: 'chart', c1: '#c084fc', c2: '#e879f9', tint: 'rgba(192,132,252,0.14)', note: 'KB localStorage' },
    ];
    document.getElementById('analyticsStats').innerHTML = cards.map(function (s) {
      return '<div class="card stat-card" style="--stat-c1:' + s.c1 + ';--stat-c2:' + s.c2 + ';--stat-tint:' + s.tint + '">' +
        '<div class="sheen"></div><div class="stat-icon">' + AdminApp.icons[s.icon] + '</div>' +
        '<div class="stat-value" data-counter="' + s.value + '">0</div>' +
        '<div class="stat-label">' + s.label + '</div><div class="stat-note">' + AdminApp.esc(s.note) + '</div></div>';
    }).join('');
    $all('#analyticsStats [data-counter]').forEach(function (v) { AdminApp.animateCounter(v, +v.getAttribute('data-counter')); });

    function drawCharts() {
      if (typeof AdminCharts === 'undefined') return;
      var days30 = last30Days();
      var cum = 0;
      var growthVals = days30.map(function (d) {
        cum += a.subdomains.filter(function (s) { return new Date(s.createdAt).toISOString().slice(0, 10) === d; }).length;
        return cum;
      });
      var g = document.getElementById('chartGrowth');
      if (g) AdminCharts.drawLineChart(g, { labels: days30.map(shortDay), values: growthVals }, { height: 220 });

      var days7 = last7Days();
      var log = AdminApp.getActivityLog();
      var actVals = days7.map(function (d) {
        return log.filter(function (l) { return new Date(l.time).toISOString().slice(0, 10) === d; }).length;
      });
      var ac = document.getElementById('chartActivity');
      if (ac) AdminCharts.drawBarChart(ac, { labels: days7.map(shortDay), values: actVals }, { height: 220 });

      var dn = document.getElementById('chartDonut');
      if (dn) AdminCharts.drawDonutChart(dn, { segments: [
        { value: a.live, color: '#34d399', label: 'Live' },
        { value: a.pending, color: '#fbbf24', label: 'Pending' },
        { value: a.drafts, color: '#64748b', label: 'Draft' },
      ] }, { height: 220, centerLabel: 'total' });

      var types = Object.keys(a.actionsByType);
      var ab = document.getElementById('chartActions');
      if (ab) {
        if (types.length) {
          AdminCharts.drawBarChart(ab, {
            labels: types,
            values: types.map(function (k) { return a.actionsByType[k]; }),
          }, { height: 220 });
        } else {
          ab.parentElement.innerHTML = '<div style="color:var(--muted-fg);padding:20px 0">No activity yet.</div>';
        }
      }
    }
    drawCharts();
    window.__adminRedrawCharts = drawCharts;

    document.getElementById('topActive').innerHTML = a.mostActive.length
      ? a.mostActive.map(function (m, i) {
        return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">' +
          '<span style="font-family:var(--font-code);color:var(--faint);font-size:12px">#' + (i + 1) + '</span>' +
          '<span style="flex:1;font-family:var(--font-code);font-size:13px;color:var(--c1)">' + AdminApp.esc(m.name) + '</span>' +
          '<span class="badge info">' + m.count + ' actions</span></div>';
      }).join('')
      : '<div style="color:var(--muted-fg)">No activity yet.</div>';

    document.getElementById('timelineInfo').innerHTML =
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<div><strong>First activity:</strong> ' + AdminApp.formatDate(a.firstActivity) + '</div>' +
      '<div><strong>Last activity:</strong> ' + AdminApp.formatDate(a.lastActivity) + '</div>' +
      '<div><strong>Active days (30d):</strong> ' + a.growthDays + '</div>' +
      '<div><strong>Avg actions/day:</strong> ' + a.avgActions + '</div></div>';

    onRefresh(function () { window.location.reload(); });
  }

  /* ============================================================
     ACTIVITY — search + filter + pagination + export
     ============================================================ */
  function initActivity() {
    var state = { query: '', filter: 'all', page: 1 };
    var PER_PAGE = 15;

    function filtered() {
      return AdminApp.getActivityLog().filter(function (l) {
        if (state.filter !== 'all' && l.action !== state.filter) return false;
        if (state.query && (l.detail || '').toLowerCase().indexOf(state.query.toLowerCase()) === -1) return false;
        return true;
      });
    }
    function render() {
      var list = filtered();
      var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
      if (state.page > pages) state.page = pages;
      var slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
      document.getElementById('logCount').textContent = list.length + ' entries';
      var colors = { add: 'var(--accent)', update: 'var(--c2)', delete: 'var(--destructive)', zone_delete: 'var(--destructive)', bulk_deploy: 'var(--c1)', bulk_delete: 'var(--destructive)', settings: 'var(--c3)' };
      document.getElementById('activityLog').innerHTML = slice.length
        ? slice.map(function (l) {
          return '<div class="log-item"><span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:' + (colors[l.action] || 'var(--muted-fg)') + '"></span>' +
            '<div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:600">' + AdminApp.esc(l.detail || l.action) + '</div>' +
            '<div style="font-size:10.5px;color:var(--faint)">' + AdminApp.esc(l.action) + ' · ' + AdminApp.formatDate(l.time) + '</div></div>' +
            '<span style="font-size:11.5px;color:var(--faint);white-space:nowrap">' + AdminApp.timeAgo(l.time) + '</span></div>';
        }).join('')
        : '<div style="color:var(--muted-fg);padding:10px 0">No activity found.</div>';
      var pg = document.getElementById('logPages');
      pg.innerHTML = '';
      if (pages > 1) {
        for (var i = 1; i <= pages; i++) {
          (function (p) {
            var b = document.createElement('button');
            b.textContent = p;
            if (p === state.page) b.className = 'active';
            b.addEventListener('click', function () { state.page = p; render(); });
            pg.appendChild(b);
          })(i);
        }
      }
    }

    var deb = null;
    document.getElementById('logSearch').addEventListener('input', function (e) {
      clearTimeout(deb);
      deb = setTimeout(function () { state.query = e.target.value; state.page = 1; render(); }, 250);
    });
    document.getElementById('logFilter').addEventListener('change', function (e) { state.filter = e.target.value; state.page = 1; render(); });
    document.getElementById('refreshLog').addEventListener('click', render);
    document.getElementById('exportLog').addEventListener('click', function () {
      var list = filtered();
      if (!list.length) { AdminApp.notify('Nothing to export', 'error'); return; }
      AdminApp.exportCSV('activity-' + new Date().toISOString().slice(0, 10) + '.csv',
        [['time', 'action', 'detail']].concat(list.map(function (l) { return [new Date(l.time).toISOString(), l.action, l.detail]; })));
      AdminApp.notify('Activity log exported', 'success');
    });
    document.getElementById('clearLog').addEventListener('click', function () {
      if (!confirm('Clear the whole activity log?')) return;
      AdminApp.clearActivityLog(); render(); AdminApp.notify('Activity log cleared', 'success');
    });

    render();
    onRefresh(function () { render(); AdminApp.notify('Refreshed!', 'success'); });
  }

  /* ============================================================
     CFCONFIG — save/test/reset + quick deploy
     ============================================================ */
  function initCfconfig() {
    function paintConn() {
      var ok = AdminApp.cfConfigured();
      document.getElementById('connDot').style.background = ok ? 'var(--accent)' : 'var(--faint)';
      document.getElementById('connDot').style.boxShadow = ok ? '0 0 8px var(--accent)' : 'none';
      document.getElementById('connLabel').textContent = ok ? 'Configured — ready for deploy' : 'Not configured';
    }
    var cf = AdminApp.cfLoad();
    if (cf.workerUrl) document.getElementById('cfWorker').value = cf.workerUrl;
    if (cf.zoneId) document.getElementById('cfZone').value = cf.zoneId;
    paintConn();

    function status(msg) { var el = document.getElementById('cfStatus'); el.style.display = 'block'; el.textContent = msg; }

    document.getElementById('cfSave').addEventListener('click', function () {
      var worker = document.getElementById('cfWorker').value.trim().replace(/\/+$/, '');
      var zone = document.getElementById('cfZone').value.trim();
      if (!worker || !zone) { AdminApp.notify('Worker URL and Zone ID are both required', 'error'); return; }
      if (!/^https:\/\/.+\..+/.test(worker)) { AdminApp.notify('Worker URL must start with https', 'error'); return; }
      AdminApp.cfConfigure(worker, zone);
      AdminApp.logActivity('settings', 'Cloudflare config saved');
      AdminApp.notify('Config saved!', 'success');
      status('Saved — ready for deploy.');
      paintConn();
    });
    document.getElementById('cfTest').addEventListener('click', async function () {
      var worker = document.getElementById('cfWorker').value.trim().replace(/\/+$/, '');
      var zone = document.getElementById('cfZone').value.trim();
      if (!worker || !zone) { AdminApp.notify('Enter the Worker URL and Zone ID first', 'error'); return; }
      AdminApp.cfConfigure(worker, zone);
      status('Testing...');
      try {
        var res = await AdminApp.cfTestConnection();
        status(res.ok ? 'Connected! Token status: ' + res.status : 'Error — check the Worker deploy and env variable.');
        paintConn();
      } catch (e) { status('Network error — check the Worker URL'); }
    });
    document.getElementById('cfReset').addEventListener('click', function () {
      if (!confirm('Reset Cloudflare config?')) return;
      AdminApp.cfReset();
      document.getElementById('cfWorker').value = '';
      document.getElementById('cfZone').value = '';
      paintConn();
      status('Config cleared.');
    });

    document.getElementById('qdPrefix').textContent = '.' + AdminApp.getDomain();
    document.getElementById('qdDeploy').addEventListener('click', async function () {
      var name = document.getElementById('qdName').value.trim().toLowerCase();
      var gh = document.getElementById('qdGithub').value.trim();
      var out = document.getElementById('qdOutput');
      if (!name) { AdminApp.notify('Enter a subdomain name', 'error'); return; }
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(name)) { AdminApp.notify('Invalid name', 'error'); return; }
    if (!gh) { AdminApp.notify('Enter a GitHub username', 'error'); return; }
    if (!AdminApp.cfConfigured()) { AdminApp.notify('Save the Cloudflare config first', 'error'); return; }
      var domain = AdminApp.getDomain();
      var target = gh + '.github.io';
      var fqdn = name + '.' + domain;
      document.getElementById('qdResult').style.display = 'block';
      out.textContent = 'Deploying ' + fqdn + ' ...\n';
      var btn = document.getElementById('qdDeploy');
      btn.disabled = true; btn.textContent = 'Creating DNS record...';
      function log(m) { out.textContent += m + '\n'; }
      log('CNAME  ' + fqdn + '  →  ' + target); log('---');
      try {
        var res = await AdminApp.cfCreateRecord({ type: 'CNAME', name: name, content: target, ttl: 1, proxied: true });
        log('Response: ' + JSON.stringify(res, null, 2));
        if (res.success) {
        log('---'); log('SUCCESS! DNS record created on Cloudflare.');
        AdminApp.notify(fqdn + ' → created on Cloudflare!', 'success');
          if (!AdminApp.findSubdomain(name)) AdminApp.addSubdomain({ name: name, project: '', repo: gh, status: 'pending', desc: 'Deployed via Admin' });
        } else { log('---'); log('FAILED! ' + JSON.stringify(res.errors)); AdminApp.notify(fqdn + ' → failed on Cloudflare!', 'error'); }
      } catch (e) { log('EXCEPTION: ' + e.message); AdminApp.notify('Cloudflare failed: ' + e.message, 'error'); }
      btn.disabled = false; btn.textContent = 'Deploy to Cloudflare DNS';
    });

    onRefresh(function () { AdminApp.notify('Refreshed!', 'success'); });
  }

  /* ============================================================
     SETTINGS — general + prefs + user control + backup + danger
     ============================================================ */
  function initSettings() {
    var s = AdminApp.getSettings();
    document.getElementById('setDomain').value = s.domain || '';
    document.getElementById('setOwner').value = s.ownerName || '';
    document.getElementById('setDesc').value = s.defaultDesc || '';
    function preview() { document.getElementById('domainPreview').textContent = 'blog.' + (document.getElementById('setDomain').value.trim() || 'yourdomain.com'); }
    preview();
    document.getElementById('setDomain').addEventListener('input', preview);

    document.getElementById('saveGeneral').addEventListener('click', function () {
      var d = document.getElementById('setDomain').value.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
      if (!d) { AdminApp.notify('Enter a domain', 'error'); return; }
      if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(d)) { AdminApp.notify('Invalid domain format', 'error'); return; }
      AdminApp.saveSettings({ domain: d.toLowerCase(), ownerName: document.getElementById('setOwner').value.trim(), defaultDesc: document.getElementById('setDesc').value.trim() });
      AdminApp.notify('Settings saved: ' + d.toLowerCase(), 'success');
    });

    /* pricing */
    (function initPricing() {
      var s = {};
      try { s = JSON.parse(localStorage.getItem('submanga.settings') || '{}'); } catch (e) {}
      document.getElementById('setPrice').value = s.price != null ? s.price : 10;
      document.getElementById('setBonus').value = s.signupBonus != null ? s.signupBonus : 20;
    })();
    document.getElementById('savePricing').addEventListener('click', function () {
      var price = Math.max(0, Math.floor(Number(document.getElementById('setPrice').value)));
      var bonus = Math.max(0, Math.floor(Number(document.getElementById('setBonus').value)));
      if (isNaN(price) || isNaN(bonus)) { AdminApp.notify('Enter valid numbers', 'error'); return; }
      var s = {};
      try { s = JSON.parse(localStorage.getItem('submanga.settings') || '{}'); } catch (e) {}
      s.price = price;
      s.signupBonus = bonus;
      try { localStorage.setItem('submanga.settings', JSON.stringify(s)); } catch (e) {}
      if (window.FirebaseSync && FirebaseSync.saveSettings) {
        try { FirebaseSync.saveSettings(s); } catch (e) {}
      }
      AdminApp.logActivity('settings', 'Pricing updated: ' + price + ' credits/buy, bonus ' + bonus);
      AdminApp.notify('Pricing saved', 'success');
    });

    var prefs = AdminApp.getPrefs();
    document.getElementById('prefSuccess').checked = !!prefs.toastSuccess;
    document.getElementById('prefError').checked = !!prefs.toastError;
    document.getElementById('prefRefresh').checked = !!prefs.autoRefresh;
    ['prefSuccess', 'prefError', 'prefRefresh'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        AdminApp.savePrefs({
          toastSuccess: document.getElementById('prefSuccess').checked,
          toastError: document.getElementById('prefError').checked,
          autoRefresh: document.getElementById('prefRefresh').checked,
        });
        AdminApp.notify('Preferences saved', 'success');
      });
    });

    var uctl = AdminApp.getUserControl();
    document.getElementById('uctlCreate').checked = !!uctl.allowCreate;
    document.getElementById('uctlHealth').checked = !!uctl.showHealth;
    ['uctlCreate', 'uctlHealth'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        AdminApp.saveUserControl({
          allowCreate: document.getElementById('uctlCreate').checked,
          showHealth: document.getElementById('uctlHealth').checked,
        });
        AdminApp.notify('User panel control updated', 'success');
      });
    });

    document.getElementById('exportBtn').addEventListener('click', function () {
      var payload = { app: 'submanga', version: 1, exportedAt: new Date().toISOString(), settings: AdminApp.getSettings(), subdomains: AdminApp.getSubdomains() };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'submanga-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
      URL.revokeObjectURL(url);
      AdminApp.notify('Backup exported', 'success');
    });
    document.getElementById('importFile').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (data && data.app === 'submanga' && Array.isArray(data.subdomains)) {
            localStorage.setItem(AdminApp.KEYS.subs, JSON.stringify(data.subdomains));
            if (data.settings) AdminApp.saveSettings(data.settings);
            AdminApp.logActivity('settings', 'Backup imported (' + data.subdomains.length + ' subdomains)');
            AdminApp.notify('Backup imported', 'success');
            setTimeout(function () { window.location.reload(); }, 700);
          } else { AdminApp.notify('Invalid backup file', 'error'); }
        } catch (err) { AdminApp.notify('Could not parse file', 'error'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('clearLogBtn').addEventListener('click', function () {
      if (!confirm('Clear activity log?')) return;
      AdminApp.clearActivityLog(); AdminApp.notify('Activity log cleared', 'success');
    });
    document.getElementById('resetSettingsBtn').addEventListener('click', function () {
      if (!confirm('Reset settings to defaults?')) return;
      AdminApp.saveSettings({ domain: 'princehacks.online', ownerName: '', defaultDesc: '' });
      window.location.reload();
    });
    document.getElementById('clearSubsBtn').addEventListener('click', function () {
      if (!confirm('Delete ALL subdomains? Really?')) return;
      if (!confirm('Last warning — really delete ALL?')) return;
      localStorage.setItem(AdminApp.KEYS.subs, JSON.stringify([]));
      AdminApp.logActivity('bulk_delete', 'Deleted ALL subdomains from settings');
      AdminApp.notify('All subdomains deleted', 'success');
    });
    document.getElementById('resetAllBtn').addEventListener('click', function () {
      if (!confirm('Reset ALL app data? Sure?')) return;
      if (!confirm('Last warning — really reset EVERYTHING?')) return;
      [AdminApp.KEYS.subs, AdminApp.KEYS.settings, AdminApp.KEYS.theme, 'submanga.activity_log', 'cf_worker', 'cf_zone'].forEach(function (k) {
        try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      });
      AdminApp.notify('All data reset. Reloading...', 'success');
      setTimeout(function () { window.location.reload(); }, 800);
    });

    onRefresh(function () { window.location.reload(); });
  }

  /* ============================================================
     USERS — sab users + credits control
     ============================================================ */
  function initUsers() {
    var cache = [];
    var query = '';
    var statusFilter = 'all';
    var sortBy = 'new';
    var bulkCounts = {};
    var adminMap = {};
    function selfUid() {
      try {
        var me = AdminApp.getAdminUser();
        return (me && me.uid) || '';
      } catch (e) { return ''; }
    }

    function siteCount(u) {
      if (bulkCounts[u] !== undefined) return bulkCounts[u];
      try {
        var raw = localStorage.getItem('submanga.user.' + u + '.subdomains');
        if (raw !== null) return JSON.parse(raw).length;
      } catch (e) {}
      return 0;
    }

    async function load() {
      document.getElementById('usersTable').innerHTML = '<div class="skeleton" style="height:120px"></div>';
      var users = [];
      try { users = await Auth.listUsers(); } catch (e) { users = []; }
      try { adminMap = await AdminApp.getAdmins(); } catch (e) { adminMap = {}; }
      try {
        if (window.FirebaseSync && FirebaseSync.dbGet) {
          var all = await FirebaseSync.dbGet('submanga/users');
          if (all) Object.keys(all).forEach(function (k) {
            if (all[k] && Array.isArray(all[k].subdomains)) bulkCounts[k] = all[k].subdomains.length;
          });
        }
      } catch (e) {}
      cache = users;
      render();
    }

    function filtered() {
      var list = cache.filter(function (a) {
        if (statusFilter === 'active' && a.status === 'blocked') return false;
        if (statusFilter === 'blocked' && a.status !== 'blocked') return false;
        if (statusFilter === 'admin' && !adminMap[a.uid]) return false;
        if (!query) return true;
        var q = query.toLowerCase();
        return ((a.username || '') + ' ' + (a.display || '') + ' ' + (a.email || '')).toLowerCase().indexOf(q) !== -1;
      });
      if (sortBy === 'old') list.sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
      else if (sortBy === 'az') list.sort(function (a, b) { return String(a.username || '').localeCompare(String(b.username || '')); });
      else if (sortBy === 'credits') list.sort(function (a, b) { return (parseInt(b.credits, 10) || 0) - (parseInt(a.credits, 10) || 0); });
      else list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      return list;
    }

    function render() {
      var list = filtered();
      var totalCredits = cache.reduce(function (s, a) { return s + (parseInt(a.credits, 10) || 0); }, 0);
      var blocked = cache.filter(function (a) { return a.status === 'blocked'; }).length;
      var cards = [
        { label: 'Total Users', value: cache.length, icon: 'user', c1: '#38bdf8', c2: '#818cf8', tint: 'rgba(56,189,248,0.14)' },
        { label: 'Credits Issued', value: totalCredits, icon: 'check', c1: '#34d399', c2: '#22d3ee', tint: 'rgba(52,211,153,0.14)' },
        { label: 'Blocked', value: blocked, icon: 'lock', c1: '#f87171', c2: '#fb923c', tint: 'rgba(248,113,113,0.14)' },
      ];
      document.getElementById('userStats').innerHTML = cards.map(function (s) {
        return '<div class="card stat-card" style="--stat-c1:' + s.c1 + ';--stat-c2:' + s.c2 + ';--stat-tint:' + s.tint + '">' +
          '<div class="sheen"></div><div class="stat-icon">' + AdminApp.icons[s.icon] + '</div>' +
          '<div class="stat-value" data-counter="' + s.value + '">0</div>' +
          '<div class="stat-label">' + s.label + '</div></div>';
      }).join('');
      $all('#userStats [data-counter]').forEach(function (v) { AdminApp.animateCounter(v, +v.getAttribute('data-counter')); });

      document.getElementById('grantUser').innerHTML = cache.length
        ? cache.map(function (a) { return '<option value="' + AdminApp.esc(a.uid) + '">' + AdminApp.esc(a.display || a.username) + ' (' + AdminApp.esc(a.email || '') + ' — ' + (parseInt(a.credits, 10) || 0) + ')</option>'; }).join('')
        : '<option value="">No users</option>';

      document.getElementById('userCount').textContent = list.length + ' of ' + cache.length + ' users';
      if (!list.length) {
        document.getElementById('usersTable').innerHTML = '<div class="empty-state">' + AdminApp.icons.user +
          '<h3>No users</h3><p>Users appear here after registering in the user panel.</p></div>';
        return;
      }
      document.getElementById('usersTable').innerHTML =
        '<div class="table-wrap"><table><thead><tr><th>User</th><th>Joined</th><th>Credits</th><th>Sites</th><th>Last active</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>' +
        list.map(function (a) {
          var blockedNow = a.status === 'blocked';
          var isAdmin = !!adminMap[a.uid];
          var isSelf = a.uid && a.uid === selfUid();
          var initial = ((a.display || a.username || 'U') + '').trim().charAt(0).toUpperCase();
          var lastActive = a.lastLoginAt ? AdminApp.timeAgo(a.lastLoginAt) : 'never';
          return '<tr><td><div style="display:flex;align-items:center;gap:10px">' +
            '<div style="width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--brand-grad-2);color:#fff;font-weight:800;flex-shrink:0">' + AdminApp.esc(initial) + '</div>' +
            '<div><div style="font-weight:600;font-size:13.5px">' + AdminApp.esc(a.display || a.username) + '</div>' +
            '<div style="font-family:var(--font-code);font-size:11.5px;color:var(--muted-fg)">@' + AdminApp.esc(a.username || '?') + '</div>' +
            '<div style="font-size:11px;color:var(--faint)">' + AdminApp.esc(a.email || '') + '</div></div></div></td>' +
            '<td style="font-size:12.5px;color:var(--muted-fg)">' + AdminApp.formatDate(a.createdAt) + '</td>' +
            '<td><span class="badge info">' + (parseInt(a.credits, 10) || 0) + '</span></td>' +
            '<td>' + siteCount(a.uid) + '</td>' +
            '<td style="font-size:12.5px;color:var(--muted-fg);white-space:nowrap">' + lastActive + '</td>' +
            '<td><span class="badge ' + (blockedNow ? 'danger' : 'success') + '"><span class="dot"></span>' + (blockedNow ? 'blocked' : 'active') + '</span>' +
            (isAdmin ? ' <span class="badge info">admin</span>' : '') + '</td>' +
            '<td><div class="row-actions">' +
              '<button class="btn btn-sm" data-view="' + AdminApp.esc(a.uid) + '">View</button>' +
              '<button class="btn btn-sm" data-g50="' + AdminApp.esc(a.uid) + '">+50</button>' +
              (isAdmin
                ? (isSelf ? '' : '<button class="btn btn-sm btn-ghost" data-unadmin="' + AdminApp.esc(a.uid) + '" data-name="' + AdminApp.esc(a.display || a.username) + '">Remove admin</button>')
                : '<button class="btn btn-sm btn-ghost" data-makeadmin="' + AdminApp.esc(a.uid) + '" data-name="' + AdminApp.esc(a.display || a.username) + '">Make admin</button>') +
              (blockedNow
                ? '<button class="btn btn-sm btn-success" data-unblock="' + AdminApp.esc(a.uid) + '">Unblock</button>'
                : '<button class="btn btn-sm btn-ghost" data-block="' + AdminApp.esc(a.uid) + '" data-name="' + AdminApp.esc(a.display || a.username) + '">Block</button>') +
              '<button class="btn btn-sm btn-danger" data-deluser="' + AdminApp.esc(a.uid) + '" data-name="' + AdminApp.esc(a.display || a.username) + '">Del</button>' +
            '</div></td></tr>';
        }).join('') + '</tbody></table></div>';

      $all('[data-view]').forEach(function (b) { b.addEventListener('click', function () { openDetail(b.getAttribute('data-view')); }); });
      $all('[data-g50]').forEach(function (b) { b.addEventListener('click', async function () {
        b.disabled = true;
        var res = await Auth.adminAdjust(b.getAttribute('data-g50'), 50, 'Admin quick grant');
        AdminApp.notify(res.ok ? '+50 credits added' : (res.error || 'Failed'), res.ok ? 'success' : 'error');
        load();
      }); });
      $all('[data-block]').forEach(function (b) { b.addEventListener('click', async function () {
        if (!confirm((b.getAttribute('data-name') || 'This user') + ' will be blocked and unable to login. Continue?')) return;
        await Auth.setUserStatus(b.getAttribute('data-block'), 'blocked');
        AdminApp.notify('User blocked', 'success'); load();
      }); });
      $all('[data-unblock]').forEach(function (b) { b.addEventListener('click', async function () {
        await Auth.setUserStatus(b.getAttribute('data-unblock'), 'active');
        AdminApp.notify('User unblocked', 'success'); load();
      }); });
      $all('[data-makeadmin]').forEach(function (b) { b.addEventListener('click', async function () {
        var u = b.getAttribute('data-makeadmin');
        var nm = b.getAttribute('data-name') || u;
        if (!confirm(nm + ' will get full admin panel access. Continue?')) return;
        b.disabled = true;
        await AdminApp.setAdmin(u, true);
        AdminApp.logActivity('settings', 'Made admin: ' + nm);
        AdminApp.notify(nm + ' is now admin', 'success'); load();
      }); });
      $all('[data-unadmin]').forEach(function (b) { b.addEventListener('click', async function () {
        var u = b.getAttribute('data-unadmin');
        var nm = b.getAttribute('data-name') || u;
        if (!confirm('Remove admin access from ' + nm + '?')) return;
        b.disabled = true;
        await AdminApp.setAdmin(u, false);
        AdminApp.logActivity('settings', 'Removed admin: ' + nm);
        AdminApp.notify('Admin access removed', 'success'); load();
      }); });
      $all('[data-deluser]').forEach(function (b) { b.addEventListener('click', async function () {
        var u = b.getAttribute('data-deluser');
        var nm = b.getAttribute('data-name') || u;
        if (!confirm(nm + "'s account + all data will be deleted! Sure?")) return;
        if (!confirm('Last warning — really delete ' + nm + '?')) return;
        await Auth.deleteUser(u);
        AdminApp.logActivity('bulk_delete', 'Deleted user account: ' + u);
        AdminApp.notify('User deleted', 'success'); load();
      }); });
    }

    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    async function userSubdomains(id) {
      try {
        if (window.FirebaseSync && FirebaseSync.dbGet) {
          var remote = await FirebaseSync.dbGet('submanga/users/' + id + '/subdomains');
          if (Array.isArray(remote)) return remote;
        }
      } catch (e) {}
      try {
        var raw = localStorage.getItem('submanga.user.' + id + '.subdomains');
        if (raw) { var l = JSON.parse(raw); if (Array.isArray(l)) return l; }
      } catch (e) {}
      return [];
    }
    async function userTxns(id) {
      try {
        if (window.FirebaseSync && FirebaseSync.dbGet) {
          var remote = await FirebaseSync.dbGet('submanga/users/' + id + '/txns');
          if (Array.isArray(remote)) return remote;
        }
      } catch (e) {}
      try {
        var raw = localStorage.getItem('submanga.user.' + id + '.txns');
        if (raw) { var l = JSON.parse(raw); if (Array.isArray(l)) return l; }
      } catch (e) {}
      return [];
    }

    /* full user detail: info + sites + transactions + exact balance */
    async function openDetail(id) {
      var a = cache.find(function (x) { return x.uid === id; });
      if (!a) return;
      var domain = '';
      try { domain = AdminApp.getDomain(); } catch (e) {}
      document.getElementById('detailTitle').textContent = (a.display || a.username) + ' — details';
      document.getElementById('userDetailBody').innerHTML = '<div class="skeleton" style="height:140px"></div>';
      openModal('modal-user');
      var subs = await userSubdomains(id);
      var txns = await userTxns(id);
      var subHtml = subs.length
        ? subs.map(function (s) {
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' +
              '<div style="flex:1;min-width:0"><div style="font-family:var(--font-code);font-size:12.5px;color:var(--c1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + AdminApp.esc(s.name + (domain ? '.' + domain : '')) + '</div>' +
              '<div style="font-size:11px;color:var(--faint)">' + AdminApp.esc(s.repo || 'no repo') + '</div></div>' +
              AdminApp.statusBadge(s.status) + '</div>';
          }).join('')
        : '<div style="color:var(--muted-fg);font-size:13px;padding:8px 0">No subdomains.</div>';
      var txnHtml = txns.length
        ? txns.slice(0, 10).map(function (t) {
            return '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">' +
              '<span style="flex:1;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + AdminApp.esc(t.note || t.type) + '</span>' +
              '<span style="font-family:var(--font-code);font-size:12.5px;font-weight:700;color:' + (t.amount >= 0 ? 'var(--accent)' : 'var(--warning)') + '">' + (t.amount >= 0 ? '+' : '') + t.amount + '</span></div>';
          }).join('')
        : '<div style="color:var(--muted-fg);font-size:13px;padding:8px 0">No transactions.</div>';
      document.getElementById('userDetailBody').innerHTML =
        '<div class="grid-2" style="margin-bottom:14px">' +
          '<div><div style="font-size:11px;color:var(--faint)">Email</div><div style="font-size:13.5px;overflow:hidden;text-overflow:ellipsis">' + AdminApp.esc(a.email || '—') + '</div></div>' +
          '<div><div style="font-size:11px;color:var(--faint)">Username</div><div style="font-family:var(--font-code);font-size:13.5px">@' + AdminApp.esc(a.username || '?') + '</div></div>' +
          '<div><div style="font-size:11px;color:var(--faint)">Status</div><div style="font-size:13.5px">' + AdminApp.esc(a.status || 'active') + (adminMap[a.uid] ? ' · admin' : '') + '</div></div>' +
          '<div><div style="font-size:11px;color:var(--faint)">Joined</div><div style="font-size:13.5px">' + AdminApp.formatDate(a.createdAt) + '</div></div>' +
          '<div><div style="font-size:11px;color:var(--faint)">Last active</div><div style="font-size:13.5px">' + (a.lastLoginAt ? AdminApp.timeAgo(a.lastLoginAt) + ' (' + AdminApp.formatDate(a.lastLoginAt) + ')' : 'never') + '</div></div>' +
          '<div><div style="font-size:11px;color:var(--faint)">Sites</div><div style="font-size:13.5px">' + subs.length + '</div></div>' +
        '</div>' +
        '<div class="form-group"><label>Set exact balance (now ' + (parseInt(a.credits, 10) || 0) + ')</label>' +
        '<div style="display:flex;gap:8px"><input class="input" id="detailBalance" type="number" placeholder="e.g. 100"><button class="btn btn-primary btn-sm" id="detailSaveBal">Save</button></div></div>' +
        '<h4 style="margin:14px 0 6px;font-size:14px">Subdomains (' + subs.length + ')</h4>' + subHtml +
        '<h4 style="margin:14px 0 6px;font-size:14px">Recent transactions</h4>' + txnHtml;
      document.getElementById('detailSaveBal').addEventListener('click', async function () {
        var target = Math.max(0, Math.floor(Number(document.getElementById('detailBalance').value)));
        if (isNaN(target)) { AdminApp.notify('Enter a number', 'error'); return; }
        var cur = parseInt(a.credits, 10) || 0;
        var res = await Auth.adminAdjust(id, target - cur, 'Admin set balance');
        if (res.ok) {
          a.credits = target;
          AdminApp.logActivity('settings', 'Set balance @' + (a.username || id) + ' = ' + target);
          AdminApp.notify('Balance set to ' + target, 'success');
          render();
          openDetail(id);
        } else { AdminApp.notify(res.error || 'Failed', 'error'); }
      });
    }

    document.getElementById('grantForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var u = document.getElementById('grantUser').value;
      var amt = Math.floor(Number(document.getElementById('grantAmount').value));
      var note = document.getElementById('grantNote').value.trim() || 'Admin grant';
      if (!u) { AdminApp.notify('Select a user', 'error'); return; }
      if (!amt) { AdminApp.notify('Enter an amount (+/-)', 'error'); return; }
      var btn = document.getElementById('grantBtn');
      btn.disabled = true;
      var res = await Auth.adminAdjust(u, amt, note);
      if (res.ok) {
        AdminApp.logActivity('bulk_deploy', 'Grant ' + amt + ' credits to @' + u);
        AdminApp.notify(amt + ' credits → @' + u + ' (balance ' + res.balance + ')', 'success');
        document.getElementById('grantAmount').value = '';
        document.getElementById('grantNote').value = '';
      } else { AdminApp.notify(res.error || 'Failed', 'error'); }
      btn.disabled = false;
      load();
    });

    var deb = null;
    document.getElementById('userSearch').addEventListener('input', function (e) {
      clearTimeout(deb);
      deb = setTimeout(function () { query = e.target.value; render(); }, 250);
    });
    document.getElementById('userStatusFilter').addEventListener('change', function (e) { statusFilter = e.target.value; render(); });
    document.getElementById('userSort').addEventListener('change', function (e) { sortBy = e.target.value; render(); });
    document.getElementById('exportUsers').addEventListener('click', function () {
      var list = filtered();
      if (!list.length) { AdminApp.notify('Nothing to export', 'error'); return; }
      AdminApp.exportCSV('users-' + new Date().toISOString().slice(0, 10) + '.csv',
        [['username', 'email', 'display', 'credits', 'status', 'admin', 'sites', 'last_active', 'joined']].concat(list.map(function (x) {
          return [x.username, x.email, x.display, (parseInt(x.credits, 10) || 0), x.status, adminMap[x.uid] ? 'yes' : 'no', siteCount(x.uid),
            x.lastLoginAt ? new Date(x.lastLoginAt).toISOString() : '', x.createdAt ? new Date(x.createdAt).toISOString() : ''];
        })));
      AdminApp.notify('Users exported', 'success');
    });
    $all('[data-close]').forEach(function (b) { b.addEventListener('click', function () { closeModal(b.getAttribute('data-close')); }); });
    $all('.modal-backdrop').forEach(function (bd) { bd.addEventListener('click', function (e) { if (e.target === bd) bd.classList.remove('open'); }); });
    document.getElementById('refreshUsers').addEventListener('click', load);

    load();
    onRefresh(function () { load(); AdminApp.notify('Refreshed!', 'success'); });
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  var ROUTES = {
    dashboard: initDashboard,
    subdomains: initSubdomains,
    zone: initZone,
    health: initHealth,
    bulk: initBulk,
    users: initUsers,
    analytics: initAnalytics,
    activity: initActivity,
    cfconfig: initCfconfig,
    settings: initSettings,
  };
  AdminApp.requireAdmin().then(function (u) {
    if (!u) { window.location.href = 'admin-login.html'; return; }
    if (ROUTES[page]) ROUTES[page]();
  });

  /* charts stay correct after CSS/fonts arrive late or window resizes */
  window.__adminRedrawCharts = window.__adminRedrawCharts || null;
  window.addEventListener('load', function () {
    if (typeof window.__adminRedrawCharts === 'function') window.__adminRedrawCharts();
  });
  var __rzT = null;
  window.addEventListener('resize', function () {
    clearTimeout(__rzT);
    __rzT = setTimeout(function () {
      if (typeof window.__adminRedrawCharts === 'function') window.__adminRedrawCharts();
    }, 250);
  });
})();
