#!/usr/bin/env node
/**
 * build-homepage.mjs
 * Fetches the homePage singleton from Sanity and writes a rendered index.html.
 *
 * Strategy:
 *   - Read index.html.pre-sanity-backup as the immutable template (never index.html itself).
 *   - Use targeted regex-based string replacement for each editable region.
 *     This preserves untouched HTML byte-for-byte (no DOM normalisation artefacts).
 *   - If Sanity has no homePage doc, log a warning and exit 0 (leave index.html as-is).
 *   - If any required field is missing, log it and exit 1 — fail closed.
 *   - Prepend <!-- SANITY-GENERATED <ISO timestamp> --> to the output.
 */

import { createClient } from '@sanity/client'
import { toHTML } from '@portabletext/to-html'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'r3uuoahs'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = '2024-01-01'

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,
  token: process.env.SANITY_READ_TOKEN || undefined,
})

// ------------------------------------------------------------------
// HTML escape — for plain text fields going into HTML
// ------------------------------------------------------------------
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ------------------------------------------------------------------
// Sanitize inline HTML — allows only <em>, <strong>, <br />.
// Used for services.title which is stored as a raw HTML string.
// ------------------------------------------------------------------
function sanitizeInlineHtml(s) {
  if (!s) return ''
  // Strip any tag that isn't em, strong, or br
  return String(s)
    .replace(/<(?!\/?(?:em|strong|br)\b)[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '<br />')
}

// ------------------------------------------------------------------
// Constrained Portable Text renderer — only em and strong pass through.
// Returns inline HTML without block-level wrapper.
// ------------------------------------------------------------------
function renderHighlightedText(ptBlocks) {
  if (!ptBlocks || !Array.isArray(ptBlocks) || ptBlocks.length === 0) return ''
  const ptComponents = {
    block: {
      normal: ({ children }) => children, // no <p> wrapper
    },
    marks: {
      em: ({ children }) => `<em>${children}</em>`,
      strong: ({ children }) => `<strong>${children}</strong>`,
    },
  }
  return ptBlocks
    .map((block) => toHTML([block], { components: ptComponents }))
    .join(' ')
    .trim()
}

// ------------------------------------------------------------------
// safeReplace — like String.replace(re, fn) but uses a function to
// build the replacement string, avoiding $ backreference issues in
// content strings (e.g. "$2B" being treated as a regex backreference).
// ------------------------------------------------------------------
function safeReplace(html, regex, buildFn) {
  return html.replace(regex, (...args) => {
    // args: [fullMatch, ...groups, offset, originalString]
    // groups are args[1..n-2]
    const groups = args.slice(1, -2)
    return buildFn(...groups)
  })
}

// ------------------------------------------------------------------
// Required-field guard — exits 1 if value is undefined/null/empty
// ------------------------------------------------------------------
function requireField(value, fieldPath) {
  if (value === undefined || value === null || value === '') {
    console.error(`  ✗ Required Sanity field missing: ${fieldPath}`)
    console.error('  ✗ Refusing to write a partial index.html. Fix the homePage doc and rebuild.')
    process.exit(1)
  }
  return value
}

// ------------------------------------------------------------------
// Arrow SVG snippets — must match original HTML whitespace exactly
// ------------------------------------------------------------------
const arrowSvg14 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>`

const arrowSvg14Contact = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>`

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  console.log(`▸ Sanity homepage build — project=${PROJECT_ID} dataset=${DATASET}`)

  // ── Fetch doc ──────────────────────────────────────────────────
  let doc
  try {
    doc = await client.fetch(`*[_type == "homePage" && _id == "homePage"][0]`)
  } catch (err) {
    console.warn(`  ⚠ Sanity fetch failed: ${err.message}`)
    console.warn('  ⚠ Skipping homepage build (leaving index.html as-is).')
    process.exit(0)
  }

  if (!doc) {
    console.warn('  ⚠ No homePage doc found in Sanity — leaving index.html as-is.')
    console.warn('  ⚠ Import seed-homepage.ndjson to populate content.')
    process.exit(0)
  }

  console.log('  ✓ homePage doc fetched')

  // ── Read template ──────────────────────────────────────────────
  const templatePath = path.join(ROOT, 'index.html.pre-sanity-backup')
  if (!existsSync(templatePath)) {
    console.error('  ✗ index.html.pre-sanity-backup not found — run the backup step first.')
    process.exit(1)
  }
  let html = readFileSync(templatePath, 'utf8')

  // ── Validate all required fields up front ─────────────────────
  const hero = requireField(doc.hero, 'hero')
  requireField(hero.eyebrow, 'hero.eyebrow')
  requireField(hero.headlineLines, 'hero.headlineLines')
  requireField(hero.sub, 'hero.sub')
  requireField(hero.cta, 'hero.cta')
  requireField(hero.cta.label, 'hero.cta.label')
  requireField(hero.cta.href, 'hero.cta.href')
  requireField(hero.pillars, 'hero.pillars')

  const creds = requireField(doc.creds, 'creds')
  requireField(creds.label, 'creds.label')
  requireField(creds.items, 'creds.items')

  const divider = requireField(doc.divider, 'divider')
  requireField(divider.caption, 'divider.caption')

  const services = requireField(doc.services, 'services')
  requireField(services.eyebrow, 'services.eyebrow')
  requireField(services.title, 'services.title')
  requireField(services.lede, 'services.lede')
  requireField(services.cards, 'services.cards')

  const philosophy = requireField(doc.philosophy, 'philosophy')
  requireField(philosophy.quote, 'philosophy.quote')
  requireField(philosophy.attribution, 'philosophy.attribution')

  const metrics = requireField(doc.metrics, 'metrics')
  requireField(metrics.eyebrow, 'metrics.eyebrow')
  requireField(metrics.title, 'metrics.title')
  requireField(metrics.items, 'metrics.items')

  const approach = requireField(doc.approach, 'approach')
  requireField(approach.imageCaption, 'approach.imageCaption')
  requireField(approach.eyebrow, 'approach.eyebrow')
  requireField(approach.title, 'approach.title')
  requireField(approach.rows, 'approach.rows')

  const contactCta = requireField(doc.contactCta, 'contactCta')
  requireField(contactCta.eyebrow, 'contactCta.eyebrow')
  requireField(contactCta.title, 'contactCta.title')
  requireField(contactCta.lede, 'contactCta.lede')
  requireField(contactCta.cta, 'contactCta.cta')
  requireField(contactCta.cta.label, 'contactCta.cta.label')
  requireField(contactCta.cta.href, 'contactCta.cta.href')

  console.log('  ✓ all required fields present')

  // ── HERO: Eyebrow ──────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<span class="eyebrow-text">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(hero.eyebrow)}${post}`
  )

  // ── HERO: Headline lines ───────────────────────────────────────
  const linesHtml = hero.headlineLines
    .map((line) => `<span class="hl-line">${renderHighlightedText(line)}</span>`)
    .join('\n          ')
  html = safeReplace(
    html,
    /<h1 class="hero-headline">[\s\S]*?<\/h1>/,
    () => `<h1 class="hero-headline">\n          ${linesHtml}\n        </h1>`
  )

  // ── HERO: Sub ──────────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<p class="hero-sub">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n          ${escapeHtml(hero.sub)}\n        ${post}`
  )

  // ── HERO: CTA href ─────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<div class="hero-cta">[\s\S]*?<a href=")[^"]*(")/,
    (pre, post) => `${pre}${hero.cta.href}${post}`
  )
  // ── HERO: CTA content ─────────────────────────────────────────
  html = safeReplace(
    html,
    /(<div class="hero-cta">[\s\S]*?<a [^>]*class="btn btn-primary"[^>]*>)([\s\S]*?)(<\/a>)/,
    (pre, _old, post) => `${pre}\n            <span>${escapeHtml(hero.cta.label)}</span>\n            ${arrowSvg14}\n          ${post}`
  )

  // ── HERO: Pillars ──────────────────────────────────────────────
  const pillarsHtml = hero.pillars
    .map(
      (p) =>
        `<div class="pillar">\n            <span class="pillar-num">${escapeHtml(p.num)}</span>\n            <span class="pillar-label">${escapeHtml(p.label)}</span>\n          </div>`
    )
    .join('\n          ')
  html = safeReplace(
    html,
    /(<div class="hero-pillars">)([\s\S]*?)(<\/div>(\s*<\/div>\s*<\/section>[\s\S]*?MARQUEE))/,
    (pre, _old, post) =>
      `${pre}\n          ${pillarsHtml}\n        </div>\n      </div>\n\n    </section>\n\n    <!-- ================================================================\n         MARQUEE`
  )

  // ── CREDS: label ──────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<span class="creds-label">)([^<]*?)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(creds.label)}${post}`
  )
  // ── CREDS: list ───────────────────────────────────────────────
  const credsListHtml = creds.items
    .map((t, i, arr) =>
      `<span>${escapeHtml(t)}</span>${i < arr.length - 1 ? '\n          <span class="dot">·</span>' : ''}`
    )
    .join('\n          ')
  html = safeReplace(
    html,
    /(<div class="creds-list">)([\s\S]*?)(<\/div>([\s\S]*?<\/section>[\s\S]*?FULL-BLEED))/,
    (pre, _old, post) =>
      `${pre}\n          ${credsListHtml}\n        </div>\n      </div>\n    </section>\n\n    <!-- ================================================================\n         FULL-BLEED`
  )

  // ── DIVIDER: caption ──────────────────────────────────────────
  html = safeReplace(
    html,
    /(<div class="divider-caption">[\s\S]*?<span class="divider-rule"><\/span>\s*<span>)([^<]*?)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(divider.caption)}${post}`
  )

  // ── SERVICES: eyebrow ─────────────────────────────────────────
  html = safeReplace(
    html,
    /(<!-- ={64}\s*SERVICES[\s\S]*?<span class="section-eyebrow">)([^<]*?)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(services.eyebrow)}${post}`
  )

  // ── SERVICES: title (raw HTML with br and em allowed) ─────────
  html = safeReplace(
    html,
    /(<section class="services"[\s\S]*?<h2 class="section-title">)([\s\S]*?)(<\/h2>[\s\S]*?<p class="section-lede">)/,
    (pre, _old, post) => `${pre}\n          ${sanitizeInlineHtml(services.title)}\n        ${post}`
  )

  // ── SERVICES: lede ────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<section class="services"[\s\S]*?<p class="section-lede">)([\s\S]*?)(<\/p>[\s\S]*?<div class="service-grid">)/,
    (pre, _old, post) => `${pre}\n          ${escapeHtml(services.lede)}\n        ${post}`
  )

  // ── SERVICE CARDS ─────────────────────────────────────────────
  const serviceCardsHtml = services.cards
    .map((card, i) => {
      const articleIds = ['advisory', null, 'international', 'familyoffice', 'presale']
      const isFeature = i === 2
      const articleId = articleIds[i]
      const idAttr = articleId ? ` id="${articleId}"` : ''
      const featureClass = isFeature ? ' service--feature' : ''
      const imgClass = card.imageCssClass || `service-image--card${i + 1}`
      const pointsHtml = Array.isArray(card.points)
        ? card.points.map((pt) => `<li>${escapeHtml(pt)}</li>`).join('\n            ')
        : ''
      return `\n        <article class="service${featureClass}"${idAttr}>
          <div class="service-image ${imgClass}" aria-hidden="true"></div>
          <div class="service-num">${escapeHtml(card.number)}</div>
          <h3 class="service-name">${escapeHtml(card.name)}</h3>
          <p class="service-copy">
            ${escapeHtml(card.copy)}
          </p>
          <ul class="service-points">
            ${pointsHtml}
          </ul>
          <a href="${card.ctaHref}" class="service-link">
            <span>${escapeHtml(card.ctaLabel)}</span>
            ${arrowSvg14}
          </a>
        </article>`
    })
    .join('\n')
  html = safeReplace(
    html,
    /(<div class="service-grid">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- ={64}\s*PHILOSOPHY)/,
    (pre, _old, post) => `${pre}${serviceCardsHtml}\n      ${post}`
  )

  // ── PHILOSOPHY: quote ─────────────────────────────────────────
  html = safeReplace(
    html,
    /(<blockquote class="philosophy-quote">)([\s\S]*?)(<\/blockquote>)/,
    (pre, _old, post) => `${pre}\n          ${renderHighlightedText(philosophy.quote)}\n        ${post}`
  )

  // ── PHILOSOPHY: attribution ───────────────────────────────────
  html = safeReplace(
    html,
    /(<span class="attr-text">)([^<]*?)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(philosophy.attribution)}${post}`
  )

  // ── METRICS: eyebrow ──────────────────────────────────────────
  html = safeReplace(
    html,
    /(<!-- ={64}\s*METRICS[\s\S]*?<span class="section-eyebrow">)([^<]*?)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(metrics.eyebrow)}${post}`
  )

  // ── METRICS: title ────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<section class="metrics"[\s\S]*?<h2 class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}${renderHighlightedText(metrics.title)}${post}`
  )

  // ── METRICS: items ────────────────────────────────────────────
  const metricsItemsHtml = metrics.items
    .map((m) => {
      const suffixHtml = m.suffix
        ? `\n          <div class="metric-suffix">${escapeHtml(m.suffix)}</div>`
        : ''
      const plusHtml = m.plus !== false ? `<span class="num-plus">+</span>` : ''
      return `\n        <div class="metric">
          <div class="metric-num">
            <span class="num">${escapeHtml(m.num)}</span>${plusHtml}
          </div>${suffixHtml}
          <div class="metric-rule"></div>
          <p class="metric-label">
            ${escapeHtml(m.label)}
          </p>
        </div>`
    })
    .join('\n')
  html = safeReplace(
    html,
    /(<div class="metric-grid">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- ={64}\s*APPROACH)/,
    (pre, _old, post) => `${pre}${metricsItemsHtml}\n      ${post}`
  )

  // ── APPROACH: image caption ───────────────────────────────────
  // Original: <span class="approach-image-caption">\n            <span class="divider-rule"></span>\n            Designed, not assembled\n          </span>
  html = safeReplace(
    html,
    /(<span class="approach-image-caption">)([\s\S]*?)(<\/span>\s*<\/aside>)/,
    () => `<span class="approach-image-caption">\n            <span class="divider-rule"></span>\n            ${escapeHtml(approach.imageCaption)}\n          </span>\n        </aside>`
  )

  // ── APPROACH: eyebrow ─────────────────────────────────────────
  html = safeReplace(
    html,
    /(<!-- ={64}\s*APPROACH[\s\S]*?<span class="section-eyebrow">)([^<]*?)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(approach.eyebrow)}${post}`
  )

  // ── APPROACH: title ───────────────────────────────────────────
  html = safeReplace(
    html,
    /(<section class="approach"[\s\S]*?<h2 class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) =>
      `${pre}\n              ${renderHighlightedText(approach.title)}\n            ${post}`
  )

  // ── APPROACH: rows ────────────────────────────────────────────
  const approachRowsHtml = approach.rows
    .map((row) => {
      return `\n            <div class="approach-row">
              <div class="approach-num">${escapeHtml(row.num)}</div>
              <div class="approach-body">
                <h3 class="approach-title">${escapeHtml(row.title)}</h3>
                <p>
                  ${escapeHtml(row.body)}
                </p>
              </div>
            </div>`
    })
    .join('\n')
  html = safeReplace(
    html,
    /(<div class="approach-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<!-- ={64}\s*CONTACT)/,
    (pre, _old, post) => `${pre}${approachRowsHtml}\n          ${post}`
  )

  // ── CONTACT CTA: eyebrow ──────────────────────────────────────
  html = safeReplace(
    html,
    /(<!-- ={64}\s*CONTACT[\s\S]*?<span class="section-eyebrow">)([^<]*?)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(contactCta.eyebrow)}${post}`
  )

  // ── CONTACT CTA: title ────────────────────────────────────────
  html = safeReplace(
    html,
    /(<h2 class="contact-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) =>
      `${pre}\n            ${renderHighlightedText(contactCta.title)}\n          ${post}`
  )

  // ── CONTACT CTA: lede ─────────────────────────────────────────
  html = safeReplace(
    html,
    /(<p class="contact-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) =>
      `${pre}\n            ${escapeHtml(contactCta.lede)}\n          ${post}`
  )

  // ── CONTACT CTA: button ───────────────────────────────────────
  html = safeReplace(
    html,
    /(<div class="contact-actions">[\s\S]*?<a href=")[^"]*(" class="btn btn-primary btn-lg">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${contactCta.cta.href}${pre2}\n              <span>${escapeHtml(contactCta.cta.label)}</span>\n              ${arrowSvg14Contact}\n            ${post}`
  )

  // ── Write output ───────────────────────────────────────────────
  const marker = `<!-- SANITY-GENERATED ${new Date().toISOString()} — do not edit by hand. Source: Sanity project ${PROJECT_ID}. Edits will be overwritten on next build. -->`
  const output = marker + '\n' + html

  const outPath = path.join(ROOT, 'index.html')
  writeFileSync(outPath, output)
  console.log('  ✓ wrote index.html')
  console.log('▸ Done.')
}

main().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
