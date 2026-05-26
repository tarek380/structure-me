#!/usr/bin/env node
/**
 * build-subscribe-details.mjs
 * Fetches subscribeDetailsPage from Sanity and writes subscribe-details.html.
 *
 * Strategy mirrors build-about.mjs: regex-based replacement of the hero
 * eyebrow/title/lede plus the submit button label and consent fineprint.
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
    console.error('  ✗ Refusing to write a partial subscribe-details.html.')
    process.exit(1)
  }
  return value
}

const arrowSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>`

export function renderSubscribeDetailsPage(originalHtml, doc) {
  const hero = requireField(doc.hero, 'hero')
  requireField(hero.eyebrow, 'hero.eyebrow')
  requireField(hero.title, 'hero.title')
  requireField(hero.lede, 'hero.lede')

  const form = requireField(doc.form, 'form')
  requireField(form.submitLabel, 'form.submitLabel')
  requireField(form.consent, 'form.consent')

  let html = originalHtml

  // ── HERO: eyebrow ────────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<section class="thanks-hero subdetails-hero"[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(hero.eyebrow)}${post}`
  )

  // ── HERO: title (h1, raw HTML) ───────────────────────────────────
  html = safeReplace(
    html,
    /(<h1 id="sub-h1" class="thanks-title">)([\s\S]*?)(<\/h1>)/,
    (pre, _old, post) => `${pre}\n          ${sanitizeInlineHtml(hero.title)}\n        ${post}`
  )

  // ── HERO: lede ───────────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<p class="thanks-lede subdetails-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n          ${escapeHtml(hero.lede)}\n        ${post}`
  )

  // ── FORM: submit button label ────────────────────────────────────
  html = safeReplace(
    html,
    /(<button type="submit" class="btn btn-primary" id="subDetailsSubmit">)([\s\S]*?)(<\/button>)/,
    (pre, _old, post) =>
      `${pre}\n              <span>${escapeHtml(form.submitLabel)}</span>\n              ${arrowSvg}\n            ${post}`
  )

  // ── FORM: consent fineprint ──────────────────────────────────────
  html = safeReplace(
    html,
    /(<p class="subdetails-consent">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}${escapeHtml(form.consent)}${post}`
  )

  return html
}

async function main() {
  console.log(`▸ Sanity subscribe-details build — project=${PROJECT_ID} dataset=${DATASET}`)

  let doc
  try {
    doc = await client.fetch(`*[_type == "subscribeDetailsPage" && _id == "subscribeDetailsPage"][0]`)
  } catch (err) {
    console.warn(`  ⚠ Sanity fetch failed: ${err.message}`)
    console.warn('  ⚠ Skipping subscribe-details build (leaving subscribe-details.html as-is).')
    process.exit(0)
  }

  if (!doc) {
    console.warn('  ⚠ No subscribeDetailsPage doc found in Sanity — leaving subscribe-details.html as-is.')
    process.exit(0)
  }

  console.log('  ✓ subscribeDetailsPage doc fetched')

  const templatePath = path.join(ROOT, 'subscribe-details.html.pre-sanity-backup')
  if (!existsSync(templatePath)) {
    console.error('  ✗ subscribe-details.html.pre-sanity-backup not found.')
    process.exit(1)
  }
  const originalHtml = readFileSync(templatePath, 'utf8')

  const html = renderSubscribeDetailsPage(originalHtml, doc)

  const marker = `<!-- SANITY-GENERATED ${new Date().toISOString()} — do not edit by hand. Source: Sanity project ${PROJECT_ID}, _id=subscribeDetailsPage. Edits will be overwritten on next build. -->`
  const output = marker + '\n' + html

  writeFileSync(path.join(ROOT, 'subscribe-details.html'), output)
  console.log('  ✓ wrote subscribe-details.html')
  console.log('▸ Done.')
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  main().catch((err) => {
    console.error('Build failed:', err)
    process.exit(1)
  })
}
