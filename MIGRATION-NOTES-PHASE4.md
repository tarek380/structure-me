# Sanity migration — Phase 4 (contact, insights index, subscribe-details, thank-you-subscribe)

## Goal
Make these 4 pages editable in Sanity using the same pattern as Phases 1–3. Keep byte-identical output after migration (whitespace-normalised diff against `.pre-sanity-backup`).

## Phase context
Phases 1, 2, 3 are live. Study `scripts/build-homepage.mjs`, `scripts/build-about.mjs`, `scripts/build-services.mjs` to copy patterns exactly. Use the same:
- `escapeHtml`, `sanitizeInlineHtml`, `safeReplace`, `requireField` helpers
- Regex-based replacement (NEVER a DOM parser)
- `<!-- SANITY-GENERATED <ISO> -->` marker prepended
- Fail-soft on no doc (warn + leave HTML untouched, exit 0)
- Fail-closed on missing required field

## Critical naming rule (learned in Phase 3)
**`_id` MUST NOT contain a `.`** — Sanity's public ACL treats it as a namespace separator and filters anon reads. Use hyphens.
Document IDs to use:
- `contactPage`
- `insightsIndexPage`
- `subscribeDetailsPage`
- `thankYouSubscribePage`

## Backups created
- `contact.html.pre-sanity-backup`
- `insights.html.pre-sanity-backup`
- `subscribe-details.html.pre-sanity-backup`
- `thank-you-subscribe.html.pre-sanity-backup`

## Pages & content inventory

### A. contact.html (568 lines)
Two sections: `contact-hero` and `contact-form-section`.

**contact-hero** (line 178)
- eyebrow span: `— Contact`
- h1 title (contains `<em>` accent): "Let's talk about the structure that <em>fits your next ten years</em>."
- lede paragraph
- meta list (4 items): each item has `<span class="contact-hero-meta-label">Email</span>` then `<span>address</span>` etc. Items are: Email, Phone, Office (city), Office (street)
- secondary block: "Direct" + "Tarek Murad" + name role

**contact-form-section** (line 214)
- aside title: "Tell us what you're <em>working on</em>."
- aside paragraphs (intro copy, 2-3 paragraphs)
- aside bullet list (3 items)
- aside closing paragraph
- The actual `<form>` content (lines 230–end) is mostly static markup and JS — leave outside Sanity scope. Only the aside content needs management.

**Sanity schema `contactPage` fields**:
- hero: { eyebrow, title (with sanitizeInlineHtml for `<em>`/`<br>`), lede }
- meta: array<{ label, value, href (optional, for email/phone) }>
- direct: { eyebrow ("Direct"), name, role }
- form: { asideTitle (with `<em>`), asideParagraphs (array<text>, allow inline HTML), asideBullets (array<text>), asideClosing (text) }

### B. insights.html (579 lines)
Three sections.

**insights-featured (insights-featured--hero)** — lines 183–209.
**DO NOT MIGRATE THE FEATURED CARD CONTENT** to Sanity. It's auto-populated by `build-insights.mjs` from the latest insightsPost. Leave the markup intact.

**insights-list** — line 211. Card grid auto-managed by build-insights. **No Sanity migration needed.**

**insights-newsletter** — line 270.
- eyebrow line: not present here, but title/lede are
- title (with `<em>`): "Get the briefing — once a month."
  (Need to read exact title from backup)
- lede paragraph
- form action="subscribe-details.html" — preserve markup, only manage title + lede
- Below form: a single line of fine print like "No spam. Unsubscribe anytime."

**Sanity schema `insightsIndexPage` fields**:
- meta: { seoTitle, seoDescription, canonicalUrl }  (optional now, but worth adding for future)
- newsletter: { title (with `<em>`), lede (text), placeholder (string, e.g. "you@yourbusiness.com"), buttonLabel (string, e.g. "Subscribe"), fineprint (text) }

That's it. Featured-card and grid stay dynamic.

### C. subscribe-details.html (342 lines)
Single section: `thanks-hero subdetails-hero` (lines 100+). Contains:
- eyebrow ("— Subscribe" or similar — read backup for exact)
- title (h1, with `<em>` likely)
- lede paragraph
- A form (or details fields list)
- Privacy fineprint at bottom

This page is reached via the newsletter form (action="subscribe-details.html?email=…"). It collects extra subscriber info.

**Sanity schema `subscribeDetailsPage` fields**:
- hero: { eyebrow, title (with `<em>`), lede }
- form: { sectionTitle, ledeAbove, ledeBelow, fineprint }  (read backup to see actual fields, may be simpler)
- DO NOT migrate the form markup itself — only the text content around it.

### D. thank-you-subscribe.html (245 lines)
Single section: `thanks-hero` (lines 99+). The success/confirmation page.
- eyebrow ("— You're in" or similar)
- title (h1, with `<em>`)
- lede + 1–2 paragraphs
- A CTA card or button at bottom
- Possibly related links

