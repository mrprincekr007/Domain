/* SUBMANGA - Wallet page (login required) */
(() => {
  Auth.init();
  if (!Auth.current()) { window.location.href = 'login.html'; return; }
  App.init('wallet');
  const $ = App.$;
  const $all = App.$all;

  function timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return 'just now';
    const m = Math.floor(sec / 60); if (m < 60) return m + 'm ago';
    const hh = Math.floor(m / 60); if (hh < 24) return hh + 'h ago';
    return Math.floor(hh / 24) + 'd ago';
  }

  function render() {
    $('#walletBalance').textContent = Auth.credits();
    try { $('#walletPrice').textContent = SubManga.getPrice(); } catch (e) {}
    App.refreshWalletPill();
    const txns = Auth.getTxns();
    if (!txns.length) {
      $('#txnList').innerHTML = '<div style="color:var(--muted-fg);font-size:14px;padding:10px 0">No transactions yet.</div>';
      return;
    }
    const typeColor = { topup: 'success', bonus: 'success', grant: 'success', buy: 'warning', deduct: 'danger' };
    $('#txnList').innerHTML = txns.slice(0, 20).map((t) =>
      '<div style="display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--border)">' +
        '<span class="badge ' + (typeColor[t.type] || 'neutral') + '">' + App.esc(t.type) + '</span>' +
        '<div style="flex:1;min-width:0"><div style="font-size:13px">' + App.esc(t.note || t.type) + '</div>' +
        '<div style="font-size:11.5px;color:var(--faint)">' + timeAgo(t.time) + '</div></div>' +
        '<div style="font-family:var(--font-code);font-size:14px;font-weight:700;color:' + (t.amount >= 0 ? 'var(--accent)' : 'var(--warning)') + '">' +
          (t.amount >= 0 ? '+' : '') + t.amount + '</div>' +
      '</div>'
    ).join('');
  }

  $all('#quickAmounts [data-amt]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    const res = await Auth.addFunds(parseInt(b.getAttribute('data-amt'), 10), 'Quick top-up');
    if (res.ok) App.toast(res.balance + ' credits available', 'success');
    else App.toast(res.error || 'Failed', 'error');
    b.disabled = false;
    render();
  }));

  $('#fundForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await Auth.addFunds($('#fundAmount').value, 'Manual top-up');
    if (res.ok) {
      App.toast(res.balance + ' credits available', 'success');
      $('#fundAmount').value = '';
    } else {
      App.toast(res.error || 'Failed', 'error');
    }
    render();
  });

  (async () => {
    await Auth.refreshAccount();
    render();
  })();
  render();

  FX.init({ links: true, onReady() { FX.initReveals(); } });
})();
