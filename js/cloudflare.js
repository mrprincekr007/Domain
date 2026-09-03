/* ============================================================
   SUBMANGA - Cloudflare API module (via Worker proxy)
   Uses a Cloudflare Worker to bypass CORS restrictions.
   Token is stored in Worker environment (safe).
   ============================================================ */

const Cloudflare = (() => {
  let _workerUrl = '';
  let _zoneId = '';
  let _domain = '';

  function configure(opts) {
    _workerUrl = (opts.workerUrl || '').replace(/\/+$/, '');
    _zoneId = opts.zoneId || '';
    _domain = opts.domain || '';
    localStorage.setItem('cf_worker', _workerUrl);
    localStorage.setItem('cf_zone', _zoneId);
  }

  function load() {
    _workerUrl = localStorage.getItem('cf_worker') || '';
    _zoneId = localStorage.getItem('cf_zone') || '';
    _domain = SubManga.getDomain();
    return { workerUrl: _workerUrl, zoneId: _zoneId, domain: _domain };
  }

  function configured() { return !!_workerUrl && !!_zoneId; }

  async function apiCall(path) {
    if (!_workerUrl) throw new Error('Worker URL not configured');
    const url = _workerUrl + '?path=' + encodeURIComponent(path) + '&zoneId=' + _zoneId;
    const r = await fetch(url);
    return await r.json();
  }

  /* ---------- DNS record CRUD ---------- */

  async function createRecord(opts) {
    const body = JSON.stringify({
      type: opts.type || 'CNAME',
      name: opts.name + '.' + _domain,
      content: opts.content,
      ttl: opts.ttl || 1,
      proxied: opts.proxied !== undefined ? opts.proxied : true,
    });
    const url = _workerUrl + '?path=' + encodeURIComponent('/zones/' + _zoneId + '/dns_records') + '&zoneId=' + _zoneId;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await r.json();
    return { success: data.success, errors: data.errors || [], result: data.result };
  }

  async function getRecords(type) {
    let path = '/zones/' + _zoneId + '/dns_records?per_page=100';
    if (type) path += '&type=' + type;
    const data = await apiCall(path);
    return { ok: data.success, records: data.result || [] };
  }

  async function deleteRecord(recordId) {
    const url = _workerUrl + '?path=' + encodeURIComponent('/zones/' + _zoneId + '/dns_records/' + recordId) + '&zoneId=' + _zoneId;
    const r = await fetch(url, { method: 'DELETE' });
    const data = await r.json();
    return { success: data.success };
  }

  /* ---------- Test connection ---------- */

  async function testConnection() {
    const data = await apiCall('/user/tokens/verify');
    return { ok: data.success, status: data.result ? data.result.status : 'unknown' };
  }

  return { configure, load, configured, createRecord, getRecords, deleteRecord, testConnection };
})();
