# Sanity migration — About page (Phase 2)

## Goal
Make `/about` (about.html) fully editable in Sanity, identical pattern to homepage. Keep the live page pixel-identical after the migration.

## Repo state
- Phase 1 (homepage) is shipped and working at https://www.structureme.com.au — Sanity-rendered.
- Existing schemas in `studio/schemas/`:
  - `homePage.ts` (singleton, _id=homePage)
  - `objects/cta.ts`, `pillar.ts`, `serviceCard.ts`, `metric.ts`, `approachRow.ts`, `highlightedText.ts`
  - `insightsPost.ts`, `author.ts`, `blockContent.ts`
- Existing build scripts:
  - `scripts/build-insights.mjs`
  - `scripts/build-homepage.mjs` — reads `index.html.pre-sanity-backup` as template, uses `safeReplace()` regex helpers, fail-soft on no doc, fail-closed on missing fields, prepends SANITY-GENERATED marker
- `package.json` build = `build:insights && build:homepage && build:studio`
- Studio singleton structure configured in `studio/sanity.config.ts` (Homepage at top of left rail, divider, then Insights/Authors)

## About page section inventory (about.html, 602 lines)

Sections in order:

1. **HERO** (`<section class="service-hero">`)
   - eyebrow: "— About · Structure Me"
   - title (with `<br>` and `<em>`): "An advisory firm<br />built like a <em>family office</em>."
   - lede paragraph (long)
   - bullets array (4 items)
   - primary CTA: { label: "Begin a conversation", href: "contact.html" }
   - secondary CTA: { label: "Meet the team", href: "#team" }
   - hero image: inline style `background-image: url('img/about-hero.jpg')` on `.service-hero-image`
   - caption: "Counsel · Capital · Structure"

2. **MISSION PILLAR** (`<section class="svc-pillar">`)
   - eyebrow: "— 01 · The brief we hold ourselves to"
   - title (with `<em>` and `<br>`): "A practice <em>built on judgement</em><br />not billable hours."
   - body: TWO paragraphs of prose
   - list (4 items)
   - link: { label: "Meet the team", href: "#team" }
   - figure image: inline style `background-image: url('img/about-team-3.jpg')` on `.svc-pillar-image`

3. **TEAM** (`<section class="svc-team" id="team">`)
   - eyebrow: "— 03 · The people"
   - title (with `<em>` and `<br>`): "A small team<br />of <em>senior advisers</em>."
   - lede paragraph (small)
   - team grid: 4 cards, each: { image (inline bg-image), role, name, bio, href }
     1. Principal · [Name One] · img/about-team-1.jpg · team/name-one.html
     2. Director, Capital · [Name Two] · img/about-team-2.jpg · team/name-two.html
     3. Director, Structuring · [Name Three] · img/about-team-3.jpg · team/name-three.html
     4. Counsel · [Name Four] · img/about-team-4.jpg · team/name-four.html

4. **FAMILY / NETWORK** (`<section class="svc-family">`)
   - eyebrow: "— 04 · A network of entrepreneurs"
   - title (with `<em>`): "A firm <em>defined by the company</em> it keeps."
   - lede paragraph
   - numbered list: 4 items, each { num (i. / ii. / iii. / iv.), text }
   - pullquote: "The work is technical. The relationships are not. The two together are what private advisory should always have been."

5. **CONTACT CTA** (`<section class="contact" id="contact">`) — SAME PATTERN AS HOMEPAGE
   - eyebrow: "— Begin"
   - title (with `<em>`): "Most engagements begin with a <em>quiet conversation</em>."
   - lede paragraph (long)
   - CTA: { label: "Request an introduction", href: "contact.html" }

6. **RELATED SERVICES** (`<section class="svc-related">`)
   - eyebrow: "— Disciplines"
   - title (with `<em>`): "What we <em>practise</em>."
   - 5 cards, each: { number, title, blurb, href }

## What you'll build