**Sanity schema `thankYouSubscribePage` fields**:
- hero: { eyebrow, title (with `<em>`), paragraphs (array<text>) }
- cta: { label, href } (optional)
- secondaryLinks: array<{ label, href }> (optional)

Read the backup file to determine exact structure — don't over-engineer schema.

## What to build

### 1. Schemas — `studio/schemas/`
Four new singletons (each with `__experimental_actions: ['update','publish']`, no create/delete):
- `contactPage.ts` (_id: `contactPage`)
- `insightsIndexPage.ts` (_id: `insightsIndexPage`)
- `subscribeDetailsPage.ts` (_id: `subscribeDetailsPage`)
- `thankYouSubscribePage.ts` (_id: `thankYouSubscribePage`)

Reuse existing object types where they fit (`cta`, etc.). Add new object types only when needed (e.g. `contactMetaItem` for email/phone rows).

Register all in `studio/schemas/index.ts`.

### 2. Studio config — `studio/sanity.config.ts`
Add 4 new pinned singleton items. Order in the left rail:
- Homepage
- About Page
- Service Pages (group)
- Contact Page
- Insights Index Page
- Subscribe Details Page
- Thank You Subscribe Page
- (divider)
- Insights Posts
- Authors

### 3. Build scripts — `scripts/`
**Decision: 4 separate build scripts** (parallel to homepage/about pattern) OR **one combined script**. Prefer **4 separate** for consistency and easy debugging:
- `build-contact.mjs`
- `build-insights-index.mjs`  (handles `insights.html` newsletter section only — DO NOT touch the featured-card or insights-grid)
- `build-subscribe-details.mjs`
- `build-thank-you-subscribe.mjs`

Each fetches its singleton by `_id`, reads `<page>.html.pre-sanity-backup`, applies replacements, writes `<page>.html` with marker.

### 4. Test harness — `scripts/`
**One combined harness `test-phase4-render.mjs`** that mocks Sanity client with seed data and diffs all 4 pages against their backups. Whitespace-normalised. Exit 1 on any mismatch.

### 5. Seed data
Four NDJSON files (one per page) OR one combined `studio/seed-phase4.ndjson` with 4 lines. Prefer **one combined** for easier import. Read each backup carefully — preserve all `<em>`, `<br>`, inline links, list items, paragraphs verbatim.

### 6. package.json
Add to build chain:
```json
"build:contact": "node scripts/build-contact.mjs",
"build:insights-index": "node scripts/build-insights-index.mjs",
"build:subscribe-details": "node scripts/build-subscribe-details.mjs",
"build:thank-you-subscribe": "node scripts/build-thank-you-subscribe.mjs",
"build": "node scripts/build-insights.mjs && node scripts/build-homepage.mjs && node scripts/build-about.mjs && node scripts/build-services.mjs && node scripts/build-contact.mjs && node scripts/build-insights-index.mjs && node scripts/build-subscribe-details.mjs && node scripts/build-thank-you-subscribe.mjs && cd studio && npm run build"
```

**Important ordering**: `build-insights-index.mjs` MUST run AFTER `build-insights.mjs` (because build-insights rewrites the insights-list cards). Otherwise build-insights-index's regex on `insights.html` could conflict if it accidentally touches markers. Best: build-insights-index only touches the `insights-newsletter` section, never the list/featured.

## Commit structure
1. `feat: schemas for contact, insights-index, subscribe-details, thank-you-subscribe (Phase 4)`
2. `feat: build scripts + combined test harness (Phase 4)`
3. `feat: seed data for 4 Phase 4 pages`
4. `chore: register Phase 4 pages in studio config + build chain`

**DO NOT push.** Leave all commits local on `main`. Parent agent pushes + imports seed.

## Done criteria
- `node scripts/test-phase4-render.mjs` passes (4/4 whitespace match).
- All 4 schemas registered, studio config updated.
- 4 commits local.
- Seed file exists, importable.

## Gotchas
- Sanity `_id` cannot contain `.` — use camelCase or kebab-case.
- Inline-style backgrounds use single quotes: `style="background-image: url('img/...');"` — preserve exactly.
- `insights.html`: only touch the `<section class="insights-newsletter">…</section>` block. Use the closing `</section>` boundary or aria-labelledby="newsletter-h" as the regex anchor.
- For `contact.html` meta list: it's a `<ul class="contact-hero-meta" role="list">`. Each `<li>` has a label span + value span (+ possibly a link). Read the backup carefully — there may be 4 items.
- Pre-existing helper `sanitizeInlineHtml` allows `<em>`, `<br>`, `<strong>`, `<a href>` — sufficient for titles and ledes.
- For paragraphs and longer text, store as raw HTML string (entities preserved) and DO NOT escape — that's how Phase 3 handled `M&A`, `&ldquo;`, etc. Use the existing pattern.
