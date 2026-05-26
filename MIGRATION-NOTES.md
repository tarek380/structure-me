# Sanity migration — homepage scope

## Repo state (as of this branch)
- Live site: https://www.structureme.com.au
- Sanity project ID: `r3uuoahs`, dataset: `production`
- Studio served at https://www.structureme.com.au/studio (configured, working)
- Existing Sanity schemas: `insightsPost`, `author`, `blockContent` (in `studio/schemas/`)
- Existing build script: `scripts/build-insights.mjs` — fetches Sanity insightsPost docs, emits `/insights/<slug>.html`, has SANITY-GENERATED marker check so it never overwrites hand-authored files
- Build pipeline in `package.json`:
  ```
  build = build:insights && build:studio
  ```
- `vercel.json` runs `npm run build`, outputDirectory `.`

## Homepage section inventory (index.html, 760 lines)

The homepage currently has 8 sections. Every text/image inside is candidate for Sanity:

1. **HERO** (`<section class="hero">`)
   - eyebrow text: "Business Structuring & Business Advisory"
   - headline (two `<span class="hl-line">` lines with `<em>` highlights): "Solid structures" / "to *grow* and *protect*."
   - sub: "Our work leaves a quiet whisper, but our results speak a lifetime. Where others stop, we begin."
   - CTA button: label "Speak with us" → href `contact.html`
   - 4 pillars: { num: "01", label: "We Analyse" }, …"02 We Design", "03 We Structure", "04 We Globalise"
   - background video: video/hero.webm + video/hero.mp4 + poster video/hero-poster.jpg

2. **CREDS** (`<section class="creds">`)
   - label: "Built For"
   - items list: ["Ambitious Business Owners", "HNW Investors", "Family Offices"]

3. **DIVIDER** (`<section class="divider divider--top">`)
   - caption: "Melbourne · Headquarters"
   - background image: CSS class `divider-image--melbourne` (currently in styles.css)

4. **SERVICES** (`<section class="services" id="business">`)
   - section eyebrow: "— What we do"
   - section title (HTML with `<br>` and `<em>`): "Five disciplines,<br /><em>one architecture</em>."
   - section lede: "Every structure we design serves the same client…"
   - 5 service cards, each: { image (CSS class), number ("01 / 05"), name, copy, points (4-5 li), link label, link href }
     1. Business Advisory → advisory.html
     2. Business Structuring → business-structuring.html
     3. International Business Structuring (feature variant) → international.html
     4. Family Office Structuring → family-office.html
     5. Business Exit Strategy → exit-strategy.html

5. **PHILOSOPHY** (`<section class="philosophy">`)
   - quote (with `<em>`): "A good structure is invisible when it works, and decisive when it matters. Ours are *built to do both* — quietly, for decades."
   - attribution: "Structure Me · Founding principle"

6. **METRICS** (`<section class="metrics">`)
   - eyebrow: "— By the numbers"
   - title (with `<em>`): "An architecture that *compounds*."
   - 3 metrics, each: { num (e.g. "15"), suffix optional ("structures"), plus ("+"), label }

7. **APPROACH** (`<section class="approach" id="about">`)
   - image caption: "Designed, not assembled"
   - eyebrow: "— Our approach"
   - title (with `<em>`): "Architecture, before *activity*."
   - 4 rows, each: { roman num ("I.", "II.", "III.", "IV."), title, body paragraph }

8. **CONTACT CTA** (`<section class="contact" id="contact">`)
   - eyebrow: "— Begin"
   - title (with `<em>`): "Most of our work begins with a *quiet conversation*."
   - lede: "Whether you are restructuring a business, going international…"
   - CTA: label "Request an introduction" → href `contact.html`

## What needs to be built

