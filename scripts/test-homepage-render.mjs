#!/usr/bin/env node
/**
 * test-homepage-render.mjs
 * Local test: reads seed-homepage.ndjson, runs the same render logic as build-homepage.mjs,
 * writes index.html.test-render, then diffs against index.html.pre-sanity-backup.
 *
 * Comparison: normalizes whitespace within text nodes so that line-wrapped text
 * in the original and single-line text from Sanity compare as equal.
 *
 * Usage: node scripts/test-homepage-render.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { toHTML } from '@portabletext/to-html'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const seedPath = path.join(ROOT, 'studio/seed-homepage.ndjson')
const doc = JSON.parse(readFileSync(seedPath, 'utf8').trim())

// ── Helpers (must mirror build-homepage.mjs exactly) ──────────────────────

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeInlineHtml(s) {
  if (!s) return ''
  return String(s)
    .replace(/<(?!\/?(?:em|strong|br)\b)[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '<br />')
}

function renderHighlightedText(ptBlocks) {
  if (!ptBlocks || !Array.isArray(ptBlocks) || ptBlocks.length === 0) return ''
  const ptComponents = {
    block: { normal: ({ children }) => children },
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

function safeReplace(html, regex, buildFn) {
  return html.replace(regex, (...args) => {
    const groups = args.slice(1, -2)
    return buildFn(...groups)
  })
}

const arrowSvg14 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>`

const arrowSvg14Contact = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>`

// ── Run render (same logic as build-homepage.mjs) ─────────────────────────

const templatePath = path.join(ROOT, 'index.html.pre-sanity-backup')
let html = readFileSync(templatePath, 'utf8')

const hero = doc.hero
const creds = doc.creds
const divider = doc.divider
const services = doc.services
const philosophy = doc.philosophy
const metrics = doc.metrics
const approach = doc.approach
const contactCta = doc.contactCta

// HERO: Eyebrow
html = safeReplace(html, /(<span class="eyebrow-text">)([^<]*)(<\/span>)/, (pre, _old, post) => `${pre}${escapeHtml(hero.eyebrow)}${post}`)

// HERO: Headline
const linesHtml = hero.headlineLines.map((line) => `<span class="hl-line">${renderHighlightedText(line)}</span>`).join('\n          ')
html = safeReplace(html, /<h1 class="hero-headline">[\s\S]*?<\/h1>/, () => `<h1 class="hero-headline">\n          ${linesHtml}\n        </h1>`)

// HERO: Sub
html = safeReplace(html, /(<p class="hero-sub">)([\s\S]*?)(<\/p>)/, (pre, _old, post) => `${pre}\n          ${escapeHtml(hero.sub)}\n        ${post}`)

// HERO: CTA href
html = safeReplace(html, /(<div class="hero-cta">[\s\S]*?<a href=")[^"]*(")/,  (pre, post) => `${pre}${hero.cta.href}${post}`)
// HERO: CTA content
html = safeReplace(html, /(<div class="hero-cta">[\s\S]*?<a [^>]*class="btn btn-primary"[^>]*>)([\s\S]*?)(<\/a>)/, (pre, _old, post) => `${pre}\n            <span>${escapeHtml(hero.cta.label)}</span>\n            ${arrowSvg14}\n          ${post}`)

// HERO: Pillars
const pillarsHtml = hero.pillars.map((p) => `<div class="pillar">\n            <span class="pillar-num">${escapeHtml(p.num)}</span>\n            <span class="pillar-label">${escapeHtml(p.label)}</span>\n          </div>`).join('\n          ')
html = safeReplace(html, /(<div class="hero-pillars">)([\s\S]*?)(<\/div>(\s*<\/div>\s*<\/section>[\s\S]*?MARQUEE))/, (pre, _old, post) => `${pre}\n          ${pillarsHtml}\n        </div>\n      </div>\n\n    </section>\n\n    <!-- ================================================================\n         MARQUEE`)

// CREDS: label
html = safeReplace(html, /(<span class="creds-label">)([^<]*?)(<\/span>)/, (pre, _old, post) => `${pre}${escapeHtml(creds.label)}${post}`)
// CREDS: list
const credsListHtml = creds.items.map((t, i, arr) => `<span>${escapeHtml(t)}</span>${i < arr.length - 1 ? '\n          <span class="dot">·</span>' : ''}`).join('\n          ')
html = safeReplace(html, /(<div class="creds-list">)([\s\S]*?)(<\/div>([\s\S]*?<\/section>[\s\S]*?FULL-BLEED))/, (pre, _old, post) => `${pre}\n          ${credsListHtml}\n        </div>\n      </div>\n    </section>\n\n    <!-- ================================================================\n         FULL-BLEED`)

// DIVIDER: caption
html = safeReplace(html, /(<div class="divider-caption">[\s\S]*?<span class="divider-rule"><\/span>\s*<span>)([^<]*?)(<\/span>)/, (pre, _old, post) => `${pre}${escapeHtml(divider.caption)}${post}`)

// SERVICES: eyebrow
html = safeReplace(html, /(<!-- ={64}\s*SERVICES[\s\S]*?<span class="section-eyebrow">)([^<]*?)(<\/span>)/, (pre, _old, post) => `${pre}${escapeHtml(services.eyebrow)}${post}`)
// SERVICES: title (raw HTML)
html = safeReplace(html, /(<section class="services"[\s\S]*?<h2 class="section-title">)([\s\S]*?)(<\/h2>[\s\S]*?<p class="section-lede">)/, (pre, _old, post) => `${pre}\n          ${sanitizeInlineHtml(services.title)}\n        ${post}`)
// SERVICES: lede
html = safeReplace(html, /(<section class="services"[\s\S]*?<p class="section-lede">)([\s\S]*?)(<\/p>[\s\S]*?<div class="service-grid">)/, (pre, _old, post) => `${pre}\n          ${escapeHtml(services.lede)}\n        ${post}`)

// SERVICE CARDS
const serviceCardsHtml = services.cards.map((card, i) => {
  const articleIds = ['advisory', null, 'international', 'familyoffice', 'presale']
  const isFeature = i === 2
  const articleId = articleIds[i]
  const idAttr = articleId ? ` id="${articleId}"` : ''
  const featureClass = isFeature ? ' service--feature' : ''
  const imgClass = card.imageCssClass || `service-image--card${i + 1}`
  const pointsHtml = Array.isArray(card.points) ? card.points.map((pt) => `<li>${escapeHtml(pt)}</li>`).join('\n            ') : ''
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
}).join('\n')
html = safeReplace(html, /(<div class="service-grid">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- ={64}\s*PHILOSOPHY)/, (pre, _old, post) => `${pre}${serviceCardsHtml}\n      ${post}`)

// PHILOSOPHY: quote
html = safeReplace(html, /(<blockquote class="philosophy-quote">)([\s\S]*?)(<\/blockquote>)/, (pre, _old, post) => `${pre}\n          ${renderHighlightedText(philosophy.quote)}\n        ${post}`)
// PHILOSOPHY: attribution
html = safeReplace(html, /(<span class="attr-text">)([^<]*?)(<\/span>)/, (pre, _old, post) => `${pre}${escapeHtml(philosophy.attribution)}${post}`)

// METRICS: eyebrow
html = safeReplace(html, /(<!-- ={64}\s*METRICS[\s\S]*?<span class="section-eyebrow">)([^<]*?)(<\/span>)/, (pre, _old, post) => `${pre}${escapeHtml(metrics.eyebrow)}${post}`)
// METRICS: title
html = safeReplace(html, /(<section class="metrics"[\s\S]*?<h2 class="section-title">)([\s\S]*?)(<\/h2>)/, (pre, _old, post) => `${pre}${renderHighlightedText(metrics.title)}${post}`)
// METRICS: items
const metricsItemsHtml = metrics.items.map((m) => {
  const suffixHtml = m.suffix ? `\n          <div class="metric-suffix">${escapeHtml(m.suffix)}</div>` : ''
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
}).join('\n')
html = safeReplace(html, /(<div class="metric-grid">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- ={64}\s*APPROACH)/, (pre, _old, post) => `${pre}${metricsItemsHtml}\n      ${post}`)

// APPROACH: image caption
html = safeReplace(html, /(<span class="approach-image-caption">)([\s\S]*?)(<\/span>\s*<\/aside>)/, (pre, _old, post) => `${pre}\n            <span class="divider-rule"></span>\n            ${escapeHtml(approach.imageCaption)}\n          </span>\n        </aside>`)
// APPROACH: eyebrow
html = safeReplace(html, /(<!-- ={64}\s*APPROACH[\s\S]*?<span class="section-eyebrow">)([^<]*?)(<\/span>)/, (pre, _old, post) => `${pre}${escapeHtml(approach.eyebrow)}${post}`)
// APPROACH: title
html = safeReplace(html, /(<section class="approach"[\s\S]*?<h2 class="section-title">)([\s\S]*?)(<\/h2>)/, (pre, _old, post) => `${pre}\n              ${renderHighlightedText(approach.title)}\n            ${post}`)
// APPROACH: rows
const approachRowsHtml = approach.rows.map((row) => `\n            <div class="approach-row">
              <div class="approach-num">${escapeHtml(row.num)}</div>
              <div class="approach-body">
                <h3 class="approach-title">${escapeHtml(row.title)}</h3>
                <p>
                  ${escapeHtml(row.body)}
                </p>
              </div>
            </div>`).join('\n')
html = safeReplace(html, /(<div class="approach-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<!-- ={64}\s*CONTACT)/, (pre, _old, post) => `${pre}${approachRowsHtml}\n          ${post}`)

// CONTACT CTA: eyebrow
html = safeReplace(html, /(<!-- ={64}\s*CONTACT[\s\S]*?<span class="section-eyebrow">)([^<]*?)(<\/span>)/, (pre, _old, post) => `${pre}${escapeHtml(contactCta.eyebrow)}${post}`)
// CONTACT CTA: title
html = safeReplace(html, /(<h2 class="contact-title">)([\s\S]*?)(<\/h2>)/, (pre, _old, post) => `${pre}\n            ${renderHighlightedText(contactCta.title)}\n          ${post}`)
// CONTACT CTA: lede
html = safeReplace(html, /(<p class="contact-lede">)([\s\S]*?)(<\/p>)/, (pre, _old, post) => `${pre}\n            ${escapeHtml(contactCta.lede)}\n          ${post}`)
// CONTACT CTA: button
html = safeReplace(html, /(<div class="contact-actions">[\s\S]*?<a href=")[^"]*(" class="btn btn-primary btn-lg">)([\s\S]*?)(<\/a>)/, (pre1, pre2, _old, post) => `${pre1}${contactCta.cta.href}${pre2}\n              <span>${escapeHtml(contactCta.cta.label)}</span>\n              ${arrowSvg14Contact}\n            ${post}`)

// ── Write test output ──────────────────────────────────────────────────────
const marker = `<!-- SANITY-GENERATED TEST ${new Date().toISOString()} -->`
const output = marker + '\n' + html
const testOutPath = path.join(ROOT, 'index.html.test-render')
writeFileSync(testOutPath, output)
console.log('✓ Test render written to index.html.test-render')

// ── Semantic diff ──────────────────────────────────────────────────────────
// Normalize whitespace within text nodes (not inside tags) for comparison.
// This accounts for the fact that Sanity stores single-line text while the
// original HTML has line-wrapped text. Both render identically in a browser.
function normalizeHtmlWhitespace(htmlStr) {
  return htmlStr
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Collapse whitespace in text nodes (content between > and <)
    // Handles both single-line and line-wrapped text in the original HTML.
    .replace(/>([^<]+)</g, (m, textContent) => {
      if (/\S/.test(textContent)) {
        return '>' + textContent.replace(/\s+/g, ' ').trim() + '<'
      }
      return m
    })
    // Strip trailing whitespace per line
    .split('\n').map((l) => l.trimEnd()).join('\n')
    .trim()
}

const renderedContent = output.split('\n').slice(1).join('\n')
const backupContent = readFileSync(templatePath, 'utf8')

const renderedNorm = normalizeHtmlWhitespace(renderedContent)
const backupNorm = normalizeHtmlWhitespace(backupContent)

if (renderedNorm === backupNorm) {
  console.log('✅ PASS — rendered HTML is semantically identical to backup (whitespace-normalised).')
  process.exit(0)
} else {
  const rLines = renderedNorm.split('\n')
  const bLines = backupNorm.split('\n')
  const maxLen = Math.max(rLines.length, bLines.length)
  let firstDiff = -1
  for (let i = 0; i < maxLen; i++) {
    if (rLines[i] !== bLines[i]) { firstDiff = i; break }
  }
  console.error(`❌ FAIL — first difference at line ${firstDiff + 1}`)
  if (firstDiff >= 0) {
    const s = Math.max(0, firstDiff - 3)
    const e = Math.min(maxLen, firstDiff + 8)
    console.error('\n--- BACKUP (normalised) ---')
    for (let i = s; i < e; i++) {
      const mark = i === firstDiff ? '>' : ' '
      console.error(`${mark} ${String(i+1).padStart(4)}: ${bLines[i] ?? '(missing)'}`)
    }
    console.error('\n--- RENDERED (normalised) ---')
    for (let i = s; i < e; i++) {
      const mark = i === firstDiff ? '>' : ' '
      console.error(`${mark} ${String(i+1).padStart(4)}: ${rLines[i] ?? '(missing)'}`)
    }
  }
  let diffCount = 0
  for (let i = 0; i < maxLen; i++) { if (rLines[i] !== bLines[i]) diffCount++ }
  console.error(`\nTotal differing lines: ${diffCount}`)
  process.exit(1)
}
