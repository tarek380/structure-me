# Structure Me — Website

Static HTML/CSS site. No build step required.

## Deploy to Vercel (CLI method)

```bash
# 1. Install Vercel CLI (one-time)
npm i -g vercel

# 2. From inside this folder
cd structure-me
vercel login          # opens browser, log in to your Vercel account
vercel                # answers below:
#   Set up and deploy?           → Y
#   Which scope?                 → your personal account
#   Link to existing project?    → N
#   What's your project name?    → structure-me
#   Which directory is your code in? → ./
#   Want to modify settings?     → N
# (gives you preview URL like structure-me-abc123.vercel.app)

vercel --prod         # ship to production URL (structure-me.vercel.app)
```

## Connect Crazy Domains domain

1. In Vercel dashboard → Project → **Settings → Domains** → add your domain.
2. Vercel will show DNS records. Copy them.
3. In Crazy Domains → DNS Management → add the records:
   - **A record** `@` → `76.76.21.21`
   - **CNAME record** `www` → `cname.vercel-dns.com`
4. SSL is auto-provisioned. Propagation: 5–60 min.

## What's in this folder

- `index.html` — Home
- `about.html` — About + team
- `team/name-*.html` — Team detail pages
- `advisory.html`, `business-structuring.html`, `international.html`, `family-office.html`, `exit-strategy.html` — 5 service pages
- `insights.html` + `insights/*.html` — Insights index and article
- `contact.html`, `thank-you.html` — Contact form (mailto)
- `subscribe-details.html`, `thank-you-subscribe.html` — Subscribe flow
- `styles.css` — All styles
- `img/`, `video/` — Assets
- `vercel.json` — Clean URLs, security headers, asset caching

## Forms

Currently use `mailto:tarek@structureme.com.au` — the user's mail client opens to send. Works out of the box on Vercel. To upgrade to a real email send later, add a `/api/contact.js` Vercel function and swap the form action.