### A. New schemas (in `studio/schemas/`)
- `aboutPage.ts` — singleton (`_id: 'aboutPage'`, `__experimental_actions: ['update', 'publish']`)
- New object types:
  - `objects/teamMember.ts` — { image: string (path or URL), role: string, name: string, bio: text, href: string }
  - `objects/numberedListItem.ts` — { num: string (e.g. "i."), text: text }
  - `objects/relatedServiceCard.ts` — { number: string, title: string, blurb: text, href: string }
- The mission section uses **two paragraphs of prose** + a list — model `bodyParagraphs` as an array of strings (or a single Portable Text block array constrained to `normal` style + em/strong marks only)
- For headlines with `<em>` + `<br>` (mission, team, hero), use the same hybrid approach as the homepage `services.title` field: `type: 'text'` with `sanitizeInlineHtml` allowing `<em>`, `<strong>`, `<br />` only.
- Register `aboutPage` and all new objects in `studio/schemas/index.ts`.
- Update `studio/sanity.config.ts` so "About Page" appears in Studio's left rail as a second singleton item, below Homepage.

### B. Backup file
- Copy current `about.html` → `about.html.pre-sanity-backup`. Commit it.

### C. Build script
- `scripts/build-about.mjs` — mirror `scripts/build-homepage.mjs` exactly. Same patterns:
  - `safeReplace` regex helper
  - Template = read `about.html.pre-sanity-backup` each build
  - Fail soft (warn + exit 0) if no aboutPage doc
  - Fail closed (log + exit 1) if required field missing
  - Prepend SANITY-GENERATED marker

### D. Seed data
- `studio/seed-about.ndjson` — exactly current copy.
- Use the same NDJSON format as `seed-homepage.ndjson`. Single line.

### E. Wire into build
- `package.json`:
  ```
  "build:about": "node scripts/build-about.mjs",
  "build": "npm run build:insights && npm run build:homepage && npm run build:about && npm run build:studio"
  ```

### F. Test locally
- After writing the build script, write a test harness `scripts/test-about-render.mjs` (mirror the homepage test) that:
  1. Reads `seed-about.ndjson`
  2. Mocks the Sanity client to return that doc
  3. Renders, then diffs against `about.html.pre-sanity-backup` with whitespace-normalised comparison
  4. Outputs ✅ PASS or ❌ FAIL with the diff
- Run the test. It must pass before considering done.

### G. Commit phasing
1. `about: snapshot pre-sanity about.html as backup` (just the backup)
2. `about: add Sanity schemas + section objects for about CMS` (schemas + studio config)
3. `about: add build-about.mjs static-gen pipeline + seed data` (script + test + seed + package.json)

### H. DO NOT push to GitHub. Leave commits local for main agent to review.

## Safety constraints
- about.html MUST remain pixel-identical after migration.
- Do not touch styles.css, images, video files, decorative SVGs.
- Do not touch homepage code, index.html, or any other page's HTML.
- The team images currently use `style="background-image: url('img/about-team-N.jpg');"` inline — preserve this exactly. Schema stores image path as a string, build script writes it back into the style attribute.
- The contact section here uses *different copy* than the homepage contact section ("Most engagements begin with…" vs "Most of our work begins with…"). They are intentionally separate — don't share content between them. Each page has its own contact CTA fields.

## Files to create
- `studio/schemas/aboutPage.ts`
- `studio/schemas/objects/teamMember.ts`
- `studio/schemas/objects/numberedListItem.ts`
- `studio/schemas/objects/relatedServiceCard.ts`
- `scripts/build-about.mjs`
- `scripts/test-about-render.mjs`
- `studio/seed-about.ndjson`
- Update: `studio/schemas/index.ts`, `studio/sanity.config.ts`, `package.json`

## Report when done
- Summary of files created
- Output of test harness (must show ✅ PASS)
- Any divergences from this spec and why
- `git log --oneline -5` of new commits
