# SubManga — Subdomain Manager

Ek **beautiful, responsive** web app jo aapke maalik wale domain pe **bohot saare subdomain websites** manage karne mein madad karti hai — sab GitHub Pages ke through.

Aap ek hi domain (jaise `prince.com`) se `blog.prince.com`, `shop.prince.com`, `portfolio.prince.com` jaise **unlimited websites** bana sakte hain, aur ye dashboard un sabko track karta hai.

## Features

- **Dashboard** — total / live / pending / draft subdomains ki live ya sabhi ka overview
- **Subdomain Manager** — add / edit / delete subdomains, har ek se project name, GitHub repo aur status jodein
- **DNS & Deploy guide** — Hostinger DNS + GitHub Pages ka step-by-step (Hinglish) guide
- **Link Generator** — kisi bhi subdomain ke liye exact A records + CNAME file turant generate karein
- **Settings** — main domain change karein, theme (dark/light), backup export/import
- **Responsive** — mobile + PC dono ke liye designer UI (glassmorphism, dark-first)
- **No server needed** — data aapke browser ke localStorage mein save hota hai

## Project structure

```
domain/
├── index.html          # Dashboard
├── subdomains.html     # Subdomain manager
├── dns.html            # DNS + GitHub Pages guide aur generator
├── settings.html       # Domain, theme, backup settings
├── css/styles.css      # Design system (glassmorphism, responsive)
├── js/
│   ├── data.js         # localStorage data layer + seed data
│   ├── app.js          # Theme, toast, icons, shared helpers
│   ├── dashboard.js
│   ├── subdomains.js
│   ├── dns.js
│   └── settings.js
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
- Google Fonts: Fira Sans + Fira Code
- Design: glassmorphism, dark/light, responsive