### A. New Sanity schemas (`studio/schemas/`)
- `homePage.ts` — singleton (`__experimental_actions: ['update', 'publish']`, no create/delete), `_id: 'homePage'`. Fields mirroring sections above. For headlines/titles that have `<em>` highlights, use a constrained Portable Text field that only allows the `em`/`strong` marks (no headings, no links) so the editor stays plain.
- Reusable object types (in `studio/schemas/objects/`):
  - `cta` { label: string, href: string }
  - `pillar` { num: string, label: string }
  - `serviceCard` { image: image with hotspot, number: string, name: string, copy: text, points: array of strings, ctaLabel: string, ctaHref: string }
  - `metric` { num: string, suffix?: string, plus: boolean, label: text }
  - `approachRow` { num: string, title: string, body: text }
- Register all new schemas in `studio/schemas/index.ts`

### B. Build pipeline
- Rename `scripts/build-insights.mjs` → keep it, but add `scripts/build-homepage.mjs`. Or create one orchestrator `scripts/build-site.mjs` that calls both. Recommended: separate `build-homepage.mjs` so it's easy to add more pages later.
- Update `package.json`:
  ```
  "build:insights": "node scripts/build-insights.mjs",
  "build:homepage": "node scripts/build-homepage.mjs",
  "build": "npm run build:insights && npm run build:homepage && npm run build:studio"
  ```
