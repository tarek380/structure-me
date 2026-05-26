# Sanity migration — Service pages (Phase 3)

## Goal
Make the 5 service pages fully editable in Sanity using ONE shared `servicePage` schema. Pages: `advisory`, `business-structuring`, `international`, `family-office`, `exit-strategy`. Keep each live page byte-identical after migration.

## Why one schema
All 5 service pages have **identical structure**: same 11 sections in same order with same CSS classes. They differ only in content. So model them as a single `servicePage` document type with 5 instances (one per slug), not 5 separate singletons.

## Repo state
- Phase 1 (homepage) and Phase 2 (about) already shipped and Sanity-rendered.
- Existing schemas:
  - `studio/schemas/homePage.ts` (singleton)
  - `studio/schemas/aboutPage.ts` (singleton)
  - `studio/schemas/insightsPost.ts`, `author.ts`, `blockContent.ts`
  - `studio/schemas/objects/`: cta, pillar, serviceCard, metric, approachRow, highlightedText, teamMember, numberedListItem, relatedServiceCard
- Existing build scripts: `build-homepage.mjs`, `build-about.mjs`, `build-insights.mjs`
- `package.json` build = `build:insights && build:homepage && build:about && build:studio`
- Use the EXACT pattern from `build-about.mjs` (regex-based `safeReplace`, fail-soft on no doc, fail-closed on missing required fields, SANITY-GENERATED marker)

## Backups created
All 5 `.html.pre-sanity-backup` files exist in repo root:
- `advisory.html.pre-sanity-backup`
- `business-structuring.html.pre-sanity-backup`
- `international.html.pre-sanity-backup`
- `family-office.html.pre-sanity-backup`
- `exit-strategy.html.pre-sanity-backup`

## Section inventory (identical across all 5 pages)

Each page has 11 sections in this order:

1. **HERO** (`<section class="service-hero">`)
   - eyebrow (e.g. "— Advisory · Counsel for capital and structure")
   - title (h1, may contain `<em>` and `<br>`)
   - lede paragraph
   - primary CTA: { label, href }
   - secondary CTA: { label, href }
   - hero image: inline `background-image: url(...)` on `.service-hero-image`
   - caption (e.g. "Counsel · Capital · Structure")

2. **PILLAR 1** (`<section class="svc-pillar">`) — image-right, light bg
   - eyebrow, title (may contain `<em>`/`<br>`)
   - body: TWO column structure: left is paragraphs, right column `<div class="svc-pillar-two">` has paragraphs OR a list
   - image: inline bg-image on `.svc-pillar-image`
   - some pages have portrait variant `svc-pillar-figure--portrait`

3. **PILLAR 2** (`<section class="svc-pillar svc-pillar--reverse svc-pillar--cream">`) — image-left, cream bg
4. **PILLAR 3** (`<section class="svc-pillar">`)
5. **PILLAR 4** (`<section class="svc-pillar svc-pillar--reverse svc-pillar--cream">`)
6. **PILLAR 5** (`<section class="svc-pillar svc-pillar--dark">`) — dark bg variant

   All 5 pillars share schema. Use a `servicePillar` object with fields:
   - `eyebrow: string`
   - `title: text` (with `sanitizeInlineHtml`)
   - `bodyLeft: array<text>` (paragraphs in the left content column, before the .svc-pillar-two)
   - `rightColumnType: 'paragraphs' | 'list'` (some pillars have paras, some have `<ul class="svc-pillar-list">`)
   - `bodyRight: array<text>` (paragraphs OR list items based on type)
   - `image: string` (path to img/...)
   - `imageAlt: string` (optional)
   - `layout: 'standard' | 'reverse-cream' | 'dark'` (determines wrapper classes — but this is fixed per slot, so it can be hard-coded by position in the build script rather than stored. **However**, simpler to store as a field for flexibility.)
   - `portraitImage: bool` (true → adds `svc-pillar-figure--portrait` class)

   **Simpler approach**: store all 5 pillars as `pillars: array<servicePillar>` with `layout` field. Build script uses `layout` to choose the wrapper classes and column ordering.

