# Structure Me — Sanity Studio

Headless CMS for the Insights section and Homepage of structureme.com.au.

## What's set up

- **Project ID:** `r3uuoahs`
- **Dataset:** `production`
- **Schemas:**
  - `insightsPost` — full article (title, slug, hero, body, takeaways, SEO fields)
  - `author` — author profiles
  - `blockContent` — rich text (paragraphs, H2/H3, lists, blockquote, inline images, callouts)
  - `homePage` — singleton document for all 8 homepage sections (Phase 1 migration)

## How content flows

```
   Sanity Studio (you edit here)
              ↓
       publish
              ↓
   Vercel deploy hook fires (~30 sec)
              ↓
   npm run build  →  scripts/build-insights.mjs
                  →  scripts/build-homepage.mjs   ← NEW
              ↓
   Fetches all posts + homePage doc from Sanity
   Writes /insights/[slug].html for each post
   Writes index.html from homePage content
   Updates insights.html listing + sitemap.xml
              ↓
   Site goes live
```

---

## Homepage CMS (Phase 1)

### Step 1: Import seed data

The `seed-homepage.ndjson` file contains the current live homepage content, ready to import.

**Option A — Terminal (recommended):**

```bash
cd studio
npx sanity@latest dataset import ../studio/seed-homepage.ndjson production --replace
```

**Option B — Studio UI (no terminal):**

1. Open the Studio at [https://www.structureme.com.au/studio](https://www.structureme.com.au/studio)
2. Click **⚙ Manage** (top-right cog or project settings)
3. Navigate to **Datasets → production → Import**
4. Upload `studio/seed-homepage.ndjson`
5. Choose **Replace existing documents**

### Step 2: Edit the Homepage in Studio

1. Open Studio at [https://www.structureme.com.au/studio](https://www.structureme.com.au/studio)
2. The **Homepage** document appears at the top of the left rail (above the divider)
3. Click **Homepage** to open the singleton editor
4. Edit any section — Hero, Services, Philosophy, Metrics, Approach, Contact CTA
5. Click **Publish** to trigger a Vercel rebuild
6. Within ~30 seconds, `index.html` is regenerated with your changes live

### What you can edit

| Section | Editable fields |
|---|---|
| Hero | Eyebrow, headline lines (with *em* highlights), sub-headline, CTA button |
| Credentials strip | Label ("Built For"), the three credential items |
| Divider | Caption ("Melbourne · Headquarters") |
| Services | Eyebrow, section title (raw HTML — allows `<br />` and `<em>`), lede, all 5 service card texts + CTAs |
| Philosophy | Quote (with *em* highlights), attribution |
| Metrics | Eyebrow, title, all 3 metric numbers/labels |
| Approach | Image caption, eyebrow, title, all 4 approach rows |
| Contact CTA | Eyebrow, title (with *em*), lede, CTA button |

### What is NOT editable yet (Phase 2+)

- Hero background video (currently hardcoded to `video/hero.webm`)
- Service card tile images (controlled by CSS classes in `styles.css`)
- Navigation, footer, meta tags, JSON-LD structured data

### Safety

The original `index.html` is preserved as `index.html.pre-sanity-backup`. If a build goes wrong, you can restore it with:

```bash
cp index.html.pre-sanity-backup index.html
git add index.html && git commit -m "restore: revert homepage to pre-sanity backup"
```

If no `homePage` doc exists in Sanity (e.g. before importing the seed), the build script exits cleanly without touching `index.html`.

---

## Local development

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

### Step 3: Import seed content (~2 min)

Import the homepage seed:

```bash
npx sanity@latest dataset import studio/seed-homepage.ndjson production --replace
```

Then if you have an Insights seed article:

```bash
cd studio
npx sanity dataset import seed.ndjson production
```

### Step 4: Watch the magic

Click **Publish** in Studio → Vercel rebuilds in ~30 sec → fresh HTML at `/` (homepage) or `/insights/[slug]` on the live site.

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
