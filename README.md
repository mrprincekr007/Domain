# SubManga — Subdomain Manager

Ek **beautiful, responsive** web app jo aapke maalik wale domain pe **bohot saare subdomain websites** manage karne mein madad karti hai — sab GitHub Pages ke through.

Aap ek hi domain (jaise `prince.com`) se `blog.prince.com`, `shop.prince.com`, `portfolio.prince.com` jaise **unlimited websites** bana sakte hain, aur ye dashboard un sabko track karta hai.

## Features

### User panel
- **Dashboard** — total / live / pending / draft stats, quick actions, recent subdomains (Copy + Open)
- **Subdomain Manager** — add / edit / delete, search, filter, sort, per-row **Check DNS + Copy URL + Open**
- **DNS & Deploy** — one-click Cloudflare deploy, existing-subdomain DNS check, record generator, FAQ
- **Settings** — theme (dark/light), backup export/import (domain & danger zone = admin-only)
- **Responsive** — mobile + PC designer UI (glassmorphism, dark-first)
- **No server needed** — data browser ke localStorage (+ optional Firebase sync) mein

### Admin panel (`admin/`, login: `admin`)
- **Dashboard** — overview stats, growth/activity sparklines, system info
- **Subdomains** — full CRUD, search/filter/sort, Cloudflare auto-deploy on add
- **Cloudflare Zone / Health / Bulk** — live DNS records, health monitor, batch ops
- **Analytics** — growth, activity, status aur action charts (canvas, no library)
- **Activity Log** — search, filter, pagination, CSV export
- **Cloudflare Config + System Settings** — Worker URL/Zone ID, domain, notifications, user-panel control, full reset

## Project structure

```
domain/
├── index.html          # Dashboard
├── subdomains.html     # Subdomain manager
├── dns.html            # DNS + one-click Cloudflare deploy + generator
├── settings.html       # Theme, backup settings (domain = admin-only)
├── css/styles.css      # Design system (glassmorphism, responsive)
├── js/
│   ├── data.js         # localStorage data layer + seed data + activity log
│   ├── app.js          # Theme, toast, icons, shared shell
│   ├── cloudflare.js   # Cloudflare API via Worker proxy
│   ├── dashboard.js
│   ├── subdomains.js
│   ├── dns.js
│   └── settings.js
├── admin/              # Independent admin panel (own css/js/html)
│   ├── admin-login.html
│   ├── admin.html          # Dashboard (overview only)
│   ├── subdomains.html / zone.html / health.html / bulk.html
│   ├── analytics.html / activity.html / cfconfig.html / settings.html
│   ├── css/admin.css
│   ├── js/admin-app.js     # Core: data, Cloudflare, layout, prefs
│   ├── js/admin-charts.js  # Canvas charts (line/bar/donut/sparkline)
│   └── admin-main.js       # Page router + 9 modules
├── worker.js           # Cloudflare Worker proxy (DNS_PROXY_TOKEN env)
└── README.md
```

## Local run

Sirf folder kholo ya simple HTTP server chalao:

```bash
# option 1: koi bhi static server
npx serve
# ya python
python -m http.server 8080
```

Phir browser mein `http://localhost:8080` kholo.

## Isko GitHub Pages par host karna (apne domain pe)

Takki **ye manager khud bhi** apne domain/subdomain par live ho:

1. GitHub par **new repository** banao (jaise `submanga`).
2. Saare files is repo mein push karo (repo ke root mein, `index.html` sabse upar).
3. Go to repo **Settings → Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` + `/ (root)`
   - **Save** karo.
4. Custom domain section mein apna subdomain dalo (jaise `app.prince.com`) + **Enforce HTTPS** on karo.
5. Hostinger **DNS Zone** mein `app` ke liye 4 A records (185.199.108.153 ... 111.153) + CNAME add karo (is guide ke saath `dns.html` page se exact values copy karo).

> **Important:** GitHub Pages **ek hi custom domain per repo ko** allow karta hai. Isliye **har website ka apna alag repo** banao aur us repo mein apna subdomain set karo. Ye dashboard manager ko bhi apna alag repo/site chahiye hoga.

## Har website ka alag repo (recommended workflow)

| Subdomain | Website | GitHub repo |
|-----------|---------|-------------|
| `blog.prince.com` | Blog | `you/blog` |
| `shop.prince.com`  | Store | `you/shop` |
| `app.prince.com`   | Ye manager | `you/submanga` |

Har repo mein:
1. **Settings → Pages** mein custom domain = uski subdomain.
2. Hostinger DNS mein us subdomain ke liye 4 A records + CNAME.
3. `dns.html` page ke **Link Generator** se exact records copy karo.

## Data / backup

- Saara data browser ke **localStorage** mein rehta hai (kisi server ki zarurat nahi).
- **Settings → Export backup** se JSON file download karo — dusre device/browser mein import kar sakte hain.

## Tech stack

- Vanilla HTML + CSS + JS (koi framework/build step nahi)
- Google Fonts: Sora + Inter + JetBrains Mono
- Design: glassmorphism, dark/light, responsive

## Security — Firebase Auth + Database Rules

Login is Gmail + password via **Firebase Authentication** (user panel and admin panel both).
Admin access is enforced by **Realtime Database Rules** (`database.rules.json`) —
only your UID (plus uids you promote on the Users page) can touch admin data.

Setup (one time):

1. Firebase console → **Authentication → Sign-in method** → enable **Email/Password** → Save.
2. **Authentication → Settings → Authorized domains** → add `princehacks.online`
   (localhost works by default).
3. Register once in the app with your Gmail, then Firebase console →
   **Authentication → Users** → copy your **UID**.
4. Open `database.rules.json`, replace every `PASTE_YOUR_UID_HERE` with your UID.
5. Firebase console → **Realtime Database → Rules** → paste the file → **Publish**.
6. Login to `admin/` with the same Gmail + password — first login claims admin,
   afterwards manage more admins from **Users → Make admin**.

Rule summary: everyone reads `settings` + `usernames`; each uid reads/writes
only its own `accounts/{uid}` + `users/{uid}`; only the owner (or listed admins)
reads everything and writes settings/admins. Blocked status is enforced by the app at login.
