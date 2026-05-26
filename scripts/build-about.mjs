#!/usr/bin/env node
/**
 * build-about.mjs
 * Fetches the aboutPage singleton from Sanity and writes a rendered about.html.
 *
 * Strategy:
 *   - Read about.html.pre-sanity-backup as the immutable template (never about.html itself).
 *   - Use targeted regex-based string replacement for each editable region.
 *     This preserves untouched HTML byte-for-byte (no DOM normalisation artefacts).
 *   - If Sanity has no aboutPage doc, log a warning and exit 0 (leave about.html as-is).
 *   - If any required field is missing, log it and exit 1 — fail closed.
 *   - Prepend <!-- SANITY-GENERATED <ISO timestamp> --> to the output.
 */

import { createClient } from '@sanity/client'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveImage } from './lib/sanity-image.mjs'

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
// Used for section titles stored as raw HTML strings.
// ------------------------------------------------------------------
function sanitizeInlineHtml(s) {
  if (!s) return ''
  // Strip any tag that isn't em, strong, or br
  return String(s)
    .replace(/<(?!\/?(?:em|strong|br)\b)[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '<br />')
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
    console.error('  ✗ Refusing to write a partial about.html. Fix the aboutPage doc and rebuild.')
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

const arrowSvg14SvcLink = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>`

const arrowSvg14Contact = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>`

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  console.log(`▸ Sanity about page build — project=${PROJECT_ID} dataset=${DATASET}`)

  // ── Fetch doc ──────────────────────────────────────────────────
  let doc
  try {
    doc = await client.fetch(`*[_type == "aboutPage" && _id == "aboutPage"][0]`)
  } catch (err) {
    console.warn(`  ⚠ Sanity fetch failed: ${err.message}`)
    console.warn('  ⚠ Skipping about page build (leaving about.html as-is).')
    process.exit(0)
  }

  if (!doc) {
    console.warn('  ⚠ No aboutPage doc found in Sanity — leaving about.html as-is.')
    console.warn('  ⚠ Import seed-about.ndjson to populate content.')
    process.exit(0)
  }

  console.log('  ✓ aboutPage doc fetched')

  // ── Read template ──────────────────────────────────────────────
  const templatePath = path.join(ROOT, 'about.html.pre-sanity-backup')
  if (!existsSync(templatePath)) {
    console.error('  ✗ about.html.pre-sanity-backup not found — run the backup step first.')
    process.exit(1)
  }
  let html = readFileSync(templatePath, 'utf8')

  // ── Validate all required fields up front ─────────────────────
  const hero = requireField(doc.hero, 'hero')
  requireField(hero.eyebrow, 'hero.eyebrow')
  requireField(hero.title, 'hero.title')
  requireField(hero.lede, 'hero.lede')
  requireField(hero.bullets, 'hero.bullets')
  requireField(hero.primaryCta, 'hero.primaryCta')
  requireField(hero.primaryCta.label, 'hero.primaryCta.label')
  requireField(hero.primaryCta.href, 'hero.primaryCta.href')
  requireField(hero.secondaryCta, 'hero.secondaryCta')
  requireField(hero.secondaryCta.label, 'hero.secondaryCta.label')
  requireField(hero.secondaryCta.href, 'hero.secondaryCta.href')
  requireField(hero.heroImage, 'hero.heroImage')
  requireField(hero.caption, 'hero.caption')

  const missionPillar = requireField(doc.missionPillar, 'missionPillar')
  requireField(missionPillar.eyebrow, 'missionPillar.eyebrow')
  requireField(missionPillar.title, 'missionPillar.title')
  requireField(missionPillar.bodyParagraphs, 'missionPillar.bodyParagraphs')
  requireField(missionPillar.list, 'missionPillar.list')
  requireField(missionPillar.link, 'missionPillar.link')
  requireField(missionPillar.link.label, 'missionPillar.link.label')
  requireField(missionPillar.link.href, 'missionPillar.link.href')
  requireField(missionPillar.figureImage, 'missionPillar.figureImage')

  const team = requireField(doc.team, 'team')
  requireField(team.eyebrow, 'team.eyebrow')
  requireField(team.title, 'team.title')
  requireField(team.lede, 'team.lede')
  requireField(team.members, 'team.members')

  const family = requireField(doc.family, 'family')
  requireField(family.eyebrow, 'family.eyebrow')
  requireField(family.title, 'family.title')
  requireField(family.lede, 'family.lede')
  requireField(family.numberedList, 'family.numberedList')
  requireField(family.pullquote, 'family.pullquote')

  const contactCta = requireField(doc.contactCta, 'contactCta')
  requireField(contactCta.eyebrow, 'contactCta.eyebrow')
  requireField(contactCta.title, 'contactCta.title')
  requireField(contactCta.lede, 'contactCta.lede')
  requireField(contactCta.cta, 'contactCta.cta')
  requireField(contactCta.cta.label, 'contactCta.cta.label')
  requireField(contactCta.cta.href, 'contactCta.cta.href')

  const relatedServices = requireField(doc.relatedServices, 'relatedServices')
  requireField(relatedServices.eyebrow, 'relatedServices.eyebrow')
  requireField(relatedServices.title, 'relatedServices.title')
  requireField(relatedServices.cards, 'relatedServices.cards')

  console.log('  ✓ all required fields present')

  // ── HERO: eyebrow ──────────────────────────────────────────────
  // Original: <span class="section-eyebrow">— About · Structure Me</span>
  html = safeReplace(
    html,
    /(<section class="service-hero"[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(hero.eyebrow)}${post}`
  )

  // ── HERO: title (raw HTML) ─────────────────────────────────────
  // Original: <h1 id="about-h1" class="service-hero-title">\n            An advisory firm<br />built like a <em>family office</em>.\n          </h1>
  html = safeReplace(
    html,
    /(<h1 id="about-h1" class="service-hero-title">)([\s\S]*?)(<\/h1>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(hero.title)}\n          ${post}`
  )

  // ── HERO: lede paragraph ───────────────────────────────────────
  // Original: <p class="service-hero-lede">\n            We are a small...\n          </p>
  html = safeReplace(
    html,
    /(<p class="service-hero-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${escapeHtml(hero.lede)}\n          ${post}`
  )

  // ── HERO: bullets ─────────────────────────────────────────────
  const bulletsHtml = hero.bullets
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join('\n            ')
  html = safeReplace(
    html,
    /(<ul class="service-hero-bullets" role="list">)([\s\S]*?)(<\/ul>)/,
    (pre, _old, post) => `${pre}\n            ${bulletsHtml}\n          ${post}`
  )

  // ── HERO: primary CTA href ─────────────────────────────────────
  // Original: <a href="contact.html" class="btn btn-primary">
  html = safeReplace(
    html,
    /(<div class="service-hero-cta">[\s\S]*?<a href=")[^"]*(" class="btn btn-primary")/,
    (pre, post) => `${pre}${hero.primaryCta.href}${post}`
  )

  // ── HERO: primary CTA content ──────────────────────────────────
  html = safeReplace(
    html,
    /(<div class="service-hero-cta">[\s\S]*?<a [^>]*class="btn btn-primary"[^>]*>)([\s\S]*?)(<\/a>)/,
    (pre, _old, post) =>
      `${pre}\n              <span>${escapeHtml(hero.primaryCta.label)}</span>\n              ${arrowSvg14}\n            ${post}`
  )

  // ── HERO: secondary CTA href + label ──────────────────────────
  // Original: <a href="#team" class="btn btn-ghost">\n              <span>Meet the team</span>\n            </a>
  html = safeReplace(
    html,
    /(<a href=")[^"]*(" class="btn btn-ghost">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${hero.secondaryCta.href}${pre2}\n              <span>${escapeHtml(hero.secondaryCta.label)}</span>\n            ${post}`
  )

  // ── HERO: hero image ───────────────────────────────────────────
  // Original: <div class="service-hero-image" style="background-image: url('img/about-hero.jpg');"></div>
  const heroImageUrl = resolveImage(hero.imageAsset, hero.heroImage)
  html = safeReplace(
    html,
    /(<div class="service-hero-image" style="background-image: url\(')[^']*('\);"><\/div>)/,
    (pre, post) => `${pre}${heroImageUrl}${post}`
  )

  // ── HERO: figure caption ───────────────────────────────────────
  // Original: <span>Counsel · Capital · Structure</span>
  html = safeReplace(
    html,
    /(<figcaption class="service-hero-cap">[\s\S]*?<span class="divider-rule"><\/span>\s*<span>)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(hero.caption)}${post}`
  )

  // ── MISSION PILLAR: eyebrow ────────────────────────────────────
  // Original: <span class="section-eyebrow">— 01 · The brief we hold ourselves to</span>
  html = safeReplace(
    html,
    /(<!-- ={64}\s*PILLAR[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(missionPillar.eyebrow)}${post}`
  )

  // ── MISSION PILLAR: title (raw HTML) ──────────────────────────
  // Original: <h2 id="about-mission" class="section-title">\n            A practice <em>built on judgement</em><br />not billable hours.\n          </h2>
  html = safeReplace(
    html,
    /(<h2 id="about-mission" class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(missionPillar.title)}\n          ${post}`
  )

  // ── MISSION PILLAR: body paragraphs ───────────────────────────
  // The two <p> tags sit between </h2> and <ul class="svc-pillar-list">
  const bodyParasHtml = missionPillar.bodyParagraphs
    .map((p) => `<p>\n            ${escapeHtml(p)}\n          </p>`)
    .join('\n          ')
  html = safeReplace(
    html,
    /(<h2 id="about-mission"[\s\S]*?<\/h2>)([\s\S]*?)(<ul class="svc-pillar-list">)/,
    (pre, _old, post) => `${pre}\n          ${bodyParasHtml}\n\n          ${post}`
  )

  // ── MISSION PILLAR: list ──────────────────────────────────────
  const pillarListHtml = missionPillar.list
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('\n            ')
  html = safeReplace(
    html,
    /(<ul class="svc-pillar-list">)([\s\S]*?)(<\/ul>)/,
    (pre, _old, post) => `${pre}\n            ${pillarListHtml}\n          ${post}`
  )

  // ── MISSION PILLAR: svc-link href + label ─────────────────────
  // Original: <a href="#team" class="svc-link">\n            <span>Meet the team</span>\n            <svg...>\n          </a>
  html = safeReplace(
    html,
    /(<a href=")[^"]*(" class="svc-link">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${missionPillar.link.href}${pre2}\n            <span>${escapeHtml(missionPillar.link.label)}</span>\n            ${arrowSvg14SvcLink}\n          ${post}`
  )

  // ── MISSION PILLAR: figure image ──────────────────────────────
  // Original: <div class="svc-pillar-image" style="background-image: url('img/about-team-3.jpg');"></div>
  html = safeReplace(
    html,
    /(<div class="svc-pillar-image" style="background-image: url\(')[^']*('\);"><\/div>)/,
    (pre, post) => `${pre}${missionPillar.figureImage}${post}`
  )

  // ── TEAM: eyebrow ─────────────────────────────────────────────
  // Original: <span class="section-eyebrow">— 03 · The people</span>
  html = safeReplace(
    html,
    /(<!-- ={64}\s*TEAM[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(team.eyebrow)}${post}`
  )

  // ── TEAM: title (raw HTML) ────────────────────────────────────
  // Original: <h2 id="about-team-h" class="section-title">\n            A small team<br />of <em>senior advisers</em>.\n          </h2>
  html = safeReplace(
    html,
    /(<h2 id="about-team-h" class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(team.title)}\n          ${post}`
  )

  // ── TEAM: lede paragraph ──────────────────────────────────────
  // Original: <p class="svc-family-lede" style="margin: 1.5rem 0 0; max-width: 46rem;">\n            Four operators...
  html = safeReplace(
    html,
    /(<p class="svc-family-lede" style="margin: 1\.5rem 0 0; max-width: 46rem;">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${escapeHtml(team.lede)}\n          ${post}`
  )

  // ── TEAM: grid cards ──────────────────────────────────────────
  const teamCardsHtml = team.members
    .map((m) => {
      const memberImageUrl = resolveImage(m.imageAsset, m.image)
      return `\n          <a href="${m.href}" class="svc-team-card">
            <div class="svc-team-image" style="background-image: url('${memberImageUrl}');" aria-hidden="true"></div>
            <div class="svc-team-role">${escapeHtml(m.role)}</div>
            <h3 class="svc-team-name">${escapeHtml(m.name)}</h3>
            <p class="svc-team-bio">
              ${escapeHtml(m.bio)}
            </p>
          </a>`
    })
    .join('\n')
  html = safeReplace(
    html,
    /(<div class="svc-team-grid">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>\s*<!-- ={64}\s*FAMILY)/,
    (pre, _old, post) => `${pre}${teamCardsHtml}\n        ${post}`
  )

  // ── FAMILY: eyebrow ───────────────────────────────────────────
  // Original: <span class="section-eyebrow">— 04 · A network of entrepreneurs</span>
  html = safeReplace(
    html,
    /(<!-- ={64}\s*FAMILY[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(family.eyebrow)}${post}`
  )

  // ── FAMILY: title (raw HTML) ──────────────────────────────────
  // Original: <h2 id="about-family" class="section-title">\n          A firm <em>defined by the company</em> it keeps.\n        </h2>
  html = safeReplace(
    html,
    /(<h2 id="about-family" class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n          ${sanitizeInlineHtml(family.title)}\n        ${post}`
  )

  // ── FAMILY: lede paragraph ────────────────────────────────────
  // Original: <p class="svc-family-lede">\n          The team is the visible part...
  html = safeReplace(
    html,
    /(<section class="svc-family"[\s\S]*?<p class="svc-family-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n          ${escapeHtml(family.lede)}\n        ${post}`
  )

  // ── FAMILY: numbered list ─────────────────────────────────────
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

  // ── FAMILY: pullquote ─────────────────────────────────────────
  // Original: <blockquote class="svc-family-quote">\n          &ldquo;The work is technical...&rdquo;\n        </blockquote>
  html = safeReplace(
    html,
    /(<blockquote class="svc-family-quote">)([\s\S]*?)(<\/blockquote>)/,
    (pre, _old, post) =>
      `${pre}\n          &ldquo;${escapeHtml(family.pullquote)}&rdquo;\n        ${post}`
  )

  // ── CONTACT CTA: eyebrow ──────────────────────────────────────
  // Original: <span class="section-eyebrow">— Begin</span>
  html = safeReplace(
    html,
    /(<!-- ={64}\s*CONTACT[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(contactCta.eyebrow)}${post}`
  )

  // ── CONTACT CTA: title (raw HTML) ─────────────────────────────
  // Original: <h2 class="contact-title">\n            Most engagements begin with a <em>quiet conversation</em>.\n          </h2>
  html = safeReplace(
    html,
    /(<h2 class="contact-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(contactCta.title)}\n          ${post}`
  )

  // ── CONTACT CTA: lede ─────────────────────────────────────────
  // Original: <p class="contact-lede">\n            Whether you are planning...
  html = safeReplace(
    html,
    /(<p class="contact-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${escapeHtml(contactCta.lede)}\n          ${post}`
  )

  // ── CONTACT CTA: button href + content ────────────────────────
  // Original: <a href="contact.html" class="btn btn-primary btn-lg">
  html = safeReplace(
    html,
    /(<div class="contact-actions">[\s\S]*?<a href=")[^"]*(" class="btn btn-primary btn-lg">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${contactCta.cta.href}${pre2}\n              <span>${escapeHtml(contactCta.cta.label)}</span>\n              ${arrowSvg14Contact}\n            ${post}`
  )

  // ── RELATED SERVICES: eyebrow ─────────────────────────────────
  // Original: <span class="section-eyebrow">— Disciplines</span>
  html = safeReplace(
    html,
    /(<!-- ={64}\s*RELATED[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(relatedServices.eyebrow)}${post}`
  )

  // ── RELATED SERVICES: title (raw HTML) ───────────────────────
  // Original: <h2 id="svc-related-h" class="section-title">\n            What we <em>practise</em>.\n          </h2>
  html = safeReplace(
    html,
    /(<h2 id="svc-related-h" class="section-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(relatedServices.title)}\n          ${post}`
  )

  // ── RELATED SERVICES: cards ───────────────────────────────────
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

  // ── Write output ───────────────────────────────────────────────
  const marker = `<!-- SANITY-GENERATED ${new Date().toISOString()} — do not edit by hand. Source: Sanity project ${PROJECT_ID}. Edits will be overwritten on next build. -->`
  const output = marker + '\n' + html

  const outPath = path.join(ROOT, 'about.html')
  writeFileSync(outPath, output)
  console.log('  ✓ wrote about.html')
  console.log('▸ Done.')
}

main().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
