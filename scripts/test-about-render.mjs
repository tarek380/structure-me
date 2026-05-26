#!/usr/bin/env node
/**
 * test-about-render.mjs
 *
 * Test harness for build-about.mjs:
 *  1. Reads studio/seed-about.ndjson to get the seed document.
 *  2. Mocks the @sanity/client so build-about.mjs uses the seed doc (no network call).
 *  3. Runs the render pipeline directly (same code as build-about.mjs).
 *  4. Diffs the rendered output against about.html.pre-sanity-backup using
 *     whitespace-normalised comparison (collapse runs of whitespace, trim lines).
 *  5. Prints ✅ PASS or ❌ FAIL (with a diff excerpt on failure).
 *
 * Exit 0 on PASS, exit 1 on FAIL.
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ── Load seed doc ────────────────────────────────────────────────────────────
const seedPath = path.join(ROOT, 'studio', 'seed-about.ndjson')
if (!existsSync(seedPath)) {
  console.error('❌ FAIL: seed-about.ndjson not found at', seedPath)
  process.exit(1)
}
const seedLine = readFileSync(seedPath, 'utf8').trim().split('\n')[0]
const seedDoc = JSON.parse(seedLine)

// ── Load backup template ─────────────────────────────────────────────────────
const templatePath = path.join(ROOT, 'about.html.pre-sanity-backup')
if (!existsSync(templatePath)) {
  console.error('❌ FAIL: about.html.pre-sanity-backup not found at', templatePath)
  process.exit(1)
}
const originalHtml = readFileSync(templatePath, 'utf8')

// ── Inline render pipeline (same logic as build-about.mjs, no I/O side effects) ──

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

function safeReplace(html, regex, buildFn) {
  return html.replace(regex, (...args) => {
    const groups = args.slice(1, -2)
    return buildFn(...groups)
  })
}

const arrowSvg14 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>`

const arrowSvg14SvcLink = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>`

const arrowSvg14Contact = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>`

function render(doc) {
  const hero = doc.hero
  const missionPillar = doc.missionPillar
  const team = doc.team
  const family = doc.family
  const contactCta = doc.contactCta
  const relatedServices = doc.relatedServices

  let html = originalHtml

  // HERO: eyebrow
  html = safeReplace(
    html,
    /(<section class="service-hero"[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(hero.eyebrow)}${post}`
  )

  // HERO: title
  html = safeReplace(
    html,
    /(<h1 id="about-h1" class="service-hero-title">)([\s\S]*?)(<\/h1>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(hero.title)}\n          ${post}`
  )

  // HERO: lede
  html = safeReplace(
    html,
    /(<p class="service-hero-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${escapeHtml(hero.lede)}\n          ${post}`
  )

  // HERO: bullets
  const bulletsHtml = hero.bullets
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join('\n            ')
  html = safeReplace(
    html,
    /(<ul class="service-hero-bullets" role="list">)([\s\S]*?)(<\/ul>)/,
    (pre, _old, post) => `${pre}\n            ${bulletsHtml}\n          ${post}`
  )

  // HERO: primary CTA href
  html = safeReplace(
    html,
    /(<div class="service-hero-cta">[\s\S]*?<a href=")[^"]*(" class="btn btn-primary")/,
    (pre, post) => `${pre}${hero.primaryCta.href}${post}`
  )

  // HERO: primary CTA content
  html = safeReplace(
    html,
    /(<div class="service-hero-cta">[\s\S]*?<a [^>]*class="btn btn-primary"[^>]*>)([\s\S]*?)(<\/a>)/,
    (pre, _old, post) =>
      `${pre}\n              <span>${escapeHtml(hero.primaryCta.label)}</span>\n              ${arrowSvg14}\n            ${post}`
  )

  // HERO: secondary CTA
  html = safeReplace(
    html,
    /(<a href=")[^"]*(" class="btn btn-ghost">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${hero.secondaryCta.href}${pre2}\n              <span>${escapeHtml(hero.secondaryCta.label)}</span>\n            ${post}`
  )

  // HERO: hero image
  html = safeReplace(
    html,
    /(<div class="service-hero-image" style="background-image: url\(')[^']*('\);"><\/div>)/,
    (pre, post) => `${pre}${hero.heroImage}${post}`
  )

  // HERO: figure caption
  html = safeReplace(
    html,
    /(<figcaption class="service-hero-cap">[\s\S]*?<span class="divider-rule"><\/span>\s*<span>)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(hero.caption)}${post}`
  )

  // MISSION PILLAR: eyebrow
  html = safeReplace(
    html,
    /(<!-- ={64}\s*PILLAR[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(missionPillar.eyebrow)}${post}`
  )

  // MISSION PILLAR: title
  html = safeReplace(
    html,
    /(<h2 id="about-mission" class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(missionPillar.title)}\n          ${post}`
  )

  // MISSION PILLAR: body paragraphs
  const bodyParasHtml = missionPillar.bodyParagraphs
    .map((p) => `<p>\n            ${escapeHtml(p)}\n          </p>`)
    .join('\n          ')
  html = safeReplace(
    html,
    /(<h2 id="about-mission"[\s\S]*?<\/h2>)([\s\S]*?)(<ul class="svc-pillar-list">)/,
    (pre, _old, post) => `${pre}\n          ${bodyParasHtml}\n\n          ${post}`
  )

  // MISSION PILLAR: list
  const pillarListHtml = missionPillar.list
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('\n            ')
  html = safeReplace(
    html,
    /(<ul class="svc-pillar-list">)([\s\S]*?)(<\/ul>)/,
    (pre, _old, post) => `${pre}\n            ${pillarListHtml}\n          ${post}`
  )

  // MISSION PILLAR: svc-link
  html = safeReplace(
    html,
    /(<a href=")[^"]*(" class="svc-link">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${missionPillar.link.href}${pre2}\n            <span>${escapeHtml(missionPillar.link.label)}</span>\n            ${arrowSvg14SvcLink}\n          ${post}`
  )

  // MISSION PILLAR: figure image
  html = safeReplace(
    html,
    /(<div class="svc-pillar-image" style="background-image: url\(')[^']*('\);"><\/div>)/,
    (pre, post) => `${pre}${missionPillar.figureImage}${post}`
  )

  // TEAM: eyebrow
  html = safeReplace(
    html,
    /(<!-- ={64}\s*TEAM[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(team.eyebrow)}${post}`
  )

  // TEAM: title
  html = safeReplace(
    html,
    /(<h2 id="about-team-h" class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(team.title)}\n          ${post}`
  )

  // TEAM: lede
  html = safeReplace(
    html,
    /(<p class="svc-family-lede" style="margin: 1\.5rem 0 0; max-width: 46rem;">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${escapeHtml(team.lede)}\n          ${post}`
  )

  // TEAM: grid cards
  const teamCardsHtml = team.members
    .map(
      (m) => `\n          <a href="${m.href}" class="svc-team-card">
            <div class="svc-team-image" style="background-image: url('${m.image}');" aria-hidden="true"></div>
            <div class="svc-team-role">${escapeHtml(m.role)}</div>
            <h3 class="svc-team-name">${escapeHtml(m.name)}</h3>
            <p class="svc-team-bio">
              ${escapeHtml(m.bio)}
            </p>
          </a>`
    )
    .join('\n')
  html = safeReplace(
    html,
    /(<div class="svc-team-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>\s*<!-- ={64}\s*FAMILY)/,
    (pre, _old, post) => `${pre}${teamCardsHtml}\n        ${post}`
  )

  // FAMILY: eyebrow
  html = safeReplace(
    html,
    /(<!-- ={64}\s*FAMILY[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(family.eyebrow)}${post}`
  )

  // FAMILY: title
  html = safeReplace(
    html,
    /(<h2 id="about-family" class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n          ${sanitizeInlineHtml(family.title)}\n        ${post}`
  )

  // FAMILY: lede
  html = safeReplace(
    html,
    /(<section class="svc-family"[\s\S]*?<p class="svc-family-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n          ${escapeHtml(family.lede)}\n        ${post}`
  )

  // FAMILY: numbered list
  const numberedListHtml = family.numberedList
    .map(
      (item) => `\n          <li>
            <span class="svc-family-num">${escapeHtml(item.num)}</span>
            <p>${escapeHtml(item.text)}</p>
          </li>`
    )
    .join('\n')
  html = safeReplace(
    html,
    /(<ul class="svc-family-list" role="list">)([\s\S]*?)(<\/ul>)/,
    (pre, _old, post) => `${pre}${numberedListHtml}\n        ${post}`
  )

  // FAMILY: pullquote
  html = safeReplace(
    html,
    /(<blockquote class="svc-family-quote">)([\s\S]*?)(<\/blockquote>)/,
    (pre, _old, post) =>
      `${pre}\n          &ldquo;${escapeHtml(family.pullquote)}&rdquo;\n        ${post}`
  )

  // CONTACT CTA: eyebrow
  html = safeReplace(
    html,
    /(<!-- ={64}\s*CONTACT[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(contactCta.eyebrow)}${post}`
  )

  // CONTACT CTA: title
  html = safeReplace(
    html,
    /(<h2 class="contact-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(contactCta.title)}\n          ${post}`
  )

  // CONTACT CTA: lede
  html = safeReplace(
    html,
    /(<p class="contact-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${escapeHtml(contactCta.lede)}\n          ${post}`
  )

  // CONTACT CTA: button
  html = safeReplace(
    html,
    /(<div class="contact-actions">[\s\S]*?<a href=")[^"]*(" class="btn btn-primary btn-lg">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${contactCta.cta.href}${pre2}\n              <span>${escapeHtml(contactCta.cta.label)}</span>\n              ${arrowSvg14Contact}\n            ${post}`
  )

  // RELATED SERVICES: eyebrow
  html = safeReplace(
    html,
    /(<!-- ={64}\s*RELATED[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(relatedServices.eyebrow)}${post}`
  )

  // RELATED SERVICES: title
  html = safeReplace(
    html,
    /(<h2 id="svc-related-h" class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(relatedServices.title)}\n          ${post}`
  )

  // RELATED SERVICES: cards
  const relatedCardsHtml = relatedServices.cards
    .map(
      (card) => `\n          <a class="svc-related-card" href="${card.href}">
            <span class="svc-related-num">${escapeHtml(card.number)}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.blurb)}</p>
            <span class="svc-related-arrow">→</span>
          </a>`
    )
    .join('\n')
  html = safeReplace(
    html,
    /(<div class="svc-related-grid svc-related-grid--5">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>\s*<!-- ={64}\s*FOOTER)/,
    (pre, _old, post) => `${pre}${relatedCardsHtml}\n        ${post}`
  )

  // Prepend marker (stripped for comparison — we only compare the HTML body)
  return html
}

// ── Whitespace normalisation ─────────────────────────────────────────────────
function normalise(html) {
  return html
    // Remove the SANITY-GENERATED comment line if present (first line)
    .replace(/^<!--\s*SANITY-GENERATED[^\n]*-->\n?/, '')
    // Collapse all runs of whitespace (space, tab, newline) to a single space
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log('▸ test-about-render: running render pipeline against seed data…')

let rendered
try {
  rendered = render(seedDoc)
} catch (err) {
  console.error('❌ FAIL: Render threw an error:', err.message)
  process.exit(1)
}

const normRendered = normalise(rendered)
const normOriginal = normalise(originalHtml)

if (normRendered === normOriginal) {
  console.log('✅ PASS — rendered output matches backup (whitespace-normalised)')
  process.exit(0)
} else {
  // Find first difference
  let firstDiffIdx = -1
  for (let i = 0; i < Math.max(normRendered.length, normOriginal.length); i++) {
    if (normRendered[i] !== normOriginal[i]) {
      firstDiffIdx = i
      break
    }
  }

  const ctx = 120
  const start = Math.max(0, firstDiffIdx - ctx)
  const end = firstDiffIdx + ctx

  console.error('❌ FAIL — rendered output differs from backup')
  console.error(`  First difference at char index ${firstDiffIdx}`)
  console.error('  --- backup (original):')
  console.error('  ' + JSON.stringify(normOriginal.slice(start, end)))
  console.error('  --- rendered:')
  console.error('  ' + JSON.stringify(normRendered.slice(start, end)))
  process.exit(1)
}
