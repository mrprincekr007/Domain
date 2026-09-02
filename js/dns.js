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

  $('#genDomain').textContent = domain;

  /* ---------- tabs ---------- */
  function activateTab(tabId) {
    $all('.tab').forEach((t) => t.classList.remove('active'));
    $all('.tab-panel').forEach((p) => p.classList.remove('active'));
    const tab = $('.tab[data-tab="' + tabId + '"]');
    if (tab) tab.classList.add('active');
    $('#tab-' + tabId).classList.add('active');
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
  if (hash === 'github' || hash === 'generator' || hash === 'faq' || hash === 'hostinger') {
    activateTab(hash);
  }

  /* ---------- copy buttons (static blocks) ---------- */
  $all('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-copytarget');
      const text = document.getElementById(id).innerText;
      App.copyText(text, 'Record');
    });
  });

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
      q: 'Mujhe kitne A records add karne hain?',
      a: 'Har subdomain ke liye 4 A records (GitHub ke 4 IP addresses) add karne hote hain. Aap Link Generator se exact values copy kar sakte hain.',
    },
    {
      q: 'DNS propagate hone mein kitna time lagta hai?',
      a: 'Aam taur par 24–48 ghante lagte hain, lekin kai baar kuch hi ghanton mein live ho jata hai. Iska asar aapke internet provider ke DNS cache par bhi hota hai.',
    },
    {
      q: 'Agar subdomain kaam nahi kar raha toh kya karun?',
      a: '1) Check karein ki saare 4 A records sahi hain. 2) Repo ke Settings → Pages mein custom domain sahi likha hai. 3) Thoda wait karein aur phir browser cache clear karke dekhein.',
    },
    {
      q: 'Enforce HTTPS kyu kaam nahi kar raha?',
      a: 'Enforce HTTPS tabhi on hota hai jab DNS fully propagate ho jaye aur GitHub certificate issue kar sake. Pehle DNS live hone ka wait karein, phir HTTPS enable karein.',
    },
    {
      q: 'Kya main bina kisi domain ke bhi web host kar sakta hoon?',
      a: 'Haan! Har GitHub repo ka ek free URL hota hai: USERNAME.github.io/REPO. Aapko sirf tab custom subdomain ki zarurat hai jab aap apna branded domain use karna chahein.',
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
