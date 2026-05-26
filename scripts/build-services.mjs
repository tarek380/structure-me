#!/usr/bin/env node
/**
 * build-services.mjs
 * Fetches the 5 servicePage documents from Sanity and writes the 5 service HTML files.
 *
 * Strategy mirrors build-about.mjs:
 *   - Read <slug>.html.pre-sanity-backup as the immutable template (never the live file).
 *   - Use targeted regex-based string replacement for each editable region.
 *   - If Sanity has no doc for a slug, warn and skip that slug (leave its html as-is).
 *   - If any required field is missing, log it and exit 1 — fail closed.
 *   - Prepend <!-- SANITY-GENERATED <ISO> --> to each output.
 *
 * Content fields are stored as raw inline HTML (entities preserved by the
 * seed extractor) and are emitted unescaped. The Sanity studio inputs are
 * trusted text — we are not rendering user-submitted content.
 */

import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'r3uuoahs'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = '2024-01-01'

const SLUGS = ['advisory', 'business-structuring', 'international', 'family-office', 'exit-strategy']

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,
  token: process.env.SANITY_READ_TOKEN || undefined,
})

// ------------------------------------------------------------------
// safeReplace — like String.replace(re, fn) but uses a function to
// build the replacement string, avoiding $ backreference issues.
// ------------------------------------------------------------------
function safeReplace(html, regex, buildFn) {
  return html.replace(regex, (...args) => {
    const groups = args.slice(1, -2)
    return buildFn(...groups)
  })
}

// ------------------------------------------------------------------
// Required-field guard
// ------------------------------------------------------------------
function requireField(value, fieldPath, slug) {
  if (value === undefined || value === null || value === '') {
    console.error(`  ✗ Required Sanity field missing: ${fieldPath} (slug=${slug})`)
    console.error(`  ✗ Refusing to write a partial ${slug}.html. Fix the servicePage doc and rebuild.`)
    process.exit(1)
  }
  return value
}

