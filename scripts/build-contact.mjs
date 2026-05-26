#!/usr/bin/env node
/**
 * build-contact.mjs
 * Fetches the contactPage singleton from Sanity and writes a rendered contact.html.
 *
 * Strategy mirrors build-about.mjs / build-services.mjs:
 *   - Read contact.html.pre-sanity-backup as immutable template.
 *   - Regex-based string replacement (never a DOM parser).
 *   - Fail-soft on no doc; fail-closed on missing required fields.
 *   - Prepend <!-- SANITY-GENERATED <ISO> --> marker.
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

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,
  token: process.env.SANITY_READ_TOKEN || undefined,
})

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

function requireField(value, fieldPath) {
  if (value === undefined || value === null || value === '') {
    console.error(`  ✗ Required Sanity field missing: ${fieldPath}`)
    console.error('  ✗ Refusing to write a partial contact.html. Fix the contactPage doc and rebuild.')
    process.exit(1)
  }
  return value
}

export function renderContactPage(originalHtml, doc) {
  const hero = requireField(doc.hero, 'hero')
  requireField(hero.eyebrow, 'hero.eyebrow')
  requireField(hero.title, 'hero.title')
  requireField(hero.lede, 'hero.lede')
  requireField(hero.meta, 'hero.meta')

  const formAside = requireField(doc.formAside, 'formAside')
  requireField(formAside.eyebrow, 'formAside.eyebrow')
  requireField(formAside.title, 'formAside.title')
  requireField(formAside.copy, 'formAside.copy')

  let html = originalHtml

  // ── HERO: eyebrow ────────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<section class="contact-hero"[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(hero.eyebrow)}${post}`
  )

  // ── HERO: h1 title (raw HTML) ────────────────────────────────────
  html = safeReplace(
    html,
    /(<h1 id="contact-h1" class="contact-hero-title">)([\s\S]*?)(<\/h1>)/,
    (pre, _old, post) => `${pre}\n            ${sanitizeInlineHtml(hero.title)}\n          ${post}`
  )

  // ── HERO: lede ───────────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<p class="contact-hero-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${escapeHtml(hero.lede)}\n          ${post}`
  )

  // ── HERO: meta list ──────────────────────────────────────────────
  const metaItemsHtml = hero.meta
    .map((item) => {
      const valueNode = item.href
        ? `<a class="contact-meta-value contact-meta-link" href="${item.href}">${escapeHtml(item.value)}</a>`
        : `<span class="contact-meta-value">${escapeHtml(item.value)}</span>`
      return `<li>
              <span class="contact-meta-label">${escapeHtml(item.label)}</span>
              ${valueNode}
            </li>`
    })
    .join('\n            ')

  html = safeReplace(
    html,
    /(<ul class="contact-hero-meta" role="list">)([\s\S]*?)(<\/ul>)/,
    (pre, _old, post) => `${pre}\n            ${metaItemsHtml}\n          ${post}`
  )

  // ── FORM ASIDE: eyebrow ──────────────────────────────────────────
  html = safeReplace(
    html,
    /(<aside class="contact-form-aside"[^>]*>[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(formAside.eyebrow)}${post}`
  )

  // ── FORM ASIDE: title (single line h2, raw HTML) ────────────────
  html = safeReplace(
    html,
    /(<h2 class="contact-form-aside-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}${sanitizeInlineHtml(formAside.title)}${post}`
  )

  // ── FORM ASIDE: copy paragraph ───────────────────────────────────
  html = safeReplace(
    html,
    /(<p class="contact-form-aside-copy">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n            ${escapeHtml(formAside.copy)}\n          ${post}`
  )

  return html
}

async function main() {
  console.log(`▸ Sanity contact page build — project=${PROJECT_ID} dataset=${DATASET}`)

  let doc
  try {
    doc = await client.fetch(`*[_type == "contactPage" && _id == "contactPage"][0]`)
  } catch (err) {
    console.warn(`  ⚠ Sanity fetch failed: ${err.message}`)
    console.warn('  ⚠ Skipping contact page build (leaving contact.html as-is).')
    process.exit(0)
  }

  if (!doc) {
    console.warn('  ⚠ No contactPage doc found in Sanity — leaving contact.html as-is.')
    process.exit(0)
  }

  console.log('  ✓ contactPage doc fetched')

  const templatePath = path.join(ROOT, 'contact.html.pre-sanity-backup')
  if (!existsSync(templatePath)) {
    console.error('  ✗ contact.html.pre-sanity-backup not found.')
    process.exit(1)
  }
  const originalHtml = readFileSync(templatePath, 'utf8')

  const html = renderContactPage(originalHtml, doc)

  const marker = `<!-- SANITY-GENERATED ${new Date().toISOString()} — do not edit by hand. Source: Sanity project ${PROJECT_ID}, _id=contactPage. Edits will be overwritten on next build. -->`
  const output = marker + '\n' + html

  writeFileSync(path.join(ROOT, 'contact.html'), output)
  console.log('  ✓ wrote contact.html')
  console.log('▸ Done.')
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  main().catch((err) => {
    console.error('Build failed:', err)
    process.exit(1)
  })
}