- `build-homepage.mjs` must:
  1. Use `@sanity/client` with projectId `r3uuoahs`, dataset `production`, apiVersion `2024-01-01`, `useCdn: false` (so latest published content is fetched on every build — Sanity's CDN can cache up to a minute, we want fresh)
  2. Fetch the singleton: `*[_type == "homePage" && _id == "homePage"][0]` with `defined()` checks
  3. Read the **current** `/home/user/workspace/structure-me/index.html` as the template (don't try to regenerate the full page from scratch — there's too much markup like SVGs, video tags, decorative DOM)
  4. **Find-and-replace strategy**: identify each editable region by a stable marker. Since the existing HTML doesn't have markers, the script must use deterministic anchor matching (e.g. find `<span class="eyebrow-text">…</span>` and replace its inner text; find `<h1 class="hero-headline">…</h1>` and replace its inner HTML with rendered Portable Text). Use `cheerio` (already used in build-insights.mjs? — check) or `node-html-parser` for safe DOM manipulation.
  5. Skip gracefully if Sanity returns no homePage doc (don't overwrite existing index.html). Print warning, exit 0.
  6. Add SANITY-GENERATED marker comment to the top of the regenerated index.html for audit (similar to build-insights pattern)
  7. Render headlines/titles by converting the constrained PT to inline HTML — only `<em>` and `<strong>`. Wrap headline lines that have explicit `\n` or use a `lines` array field on the schema so editors can split lines cleanly.

### C. Image handling for hero video + service tile images
- Hero video: leave as-is (`video/hero.webm` / `.mp4` / poster) — Sanity doesn't host video well. Add the video URLs as string fields on the homePage schema so editor *can* override the URL if needed, but defaults stay pointing at `/video/hero.*`.
- Service tile images: currently CSS background-images defined in `styles.css` under classes like `.service-image--business-advisory`. **Do not migrate these yet** — image migration for CSS backgrounds requires generating inline styles per page render. **For homepage v1**, keep service tile images as-is (CSS-driven) and just make text editable. Note this limitation in the schema field descriptions.
- For *future*: add `image` field to `serviceCard` that, when set, renders as an inline `style="background-image: url(...)"` overriding the CSS class. Leave the hook in the build script but make it optional.

### D. Seed migration
- Write `studio/seed-homepage.ndjson` with the current homepage content exactly as it is on production now (the live copy, including emphasis spans).
- Document in README.md (in /studio) the command the user runs to import:
  `npx sanity@latest dataset import seed-homepage.ndjson production --replace`
  But since the user doesn't want terminal commands, **also** provide instructions for manual entry via the Studio UI as a backup.

### E. Wire it up
- Commit each phase separately:
  1. Schemas (no live changes)
  2. Build script + seed file
  3. After user verifies homepage rendering matches current site exactly, push to production

### F. CRITICAL safety constraints
- **The live homepage must look pixel-identical** after migration. Test by diffing the regenerated index.html against the pre-migration version (after stripping the SANITY-GENERATED marker). Differences should be limited to whitespace inside elements that got replaced.
- **No design changes**. Same CSS classes, same DOM structure, same SVG decorations, same video, same favicon, same meta tags.
- **All meta tags stay** (the homepage has rich OG, Twitter, JSON-LD structured data — none of that gets touched on this pass; later we'll add a `seo` field to homePage for it).
- **Build script must fail closed**: if any required Sanity field is missing, log the missing field clearly, do not write an incomplete index.html. Keep the existing index.html on disk.
- **Backup the original**: before running the homepage build for the first time on Vercel, snapshot `index.html` to `index.html.pre-sanity-backup` and commit it. So if the migration goes wrong, we restore in one revert.
- **Defer the design-direction work** — this migration only changes *content source*, not visual design. The website-building skill's design pillars (typography, motion, palette) are already established and locked in.

## Render strategy: text replacement vs. full template

Recommended: **DOM-based replacement** using `node-html-parser` (~30KB, no jsdom).

Pseudocode for build-homepage.mjs:
```js
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { createClient } from '@sanity/client';

const client = createClient({ projectId: 'r3uuoahs', dataset: 'production', apiVersion: '2024-01-01', useCdn: false });

const doc = await client.fetch(`*[_type == "homePage" && _id == "homePage"][0]`);
if (!doc) { console.warn('No homePage doc — leaving index.html as-is'); process.exit(0); }

const html = readFileSync('index.html', 'utf8');
const root = parse(html);

// HERO
root.querySelector('.eyebrow-text').set_content(escapeHtml(doc.hero.eyebrow));
root.querySelector('.hero-headline').set_content(renderHeadlineLines(doc.hero.headlineLines));
root.querySelector('.hero-sub').set_content(escapeHtml(doc.hero.sub));
root.querySelector('.hero-cta a').setAttribute('href', doc.hero.cta.href);
root.querySelector('.hero-cta a span').set_content(escapeHtml(doc.hero.cta.label));
// pillars
const pillars = root.querySelectorAll('.hero-pillars .pillar');
doc.hero.pillars.forEach((p, i) => {
  pillars[i].querySelector('.pillar-num').set_content(p.num);
  pillars[i].querySelector('.pillar-label').set_content(p.label);
});

// CREDS
root.querySelector('.creds-label').set_content(doc.creds.label);
const credsList = root.querySelector('.creds-list');
credsList.set_content(doc.creds.items.map((t, i, arr) => `<span>${escapeHtml(t)}</span>${i < arr.length-1 ? '<span class="dot">·</span>' : ''}`).join(''));

// ... etc for each section

writeFileSync('index.html', `<!-- SANITY-GENERATED ${new Date().toISOString()} -->\n` + root.toString());
```

`renderHeadlineLines` takes an array of `{ text, parts: [{ text, em?: boolean }] }` and emits `<span class="hl-line">…</span>` blocks. Or simpler — store `headlineLines` as an array of strings where each string is HTML-allowed (with `<em>` only). Sanitize on input by stripping any tag that's not `<em>` / `<strong>`.

## Files to create
- `studio/schemas/objects/cta.ts`
- `studio/schemas/objects/pillar.ts`
- `studio/schemas/objects/serviceCard.ts`
- `studio/schemas/objects/metric.ts`
- `studio/schemas/objects/approachRow.ts`
- `studio/schemas/objects/highlightedText.ts` (the constrained PT type for em/strong)
- `studio/schemas/homePage.ts`
- `studio/seed-homepage.ndjson`
- `scripts/build-homepage.mjs`
- Update: `studio/schemas/index.ts`, `package.json`, `studio/sanity.config.ts` (singleton structure customization so user can't accidentally delete it)