// ------------------------------------------------------------------
// Render — pure function. Takes original html + doc, returns new html.
// ------------------------------------------------------------------
export function renderServicePage(originalHtml, doc, slug) {
  let html = originalHtml

  const hero = requireField(doc.hero, 'hero', slug)
  requireField(hero.eyebrow, 'hero.eyebrow', slug)
  requireField(hero.title, 'hero.title', slug)
  requireField(hero.lede, 'hero.lede', slug)
  requireField(hero.caption, 'hero.caption', slug)
  // hero.heroImage optional (advisory has no inline style)

  const pillars = requireField(doc.pillars, 'pillars', slug)
  if (pillars.length !== 5) {
    console.error(`  ✗ Expected 5 pillars, got ${pillars.length} for slug=${slug}`)
    process.exit(1)
  }
  pillars.forEach((p, i) => {
    requireField(p.eyebrow, `pillars[${i}].eyebrow`, slug)
    requireField(p.title, `pillars[${i}].title`, slug)
    requireField(p.bodyParagraphs, `pillars[${i}].bodyParagraphs`, slug)
    requireField(p.layout, `pillars[${i}].layout`, slug)
    requireField(p.linkLabel, `pillars[${i}].linkLabel`, slug)
    requireField(p.linkHref, `pillars[${i}].linkHref`, slug)
    requireField(p.image, `pillars[${i}].image`, slug)
    if (p.layout === 'list') {
      requireField(p.listItems, `pillars[${i}].listItems`, slug)
    } else if (p.layout === 'two-column') {
      requireField(p.columns, `pillars[${i}].columns`, slug)
    } else {
      console.error(`  ✗ Unknown pillar layout "${p.layout}" at pillars[${i}] (slug=${slug})`)
      process.exit(1)
    }
  })

  const family = requireField(doc.family, 'family', slug)
  requireField(family.eyebrow, 'family.eyebrow', slug)
  requireField(family.title, 'family.title', slug)
  requireField(family.lede, 'family.lede', slug)
  requireField(family.numberedList, 'family.numberedList', slug)
  requireField(family.pullquote, 'family.pullquote', slug)

  const thirds = requireField(doc.thirds, 'thirds', slug)
  requireField(thirds.eyebrow, 'thirds.eyebrow', slug)
  requireField(thirds.title, 'thirds.title', slug)
  requireField(thirds.cards, 'thirds.cards', slug)

  const faq = requireField(doc.faq, 'faq', slug)
  requireField(faq.eyebrow, 'faq.eyebrow', slug)
  requireField(faq.title, 'faq.title', slug)
  requireField(faq.items, 'faq.items', slug)

  const contactCta = requireField(doc.contactCta, 'contactCta', slug)
  requireField(contactCta.eyebrow, 'contactCta.eyebrow', slug)
  requireField(contactCta.title, 'contactCta.title', slug)
  requireField(contactCta.lede, 'contactCta.lede', slug)
  requireField(contactCta.cta, 'contactCta.cta', slug)
  requireField(contactCta.cta.label, 'contactCta.cta.label', slug)
  requireField(contactCta.cta.href, 'contactCta.cta.href', slug)

  const relatedServices = requireField(doc.relatedServices, 'relatedServices', slug)
  requireField(relatedServices.eyebrow, 'relatedServices.eyebrow', slug)
  requireField(relatedServices.title, 'relatedServices.title', slug)
  requireField(relatedServices.cards, 'relatedServices.cards', slug)

  // ── HERO: eyebrow
  html = safeReplace(
    html,
    /(<section class="service-hero"[^>]*>[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${hero.eyebrow}${post}`
  )

  // ── HERO: h1 title (raw HTML)
  html = safeReplace(
    html,
    /(<h1\b[^>]*class="service-hero-title"[^>]*>)([\s\S]*?)(<\/h1>)/,
    (pre, _old, post) => `${pre}\n            ${hero.title}\n          ${post}`
  )

  // ── HERO: lede paragraph
  html = safeReplace(
    html,
    /(<p class="service-hero-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${hero.lede}\n          ${post}`
  )

  // ── HERO: image URL (only if provided and template has inline style)
  if (hero.heroImage) {
    html = safeReplace(
      html,
      /(<div class="service-hero-image" style="background-image: url\(')[^']*('\);"><\/div>)/,
      (pre, post) => `${pre}${hero.heroImage}${post}`
    )
  }

  // ── HERO: figure caption
  html = safeReplace(
    html,
    /(<figcaption class="service-hero-cap">[\s\S]*?<span class="divider-rule"><\/span>\s*<span>)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${hero.caption}${post}`
  )

  // ── PILLARS
  html = renderPillars(html, pillars)

  // ── FAMILY band
  html = renderFamily(html, family)

  // ── THIRDS
  html = renderThirds(html, thirds)

  // ── FAQ
  html = renderFaq(html, faq)

  // ── CONTACT CTA
  html = renderContact(html, contactCta)

  // ── RELATED SERVICES
  html = renderRelated(html, relatedServices)

  return html
}

// ------------------------------------------------------------------
// Pillar rendering — process 5 pillars in order
// ------------------------------------------------------------------
function renderPillars(html, pillars) {
  let cursor = 0
  let result = ''
  for (let i = 0; i < 5; i++) {
    const remaining = html.slice(cursor)
    const startRe = /<section class="svc-pillar(?:[^"]*)"[^>]*>/
    const startMatch = startRe.exec(remaining)
    if (!startMatch) throw new Error(`renderPillars: could not find start of pillar ${i}`)
    const sectionStart = cursor + startMatch.index
    const afterStart = sectionStart + startMatch[0].length
    const endIdx = html.indexOf('</section>', afterStart)
    if (endIdx === -1) throw new Error(`renderPillars: could not find end of pillar ${i}`)
    const sectionEnd = endIdx + '</section>'.length

    const block = html.slice(sectionStart, sectionEnd)
    const newBlock = renderPillarBlock(block, pillars[i], i)

    result += html.slice(cursor, sectionStart) + newBlock
    cursor = sectionEnd
  }
  result += html.slice(cursor)
  return result
}

function renderPillarBlock(block, pillar, idx) {
  // eyebrow
  block = safeReplace(
    block,
    /(<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${pillar.eyebrow}${post}`
  )

  // h2 title
  block = safeReplace(
    block,
    /(<h2\b[^>]*class="section-title"[^>]*>)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${pillar.title}\n          ${post}`
  )

  // body paragraphs (raw HTML)
  const bodyParasHtml = pillar.bodyParagraphs
    .map((p) => `<p>\n            ${p}\n          </p>`)
    .join('\n          ')

  if (pillar.layout === 'two-column') {
    block = safeReplace(
      block,
      /(<\/h2>)([\s\S]*?)(<div class="svc-pillar-two">)/,
      (pre, _old, post) => `${pre}\n          ${bodyParasHtml}\n\n          ${post}`
    )

    const colsHtml = pillar.columns
      .map(
        (col) => `<div>
              <h3>${col.heading}</h3>
              <ul>
                ${col.items.map((it) => `<li>${it}</li>`).join('\n                ')}
              </ul>
            </div>`
      )
      .join('\n            ')

    block = safeReplace(
      block,
      /(<div class="svc-pillar-two">)([\s\S]*?)(<\/div>\s*<a [^>]*class="svc-link)/,
      (pre, _old, post) => `${pre}\n            ${colsHtml}\n          ${post}`
    )
  } else {
    // list layout
    block = safeReplace(
      block,
      /(<\/h2>)([\s\S]*?)(<ul class="svc-pillar-list[^"]*">)/,
      (pre, _old, post) => `${pre}\n          ${bodyParasHtml}\n\n          ${post}`
    )

    const listHtml = pillar.listItems
      .map((it) => `<li>${it}</li>`)
      .join('\n            ')
    block = safeReplace(
      block,
      /(<ul class="svc-pillar-list[^"]*">)([\s\S]*?)(<\/ul>)/,
      (pre, _old, post) => `${pre}\n            ${listHtml}\n          ${post}`
    )
  }

  // link href + label
  const linkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>`
  block = safeReplace(
    block,
    /(<a href=")[^"]*(" class="svc-link[^"]*">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${pillar.linkHref}${pre2}\n            <span>${pillar.linkLabel}</span>\n            ${linkSvg}\n          ${post}`
  )

  // image URL
  block = safeReplace(
    block,
    /(<div class="svc-pillar-image" style="background-image: url\(')[^']*('\);"><\/div>)/,
    (pre, post) => `${pre}${pillar.image}${post}`
  )

  return block
}

// ------------------------------------------------------------------
// Family band rendering
// ------------------------------------------------------------------
function renderFamily(html, family) {
  html = safeReplace(
    html,
    /(<section class="svc-family"[^>]*>[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${family.eyebrow}${post}`
  )

  html = safeReplace(
    html,
    /(<section class="svc-family"[^>]*>[\s\S]*?<h2\b[^>]*class="section-title"[^>]*>)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n          ${family.title}\n        ${post}`
  )

  html = safeReplace(
    html,
    /(<section class="svc-family"[^>]*>[\s\S]*?<p class="svc-family-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n          ${family.lede}\n        ${post}`
  )

  const listHtml = family.numberedList
    .map(
      (item) => `\n          <li>
            <span class="svc-family-num">${item.num}</span>
            <p>${item.text}</p>
          </li>`
    )
    .join('')
  html = safeReplace(
    html,
    /(<ul class="svc-family-list" role="list">)([\s\S]*?)(<\/ul>)/,
    (pre, _old, post) => `${pre}${listHtml}\n        ${post}`
  )

  html = safeReplace(
    html,
    /(<blockquote class="svc-family-quote">)([\s\S]*?)(<\/blockquote>)/,
    (pre, _old, post) => `${pre}\n          &ldquo;${family.pullquote}&rdquo;\n        ${post}`
  )

  return html
}

// ------------------------------------------------------------------
// Thirds rendering
// ------------------------------------------------------------------
function renderThirds(html, thirds) {
  html = safeReplace(
    html,
    /(<section class="svc-thirds"[^>]*>[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${thirds.eyebrow}${post}`
  )

  html = safeReplace(
    html,
    /(<section class="svc-thirds"[^>]*>[\s\S]*?<h2\b[^>]*class="section-title"[^>]*>)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${thirds.title}\n          ${post}`
  )

  const cardsHtml = thirds.cards
    .map(
      (card) => `<article class="svc-third">
            <div class="svc-third-num">${card.num}</div>
            <h3>${card.heading}</h3>
            <p>${card.body}</p>
          </article>`
    )
    .join('\n          ')

  html = safeReplace(
    html,
    /(<div class="svc-thirds-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/,
    (pre, _old, post) => `${pre}\n          ${cardsHtml}\n        ${post}`
  )

  return html
}

// ------------------------------------------------------------------
// FAQ rendering
// ------------------------------------------------------------------
function renderFaq(html, faq) {
  html = safeReplace(
    html,
    /(<section class="svc-faq"[^>]*>[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${faq.eyebrow}${post}`
  )

  html = safeReplace(
    html,
    /(<section class="svc-faq"[^>]*>[\s\S]*?<h2\b[^>]*class="section-title"[^>]*>)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${faq.title}\n          ${post}`
  )

  const itemsHtml = faq.items
    .map((item) => {
      const detailsTag = item.open ? '<details class="svc-faq-item" open>' : '<details class="svc-faq-item">'
      const paras = item.answerParagraphs
        .map((p) => `<p>${p}</p>`)
        .join('\n              ')
      return `${detailsTag}
            <summary>
              <span class="svc-faq-q">${item.question}</span>
              <span class="svc-faq-icon" aria-hidden="true"></span>
            </summary>
            <div class="svc-faq-a">
              ${paras}
            </div>
          </details>`
    })
    .join('\n          ')

  html = safeReplace(
    html,
    /(<div class="svc-faq-list">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/,
    (pre, _old, post) => `${pre}\n          ${itemsHtml}\n        ${post}`
  )

  return html
}

// ------------------------------------------------------------------
// Contact CTA rendering
// ------------------------------------------------------------------
function renderContact(html, contactCta) {
  const arrowSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>`

  html = safeReplace(
    html,
    /(<section class="contact"[^>]*>[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${contactCta.eyebrow}${post}`
  )

  html = safeReplace(
    html,
    /(<h2 class="contact-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${contactCta.title}\n          ${post}`
  )

  html = safeReplace(
    html,
    /(<p class="contact-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${contactCta.lede}\n          ${post}`
  )

  html = safeReplace(
    html,
    /(<div class="contact-actions">[\s\S]*?<a href=")[^"]*(" class="btn btn-primary btn-lg">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${contactCta.cta.href}${pre2}\n              <span>${contactCta.cta.label}</span>\n              ${arrowSvg}\n            ${post}`
  )

  return html
}

// ------------------------------------------------------------------
// Related services rendering
// ------------------------------------------------------------------
function renderRelated(html, relatedServices) {
  html = safeReplace(
    html,
    /(<section class="svc-related"[^>]*>[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${relatedServices.eyebrow}${post}`
  )

  html = safeReplace(
    html,
    /(<section class="svc-related"[^>]*>[\s\S]*?<h2\b[^>]*class="section-title"[^>]*>)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${relatedServices.title}\n          ${post}`
  )

  const cardsHtml = relatedServices.cards
    .map(
      (card) => `<a class="svc-related-card" href="${card.href}">
            <span class="svc-related-num">${card.number}</span>
            <h3>${card.title}</h3>
            <p>${card.blurb}</p>
            <span class="svc-related-arrow">→</span>
          </a>`
    )
    .join('\n          ')

  html = safeReplace(
    html,
    /(<div class="svc-related-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/,
    (pre, _old, post) => `${pre}\n          ${cardsHtml}\n        ${post}`
  )

  return html
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  console.log(`▸ Sanity service pages build — project=${PROJECT_ID} dataset=${DATASET}`)

  for (const slug of SLUGS) {
    const docId = `servicePage-${slug}`
    console.log(`  ▸ ${slug}`)

    let doc
    try {
      doc = await client.fetch(`*[_type == "servicePage" && _id == $id][0]`, { id: docId })
    } catch (err) {
      console.warn(`    ⚠ Sanity fetch failed: ${err.message}`)
      console.warn(`    ⚠ Skipping ${slug}.html (leaving as-is).`)
      continue
    }

    if (!doc) {
      console.warn(`    ⚠ No servicePage doc found for _id=${docId} — leaving ${slug}.html as-is.`)
      continue
    }

    const templatePath = path.join(ROOT, `${slug}.html.pre-sanity-backup`)
    if (!existsSync(templatePath)) {
      console.error(`    ✗ ${slug}.html.pre-sanity-backup not found — run the backup step first.`)
      process.exit(1)
    }
    const originalHtml = readFileSync(templatePath, 'utf8')

    const html = renderServicePage(originalHtml, doc, slug)

    const marker = `<!-- SANITY-GENERATED ${new Date().toISOString()} — do not edit by hand. Source: Sanity project ${PROJECT_ID}, _id=${docId}. Edits will be overwritten on next build. -->`
    const output = marker + '\n' + html

    const outPath = path.join(ROOT, `${slug}.html`)
    writeFileSync(outPath, output)
    console.log(`    ✓ wrote ${slug}.html`)
  }
  console.log('▸ Done.')
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  main().catch((err) => {
    console.error('Build failed:', err)
    process.exit(1)
  })
}
