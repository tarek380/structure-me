# Sanity migration — Phase 5 (Image management)

## Goal
Let the user upload images via Sanity Studio and have the live site swap them in automatically. Keep current `img/...` path strings as fallback so nothing breaks if no Sanity image is uploaded yet.

## Strategy: dual-field with fallback

For every existing image string field (e.g. `image: 'img/advisory-structures.jpg'`), add a SECOND field that holds a Sanity image asset reference. In the build script: if the Sanity image is set, generate a CDN URL via `@sanity/image-url`; otherwise use the existing path string.

This is **backward-compatible** — no seed data changes are needed, no breaking changes to existing builds. Tarek can upload images one-at-a-time as he gets new ones.

### Schema pattern

For each existing field like `image: { type: 'string' }`, add a companion `imageAsset: { type: 'image' }` next to it:

```ts
defineField({
  name: 'image',
  title: 'Image path (fallback)',
  type: 'string',
  description: 'Relative path under img/. Used only if no asset uploaded below.',
}),
defineField({
  name: 'imageAsset',
  title: 'Image (upload)',
  type: 'image',
  description: 'Upload here to override the path above. Sanity-hosted, CDN-delivered.',
  options: { hotspot: true },
}),
```

### Build script helper

Add to each build script (or extract to a shared helper):

```js
import imageUrlBuilder from '@sanity/image-url'
const builder = imageUrlBuilder({ projectId: PROJECT_ID, dataset: DATASET })

function resolveImage(field, fallbackPath, opts = {}) {
  // field is the imageAsset object from Sanity, fallbackPath is the string field
  if (field && field.asset && field.asset._ref) {
    const w = opts.width || 1600
    const q = opts.quality || 85
    return builder.image(field).width(w).quality(q).auto('format').url()
  }
  return fallbackPath || ''
}
```

In the build script's HTML replacement: instead of `image: doc.image`, use `image: resolveImage(doc.imageAsset, doc.image)`.

For inline-style background images, the regex replacement looks for:
`style="background-image: url('img/...');"`
And replaces the URL with `resolveImage(...)`. The single-quote pattern must be preserved exactly.

## Scope (which fields)

### Homepage (1 image)
- N/A — hero is a `<video>`, not an image. Skip.
- Update: og:image meta is currently hardcoded to `img/about-hero.jpg`. Could add `seoImage` field. Optional.

### About (5 images)
- `hero.image` → about-hero.jpg
- `team[].image` (4 entries) → about-team-1..4.jpg

### Service pages (5 pages × ~6 images = ~30)
Per page:
- `hero.image` (some pages have it, some don't — advisory has no hero image)
- `pillars[0..4].image` — 5 per page

### Insights (managed already)
- Featured + cards are driven by insightsPost documents which ALREADY have a `mainImage` Sanity image field. No work needed.
- The insights-newsletter band has no image. Skip.

### Subscribe / Thank-you / Contact
- Contact has no inline images. Skip.
- Subscribe-details: check backup — probably no image. Skip if none.
- Thank-you-subscribe: same. Skip.

## Required dependency

`@sanity/image-url` — already a dep (used by build-insights.mjs). Confirm in package.json.

## What to build

### 1. Add `imageAsset` field to schemas
Modify these existing schemas (keep existing string fields, ADD a companion image field):
- `studio/schemas/aboutPage.ts`:
  - `hero` object: add `imageAsset`
  - `teamMember` object (in `objects/teamMember.ts`): add `imageAsset`
- `studio/schemas/servicePage.ts`:
  - `hero` object: add `imageAsset`
  - `servicePillar` object: add `imageAsset`

### 2. Shared image-url helper
Create `scripts/lib/sanity-image.mjs` exporting `resolveImage(field, fallback, opts)`. Import in all build scripts that handle images.

### 3. Update build scripts
- `scripts/build-about.mjs` — call `resolveImage` for hero + each team image
- `scripts/build-services.mjs` — call `resolveImage` for hero + each pillar image

### 4. NO seed-data changes required
Existing seeds keep the string paths. The new `imageAsset` field is optional and starts empty for every doc. Users can upload images one-at-a-time via Studio.

### 5. Test harness
Re-run `test-about-render.mjs` and `test-services-render.mjs` — they should still pass since no `imageAsset` is set in seed → fallback path is used → output identical.

## Commits
1. `feat: shared sanity-image url helper`
2. `feat: image-asset upload fields on about + service schemas`
3. `feat: build scripts resolve uploaded image OR fall back to img/ path`

DO NOT push. Parent agent pushes + verifies.

## Done criteria
- All existing tests pass (about + services + phase4).
- Sanity Studio shows "Image (upload)" field next to each image-path field on About + Service pages.
- Build still produces byte-identical HTML when no asset uploaded.
- Uploading an asset in Studio + rebuilding emits a CDN URL in place of the `img/` path.

## Test plan after deploy
Tarek uploads ONE image in Studio (e.g. on aboutPage.hero), triggers a rebuild (manual deploy via Vercel), and verifies the live about page hero now points to `https://cdn.sanity.io/images/...` instead of `img/about-hero.jpg`.

## Gotchas
- `@sanity/image-url` returns URLs starting with `https://cdn.sanity.io/...`. Make sure the replacement preserves the single-quote wrapping of the background-image URL.
- Hotspot/crop info from Sanity should be honoured — `.fit('crop').crop('focalpoint')` or rely on `.url()` defaults plus the hotspot field in schema.
- For og:image meta (full URLs), don't add a width/quality URL builder — just emit the bare `.url()`.
- The schema field `imageAsset` (not `image`) is intentional — avoids renaming and lets the existing string field stay for fallback.
