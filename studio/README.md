# Structure Me — Sanity Studio

Headless CMS for the Insights section of structureme.com.au.

## What's set up

- **Project ID:** `r3uuoahs`
- **Dataset:** `production`
- **Schemas:**
  - `insightsPost` — full article (title, slug, hero, body, takeaways, SEO fields)
  - `author` — author profiles
  - `blockContent` — rich text (paragraphs, H2/H3, lists, blockquote, inline images, callouts)

## How content flows

```
   Sanity Studio (you edit here)
              ↓
       publish
              ↓
   Vercel deploy hook fires (~30 sec)
              ↓
   npm run build  →  scripts/build-insights.mjs
              ↓
   Fetches all posts from Sanity
   Writes /insights/[slug].html for each
   Updates insights.html listing + sitemap.xml
              ↓
   Site goes live
```

## Local development (optional — you can skip this)

```bash
cd studio
npm install
npm run dev          # opens Studio at http://localhost:3333
```

## Burst 2 — what you need to do (~10 min total)

### Step 1: Deploy the Studio (~5 min)

From this folder:

```bash
cd studio
npm install
npm run deploy
```

Sanity will ask you to pick a Studio subdomain — choose something like `structureme` so it lives at `https://structureme.sanity.studio`.

### Step 2: Install the Vercel ↔ Sanity integration (~3 min)

1. Go to [https://www.sanity.io/plugins/vercel-deploy](https://www.sanity.io/plugins/vercel-deploy) — or in your Vercel dashboard search "Sanity" under Integrations.
2. Click **Add Integration**.
3. Pick the **structure-me** Vercel project.
4. Pick the **r3uuoahs** Sanity project + **production** dataset.
5. Vercel auto-adds these env vars to your project:
   - `SANITY_PROJECT_ID = r3uuoahs`
   - `SANITY_DATASET = production`
   - `SANITY_READ_TOKEN` (auto-generated for private content)
   - `VERCEL_DEPLOY_HOOK_URL` (used by Sanity to trigger rebuilds)

### Step 3: Import the seed article (~2 min)

```bash
cd studio
npx sanity dataset import seed.ndjson production
```

This loads the existing "Trusts, companies and hybrids" article into Sanity as a starter. Open Studio, paste in the rest of the article body from `insights/trusts-companies-hybrids-business-structure.html`, then click **Publish**.

### Step 4: Watch the magic

Click **Publish** in Studio → Vercel rebuilds in ~30 sec → fresh HTML at `/insights/[slug]` on the live site.

## Adding a new article

1. Open Studio (`https://structureme.sanity.studio`)
2. Click **Insights post → +**
3. Fill in title, slug auto-generates
4. Add hero image, body, takeaways, SEO fields
5. Set **Published date**
6. Click **Publish**
7. ~30 seconds later, the article is live at `/insights/[slug]`
   AND it auto-appears on the Insights listing page
   AND it auto-appears in sitemap.xml

No git, no terminal, no code.
