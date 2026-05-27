#!/usr/bin/env node
/**
 * build-thank-you-subscribe.mjs
 * Fetches thankYouSubscribePage from Sanity and writes thank-you-subscribe.html.
 */

import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
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

const builder = imageUrlBuilder(client)
function urlFor(source) {
  return source ? builder.image(source) : null
}

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


// ------------------------------------------------------------------
// injectSeo — update <title>, <meta description>, <meta keywords>,
// OG and Twitter tags from Sanity SEO fields (fail-soft: empty fields
// leave existing HTML values unchanged).
// ------------------------------------------------------------------
function injectSeo(html, doc, fallbackOgImage) {
  const title = doc.metaTitle || ''
  const desc = doc.metaDescription || ''
  const kw = doc.metaKeywords || ''
  const ogImgUrl = doc.ogImage
    ? urlFor(doc.ogImage).width(1200).height(630).quality(85).url()
    : (fallbackOgImage || '')

  // <title>
  if (title) {
    html = safeReplace(
      html,
      /(<title>)([\s\S]*?)(<\/title>)/,
      (pre, _old, post) => `${pre}${escapeHtml(title)}${post}`
    )
  }

  // <meta name="description" content="..."> — single-line
  if (desc) {
    html = safeReplace(
      html,
      /(<meta\s+name="description"\s+content=")[^"]*("[^>]*\/?>)/,
      (pre, post) => `${pre}${escapeHtml(desc)}${post}`
    )
    // multi-line form: content on its own line
    html = safeReplace(
      html,
      /(<meta\n\s+name="description"\n\s+content=")[^"]*("\n\s+\/>)/,
      (pre, post) => `${pre}${escapeHtml(desc)}${post}`
    )
  }

  // <meta name="keywords" content="...">
  if (kw) {
    html = safeReplace(
      html,
      /(<meta\s+name="keywords"\s+content=")[^"]*("[^>]*\/?>)/,
      (pre, post) => `${pre}${escapeHtml(kw)}${post}`
    )
  }

  // og:title
  if (title) {
    html = safeReplace(
      html,
      /(<meta\s+property="og:title"\s+content=")[^"]*("[^>]*\/?>)/,
      (pre, post) => `${pre}${escapeHtml(title)}${post}`
    )
  }

  // og:description — single-line
  if (desc) {
    html = safeReplace(
      html,
      /(<meta\s+property="og:description"\s+content=")[^"]*("[^>]*\/?>)/,
      (pre, post) => `${pre}${escapeHtml(desc)}${post}`
    )
    // og:description multi-line
    html = safeReplace(
      html,
      /(<meta\n\s+property="og:description"\n\s+content=")[^"]*("\n\s+\/>)/,
      (pre, post) => `${pre}${escapeHtml(desc)}${post}`
    )
  }

  // og:image
  if (ogImgUrl) {
    html = safeReplace(
      html,
      /(<meta\s+property="og:image"\s+content=")[^"]*("[^>]*\/?>)/,
      (pre, post) => `${pre}${ogImgUrl}${post}`
    )
  }

  // twitter:title
  if (title) {
    html = safeReplace(
      html,
      /(<meta\s+name="twitter:title"\s+content=")[^"]*("[^>]*\/?>)/,
      (pre, post) => `${pre}${escapeHtml(title)}${post}`
    )
  }

  // twitter:description — single-line
  if (desc) {
    html = safeReplace(
      html,
      /(<meta\s+name="twitter:description"\s+content=")[^"]*("[^>]*\/?>)/,
      (pre, post) => `${pre}${escapeHtml(desc)}${post}`
    )
    // twitter:description multi-line
    html = safeReplace(
      html,
      /(<meta\n\s+name="twitter:description"\n\s+content=")[^"]*("\n\s+\/>)/,
      (pre, post) => `${pre}${escapeHtml(desc)}${post}`
    )
  }

  // twitter:image
  if (ogImgUrl) {
    html = safeReplace(
      html,
      /(<meta\s+name="twitter:image"\s+content=")[^"]*("[^>]*\/?>)/,
      (pre, post) => `${pre}${ogImgUrl}${post}`
    )
  }

  return html
}

function requireField(value, fieldPath) {
  if (value === undefined || value === null || value === '') {
    console.error(`  ✗ Required Sanity field missing: ${fieldPath}`)
    console.error('  ✗ Refusing to write a partial thank-you-subscribe.html.')
    process.exit(1)
  }
  return value
}

const arrowSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>`

export function renderThankYouSubscribePage(originalHtml, doc) {
  const hero = requireField(doc.hero, 'hero')
  requireField(hero.eyebrow, 'hero.eyebrow')
  requireField(hero.title, 'hero.title')
  requireField(hero.lede, 'hero.lede')

  const meta = requireField(doc.meta, 'meta')
  const primaryCta = requireField(doc.primaryCta, 'primaryCta')
  requireField(primaryCta.label, 'primaryCta.label')
  requireField(primaryCta.href, 'primaryCta.href')
  const secondaryCta = requireField(doc.secondaryCta, 'secondaryCta')
  requireField(secondaryCta.label, 'secondaryCta.label')
  requireField(secondaryCta.href, 'secondaryCta.href')

  let html = originalHtml

  html = safeReplace(
    html,
    /(<section class="thanks-hero"[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(hero.eyebrow)}${post}`
  )

  html = safeReplace(
    html,
    /(<h1 id="thanks-h1" class="thanks-title">)([\s\S]*?)(<\/h1>)/,
    (pre, _old, post) => `${pre}\n          ${sanitizeInlineHtml(hero.title)}\n        ${post}`
  )

  html = safeReplace(
    html,
    /(<p class="thanks-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n          ${escapeHtml(hero.lede)}\n        ${post}`
  )

  // META rows — replace the inner content of <div class="thanks-meta">…</div>
  // When a value contains inline HTML (a link), the original markup formats it
  // across multiple lines, which adds a leading/trailing space after whitespace
  // normalisation. Mirror that here so the diff matches.
  const metaRowsHtml = meta
    .map((row) => {
      const hasInlineHtml = /<[a-z][^>]*>/i.test(row.value)
      const valueSpan = hasInlineHtml
        ? `<span class="thanks-meta-value">\n              ${row.value}\n            </span>`
        : `<span class="thanks-meta-value">${row.value}</span>`
      return `<div class="thanks-meta-row">
            <span class="thanks-meta-label">${escapeHtml(row.label)}</span>
            ${valueSpan}
          </div>`
    })
    .join('\n          ')

  html = safeReplace(
    html,
    /(<div class="thanks-meta">)([\s\S]*?)(<\/div>\s*<div class="thanks-actions">)/,
    (pre, _old, post) => `${pre}\n          ${metaRowsHtml}\n        ${post}`
  )

  // Primary CTA — href and inner content
  html = safeReplace(
    html,
    /(<div class="thanks-actions">[\s\S]*?<a href=")[^"]*(" class="btn btn-primary">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${primaryCta.href}${pre2}\n            <span>${escapeHtml(primaryCta.label)}</span>\n            ${arrowSvg}\n          ${post}`
  )

  // Secondary CTA (ghost button — first match inside thanks-actions)
  html = safeReplace(
    html,
    /(<a href=")[^"]*(" class="btn btn-ghost">)([\s\S]*?)(<\/a>)/,
    (pre1, pre2, _old, post) =>
      `${pre1}${secondaryCta.href}${pre2}\n            <span>${escapeHtml(secondaryCta.label)}</span>\n          ${post}`
  )

  // ── SEO injection ─────────────────────────────────────────────────
  html = injectSeo(html, doc, '')

  return html
}

async function main() {
  console.log(`▸ Sanity thank-you-subscribe build — project=${PROJECT_ID} dataset=${DATASET}`)

  let doc
  try {
    doc = await client.fetch(`*[_type == "thankYouSubscribePage" && _id == "thankYouSubscribePage"][0]`)
  } catch (err) {
    console.warn(`  ⚠ Sanity fetch failed: ${err.message}`)
    console.warn('  ⚠ Skipping thank-you-subscribe build (leaving as-is).')
    process.exit(0)
  }

  if (!doc) {
    console.warn('  ⚠ No thankYouSubscribePage doc found in Sanity — leaving thank-you-subscribe.html as-is.')
    process.exit(0)
  }

  console.log('  ✓ thankYouSubscribePage doc fetched')

  const templatePath = path.join(ROOT, 'thank-you-subscribe.html.pre-sanity-backup')
  if (!existsSync(templatePath)) {
    console.error('  ✗ thank-you-subscribe.html.pre-sanity-backup not found.')
    process.exit(1)
  }
  const originalHtml = readFileSync(templatePath, 'utf8')

  const html = renderThankYouSubscribePage(originalHtml, doc)

  const marker = `<!-- SANITY-GENERATED ${new Date().toISOString()} — do not edit by hand. Source: Sanity project ${PROJECT_ID}, _id=thankYouSubscribePage. Edits will be overwritten on next build. -->`
  const output = marker + '\n' + html

  writeFileSync(path.join(ROOT, 'thank-you-subscribe.html'), output)
  console.log('  ✓ wrote thank-you-subscribe.html')
  console.log('▸ Done.')
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  main().catch((err) => {
    console.error('Build failed:', err)
    process.exit(1)
  })
}