7. **FAMILY band** (`<section class="svc-family">`)
   - eyebrow, title (with `<em>`)
   - lede paragraph
   - numbered list: 4 items, each { num (e.g. "i."), text }
   - pullquote (blockquote text)

   Reuse `numberedListItem` object from About.

8. **THIRDS grid** (`<section class="svc-thirds">`)
   - eyebrow
   - title (h2)
   - 3 cards in a grid, each: { number (e.g. "01"), title, text }
   - New object: `thirdsCard { number: string, title: string, text: text }`

9. **FAQ** (`<section class="svc-faq" id="faq">`)
   - eyebrow
   - title (h2)
   - faqItems: array<{ question: string, answer: text|portable text, open: bool }>
     The first item has `<details ... open>`, rest closed.
     Answer may contain `<p>...</p>` and `<a href="...">...</a>` — store as raw HTML string with limited sanitisation (allow `<p>`, `<a>`, `<em>`, `<strong>`).
   - New object: `faqItem { question: string, answer: text, open: bool }`

10. **CONTACT CTA** (`<section class="contact" id="contact">`)
    - eyebrow, title (with `<em>`), lede, cta { label, href }
    - SAME pattern as homepage/about. Reuse a `contactBlock` shape; it's fine to inline these fields directly on `servicePage`.

11. **RELATED services** (`<section class="svc-related">`)
    - eyebrow, title (with `<em>`)
    - 4 cards (the OTHER 4 service pages), each { number (e.g. "02 / 05"), title, blurb, href }
    - Reuse `relatedServiceCard` object from About.

## What to build

### A. New schemas

**`studio/schemas/servicePage.ts`** — NOT a singleton. Document type with these fields:
- `slug: { type: 'slug' }` (required, unique — but Sanity will warn not error; rely on naming convention)
- `title: string` (admin label, e.g. "Advisory")
- `seoTitle: string` (for `<title>` tag)
- `seoDescription: text`
- `seoKeywords: string`
- `canonicalUrl: string`
- `hero: serviceHero` (or inline fields)
- `pillars: array<servicePillar>` (expect 5)
- `family: serviceFamily` (or inline: eyebrow, title, lede, items, quote)
- `thirds: serviceThirds` (or inline: eyebrow, title, cards [3])
- `faq: { eyebrow, title, items: array<faqItem> }`
- `contact: { eyebrow, title, lede, ctaLabel, ctaHref }`
- `related: { eyebrow, title, cards: array<relatedServiceCard> }`

**New object types** in `studio/schemas/objects/`:
- `servicePillar.ts` — { eyebrow, title (text), bodyLeft (array<text>), rightColumnType ('paragraphs'|'list'), bodyRight (array<text>), image (string), portraitImage (bool), layout ('standard'|'reverse-cream'|'dark') }
- `thirdsCard.ts` — { number, title, text }
- `faqItem.ts` — { question (string), answer (text, allows limited HTML), open (bool) }

Reuse existing: `numberedListItem`, `relatedServiceCard`.

Register all in `studio/schemas/index.ts`.

### B. Studio config

Update `studio/sanity.config.ts`:
- Add a "Service Pages" group below "About Page" and above the divider.
- Sub-items pinned by `documentId`: advisory, business-structuring, international, family-office, exit-strategy (each with its own list item that opens that specific document).
- Pattern:
```ts
S.listItem()
  .title('Service Pages')
  .child(
    S.list()
      .title('Service Pages')
      .items([
        S.listItem().title('Advisory').child(S.document().schemaType('servicePage').documentId('servicePage.advisory').title('Advisory')),
        S.listItem().title('Business Structuring').child(S.document().schemaType('servicePage').documentId('servicePage.business-structuring').title('Business Structuring')),
        S.listItem().title('International').child(S.document().schemaType('servicePage').documentId('servicePage.international').title('International')),
        S.listItem().title('Family Office').child(S.document().schemaType('servicePage').documentId('servicePage.family-office').title('Family Office')),
        S.listItem().title('Exit Strategy').child(S.document().schemaType('servicePage').documentId('servicePage.exit-strategy').title('Exit Strategy')),
      ])
  ),
```

### C. Build script

