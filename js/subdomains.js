/* ============================================================
   SUBMANGA - Subdomains manager page
   ============================================================ */

(() => {
  Auth.init();
  App.init('subdomains');
  const $ = App.$;
  const $all = App.$all;
  Cloudflare.load();

  $('#searchIcon').innerHTML = App.icons.search;
  setIcon();

  $('#domainLabel').textContent = SubManga.getDomain();

  function setIcon() {
    document.querySelectorAll('[data-theme-icon]').forEach((el) => {
      el.innerHTML = App.getTheme() === 'dark' ? App.icons.sun : App.icons.moon;
    });
  }

  const state = { filter: 'all', query: '', sort: 'new', editingId: null, deleteId: null };

  function setPrefix() {
    $('#prefix').textContent = '.' + SubManga.getDomain();
    const fp = $('#formPrice');
    if (fp) fp.textContent = state.editingId ? 'Editing is free.' : 'New subdomain: ' + SubManga.getPrice() + ' credits.';
  }
  setPrefix();

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

  function filtered() {
    const list = SubManga.getSubdomains().filter((s) => {
      const f = state.filter;
      if (f !== 'all' && s.status !== f) return false;
      if (state.query) {
        const q = state.query.toLowerCase();
        const hay = (s.name + ' ' + s.project + ' ' + (s.repo || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (state.sort === 'old') list.sort((a, b) => a.createdAt - b.createdAt);
    else if (state.sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (state.sort === 'za') list.sort((a, b) => b.name.localeCompare(a.name));
    else list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }

  function render() {
    const list = filtered();
    const total = SubManga.getSubdomains().length;
    $('#resultCount').textContent = 'Showing ' + list.length + ' of ' + total + ' subdomains';
    $('#resultTitle').textContent = state.filter === 'all' ? 'All subdomains' : state.filter + ' subdomains';

    const wrap = $('#listWrap');
    if (!list.length) {
      const filtering = state.query || state.filter !== 'all';
      wrap.innerHTML =
        '<div class="empty-state">' + App.icons.globe +
        '<h3>' + (filtering ? 'No matches found' : 'No subdomains yet') + '</h3>' +
        '<p>' + (filtering ? 'Try a different search or clear filters.' : 'Create your first subdomain to start building websites.') + '</p>' +
        (filtering
          ? '<button class="btn btn-ghost" onclick="location.reload()">Clear filters</button>'
          : '<button class="btn btn-primary" data-add>+ Add subdomain</button>') +
        '</div>';
      const addBtn = wrap.querySelector('[data-add]');
      if (addBtn) addBtn.addEventListener('click', openAdd);
      const clearBtn = wrap.querySelector('.btn-ghost');
      if (clearBtn) clearBtn.addEventListener('click', clearFilters);
      return;
    }

    // cards view on mobile, table on desktop
    wrap.innerHTML =
      '<div class="table-wrap reveal" style="display:none" data-table></div>' +
      '<div class="sub-grid stagger" data-cards></div>';

    // Table
    $('#listWrap [data-table]').innerHTML =
      '<table>' +
      '<thead><tr><th>Subdomain</th><th>Project</th><th>GitHub repo</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>' +
      '<tbody>' + list.map((s) =>
        '<tr>' +
          '<td class="domain-cell">' + App.esc(s.name + '.' + SubManga.getDomain()) + '</td>' +
          '<td>' + App.esc(s.project || '—') + '</td>' +
          '<td style="font-family:var(--font-code);font-size:12.5px;color:var(--muted-fg)">' + App.esc(s.repo || '—') + '</td>' +
          '<td>' + statusBadge(s.status) + '</td>' +
          '<td><div class="row-actions">' +
            '<button class="icon-btn" data-check="' + App.esc(s.name) + '" data-health-ui style="width:34px;height:34px" aria-label="Check DNS" title="Check DNS">' + App.icons.refresh + '</button>' +
            '<button class="icon-btn" data-copy="' + App.esc(s.name) + '" style="width:34px;height:34px" aria-label="Copy URL" title="Copy URL">' + App.icons.copy + '</button>' +
            '<button class="icon-btn" data-open="' + App.esc(s.name) + '" style="width:34px;height:34px" aria-label="Open site" title="Open site">' + App.icons.external + '</button>' +
            '<button class="icon-btn" data-edit="' + s.id + '" style="width:34px;height:34px" aria-label="Edit">' + App.icons.edit + '</button>' +
            '<button class="icon-btn" data-del="' + s.id + '" style="width:34px;height:34px;color:var(--destructive)" aria-label="Delete">' + App.icons.trash + '</button>' +
          '</div></td>' +
        '</tr>'
      ).join('') +
      '</tbody></table>';

    // Cards
    $('#listWrap [data-cards]').innerHTML = list.map((s) =>
      '<div class="card hoverable sub-card tilt">' +
        '<div class="sheen"></div>' +
        '<div class="sub-card-top"><div>' +
          '<div class="sub-domain">' + App.esc(s.name + '.' + SubManga.getDomain()) + '</div>' +
          '<div class="sub-project">' + App.esc(s.project || 'Untitled project') + '</div>' +
        '</div>' + statusBadge(s.status) + '</div>' +
        (s.desc ? '<div class="sub-desc" style="align-items:flex-start">' + s.desc + '</div>' : '') +
        (s.repo ? '<div class="sub-desc">' + App.icons.git + '<span style="font-family:var(--font-code);font-size:12px">' + App.esc(s.repo) + '</span></div>' : '') +
        '<div class="sub-meta"><span class="badge neutral">' + timeAgo(s.createdAt) + '</span></div>' +
        '<div class="sub-card-actions" style="flex-wrap:wrap">' +
          '<button class="btn btn-sm" data-check="' + App.esc(s.name) + '" data-health-ui>Check</button>' +
          '<button class="btn btn-sm" data-copy="' + App.esc(s.name) + '">Copy</button>' +
          '<button class="btn btn-sm" data-open="' + App.esc(s.name) + '">Open</button>' +
          '<button class="btn btn-sm" data-edit="' + s.id + '">Edit</button>' +
          '<button class="btn btn-sm btn-danger" data-del="' + s.id + '">Delete</button>' +
        '</div>' +
      '</div>'
    ).join('');

    bindRowActions();
    hideHealthUI($('#listWrap'));
    FX.initTilt($('#listWrap [data-cards]'));
    FX.initReveals($('#listWrap'));

    // responsive: show table on desktop, cards on mobile
    function applyResponsive() {
      const isDesktop = window.innerWidth >= 1024;
      $('#listWrap [data-table]').style.display = isDesktop ? 'block' : 'none';
      $('#listWrap [data-cards]').style.display = isDesktop ? 'none' : 'grid';
    }
    applyResponsive();
    window.addEventListener('resize', applyResponsive);
  }

  function bindRowActions() {
    $all('[data-edit]').forEach((b) => b.addEventListener('click', () => openEdit(b.getAttribute('data-edit'))));
    $all('[data-del]').forEach((b) => b.addEventListener('click', () => openDelete(b.getAttribute('data-del'))));
  }

  /* row utility actions — delegated so re-renders keep working */
  function healthOn() {
    try {
      const u = JSON.parse(localStorage.getItem('submanga.usercontrol') || '{}');
      return u.showHealth !== false;
    } catch (e) { return true; }
  }
  function hideHealthUI(root) {
    if (healthOn()) return;
    $all('[data-health-ui]', root).forEach((el) => { el.style.display = 'none'; });
  }
  async function checkDnsByName(name, btn) {
    const domain = SubManga.getDomain();
    const fqdn = name + '.' + domain;
    if (btn) btn.disabled = true;
    try {
      const r = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=CNAME');
      const data = await r.json();
      let target = '';
      if (data.Answer && data.Answer.length) target = data.Answer[0].data;
      else {
        const r2 = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(fqdn) + '&type=A');
        const d2 = await r2.json();
        if (d2.Answer && d2.Answer.length) target = d2.Answer[0].data;
      }
      if (target) {
        const sub = SubManga.findSubdomain(name);
        if (sub) SubManga.updateSubdomain(sub.id, { status: 'live' });
        App.toast(fqdn + ' is LIVE! (' + target + ')', 'success');
        render();
      } else {
        App.toast(name + ' — DNS not propagated yet. Wait 5-15 min.', 'warning');
      }
    } catch (e) {
      App.toast('Check failed: ' + e.message, 'error');
    }
    if (btn) btn.disabled = false;
  }
  document.getElementById('listWrap').addEventListener('click', (e) => {
    const chk = e.target.closest('[data-check]');
    if (chk) { checkDnsByName(chk.getAttribute('data-check'), chk); return; }
    const cpy = e.target.closest('[data-copy]');
    if (cpy) { const n = cpy.getAttribute('data-copy'); App.copyText('https://' + n + '.' + SubManga.getDomain(), n); return; }
    const opn = e.target.closest('[data-open]');
    if (opn) { window.open('https://' + opn.getAttribute('data-open') + '.' + SubManga.getDomain(), '_blank'); }
  });

  function openAdd() {
    try {
      var uctl = JSON.parse(localStorage.getItem('submanga.usercontrol') || '{}');
      if (uctl.allowCreate === false) { App.toast('Admin has disabled new subdomain creation', 'error'); return; }
    } catch (e) { /* ignore */ }
    state.editingId = null;
    $('#formTitle').textContent = 'Add subdomain';
    $('#formSubmit').textContent = 'Add subdomain';
    $('#editId').value = '';
    $('#subForm').reset();
    setPrefix();
    App.openModal('modal-form');
    $('#fName').focus();
  }

  function openEdit(id) {
    const s = SubManga.getSubdomains().find((x) => x.id === id);
    if (!s) return;
    state.editingId = id;
    $('#formTitle').textContent = 'Edit subdomain';
    $('#formSubmit').textContent = 'Save changes';
    $('#editId').value = id;
    $('#fName').value = s.name;
    $('#fProject').value = s.project || '';
    $('#fRepo').value = s.repo || '';
    $('#fStatus').value = s.status || 'draft';
    $('#fDesc').value = s.desc || '';
    setPrefix();
    App.openModal('modal-form');
    $('#fName').focus();
  }

  function openDelete(id) {
    const s = SubManga.getSubdomains().find((x) => x.id === id);
    if (!s) return;
    state.deleteId = id;
    $('#delName').textContent = s.name + '.' + SubManga.getDomain();
    App.openModal('modal-delete');
  }

  /* ---------- events ---------- */
  $('#addBtn').addEventListener('click', openAdd);
  document.getElementById('listWrap').addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) openAdd();
  });

  $('#search').addEventListener('input', (e) => { state.query = e.target.value; render(); });
  $('#filterStatus').addEventListener('change', (e) => { state.filter = e.target.value; render(); });
  $('#sortBy').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  $('#clearFilters').addEventListener('click', clearFilters);

  function clearFilters() {
    state.query = ''; state.filter = 'all'; state.sort = 'new';
    $('#search').value = ''; $('#filterStatus').value = 'all'; $('#sortBy').value = 'new';
    render();
  }

  $('#subForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#fName').value;
    if (!name) { App.toast('Please enter a subdomain name', 'error'); return; }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(name)) {
      App.toast('Invalid name — use letters, numbers, hyphens', 'error'); return;
    }
    const existing = SubManga.findSubdomain(name);
    if (existing && existing.id !== state.editingId) {
      App.toast('This subdomain already exists', 'error'); return;
    }
    const data = {
      name, project: $('#fProject').value, repo: $('#fRepo').value,
      status: $('#fStatus').value, desc: $('#fDesc').value,
    };

    /* save to app first */
    if (state.editingId) {
      SubManga.updateSubdomain(state.editingId, data);
      App.toast('Subdomain updated', 'success');
    } else {
      /* buy gate: login + credits (editing is free, new buys are paid) */
      const gate = Auth.canBuy();
      if (!gate.ok && gate.reason === 'login') { App.toast('Please login first to buy', 'error'); window.location.href = 'login.html'; return; }
      if (!gate.ok) { App.toast('Not enough credits — need ' + gate.need + ' more. Add funds.', 'error'); window.location.href = 'funds.html'; return; }
      const domain0 = SubManga.getDomain();
      const charged = await Auth.charge(gate.price, 'Buy: ' + name + '.' + domain0);
      if (!charged) { App.toast('Payment failed. Please add funds.', 'error'); window.location.href = 'funds.html'; return; }
      App.refreshWalletPill();
      SubManga.addSubdomain(data);

      /* try to create DNS record on Cloudflare */
      if (Cloudflare.configured() && data.repo) {
        const ghUser = data.repo.split('/')[0].trim();
        if (ghUser) {
          const target = ghUser + '.github.io';
          const domain = SubManga.getDomain();
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
              App.toast(name + '.' + domain + ' → created on Cloudflare!', 'success');
            } else {
              App.toast(name + '.' + domain + ' → failed on Cloudflare!', 'error');
            }
          } catch (err) {
            App.toast('Cloudflare failed: ' + err.message, 'error');
          }
        } else {
          App.toast('Subdomain added (add username in repo for Cloudflare)', 'warning');
        }
      } else if (!Cloudflare.configured()) {
        App.toast('Subdomain added (Cloudflare is not configured)', 'warning');
      } else {
        App.toast('Subdomain added', 'success');
      }
    }

    App.closeModal('modal-form');
    render();
  });

  $('#confirmDelete').addEventListener('click', () => {
    if (state.deleteId) {
      SubManga.deleteSubdomain(state.deleteId);
      App.toast('Subdomain deleted', 'success');
    }
    App.closeModal('modal-delete');
    render();
  });

  /* modal close */
  $all('[data-close]').forEach((b) => b.addEventListener('click', () => App.closeModal(b.getAttribute('data-close'))));
  $all('.modal-backdrop').forEach((bd) => bd.addEventListener('click', (e) => {
    if (e.target === bd) bd.classList.remove('open');
  }));

  render();
  FX.init({ links: true, onReady() { FX.initReveals(); } });
})();