**`scripts/build-services.mjs`** — single script that builds all 5 service pages.
- Iterate over the 5 known slugs.
- For each slug:
  - Fetch document by `_id: 'servicePage.<slug>'`
  - Read `<slug>.html.pre-sanity-backup` as the template
  - Apply regex replacements for all 11 sections
  - Write `<slug>.html` with `<!-- SANITY-GENERATED <ISO> -->` marker prepended
  - Fail-soft if no doc (warn + skip that page); fail-closed on missing required fields

Copy `build-about.mjs` and adapt — keep the same `escapeHtml`, `sanitizeInlineHtml`, `safeReplace`, `requireField` helpers. The arrow SVG snippets need to match the service page indentation (check the backup files).

For pillars: iterate 5 pillar sections in the HTML in order. For each, regex-match by `aria-labelledby` ID (each pillar has a unique one like `pillar-structures`, `pillar-grants`, etc.) OR match by ordinal position. **Position-based** is simpler — split the HTML into pillar blocks by `<section class="svc-pillar` markers, replace in order, rejoin.

### D. Seed data

**`studio/seed-services.ndjson`** — 5 NDJSON lines, one per service page. Document IDs:
- `servicePage.advisory`
- `servicePage.business-structuring`
- `servicePage.international`
- `servicePage.family-office`
- `servicePage.exit-strategy`

Each document must reproduce the existing content of its `.pre-sanity-backup` file EXACTLY (titles, paragraphs, list items, image paths, FAQ entries, etc.). Read each backup file carefully — do NOT paraphrase. Preserve all `<em>`, `<br>`, and inline links inside FAQ answers.

### E. Test harness

**`scripts/test-services-render.mjs`** — render all 5 pages from seed (mock Sanity client) and whitespace-normalised-diff each against its `.pre-sanity-backup`. Exit 1 on any mismatch. Same pattern as `test-about-render.mjs`.

### F. package.json

Add: `"build:services": "node scripts/build-services.mjs"` and add to `build` chain:
```
"build": "node scripts/build-insights.mjs && node scripts/build-homepage.mjs && node scripts/build-about.mjs && node scripts/build-services.mjs && cd studio && npm run build"
```
(or whatever the current pattern is — match the existing style)

## Done criteria

1. `node scripts/test-services-render.mjs` passes for all 5 pages (whitespace-normalised match).
2. All 5 schemas registered, Studio config updated with Service Pages group.
3. `studio/seed-services.ndjson` exists with 5 documents whose content matches the 5 backup files.
4. `package.json` build chain runs all 4 build scripts in order.
5. Commit messages:
   - `feat: add servicePage schema + shared objects (Phase 3)`
   - `feat: add build-services.mjs + test harness`
   - `feat: seed data for 5 service pages`
   - `chore: register service pages in studio config + build chain`

**DO NOT push.** Leave commits local. The parent agent will handle push + seed import + verify.

## Gotchas

- The `<section>` tag order in the source HTML is: hero, pillar×5, family, thirds, faq, contact, related. The pillar replacements need to be position-based (1st pillar block in the file → pillars[0], etc.) because they all share `class="svc-pillar..."`.
- The image inline-style uses single quotes: `style="background-image: url('img/advisory-structures.jpg');"`. Preserve that exact quoting.
- The `svc-pillar-figure` div can have `--portrait` modifier. Some pages do, some don't. Check each backup.
- The thirds grid has 3 cards inside `<div class="svc-thirds-grid">`. Inspect the actual card markup in one of the backups to get classes right.
- The FAQ first item has `<details class="svc-faq-item" open>` — rest are just `<details class="svc-faq-item">`. Honour the `open` field.
- The FAQ answer body sits inside `<div class="svc-faq-a">` and may contain multiple `<p>` tags and an `<a>` link. Allow `<p>`, `<a href>`, `<em>`, `<strong>` in the sanitiser.
- The related cards section in each page lists the OTHER 4 services (not 5). Each card has `<span class="svc-related-num">NN / 05</span>`, a title, blurb, and arrow. Numbering is fixed: advisory=01, business-structuring=02, international=03, family-office=04, exit-strategy=05.
- Read all 5 backups carefully — the FAQ questions differ per page, related card text differs, etc.
