#!/usr/bin/env node
/**
 * build-insights-index.mjs
 * Fetches the insightsIndexPage singleton and updates ONLY the
 * <section class="insights-newsletter"> block on insights.html.
 *
 * The featured-card and insights-grid are auto-managed by build-insights.mjs.
 * This script MUST run AFTER build-insights.mjs.
 *
 * Strategy:
 *   - Read insights.html (already rewritten by build-insights) as input.
 *   - Use a focused regex anchored to the newsletter section.
 *   - Fail-soft on no doc; fail-closed on missing required fields.
 *   - Prepend <!-- SANITY-GENERATED <ISO> --> marker (replacing build-insights's
 *     marker if present).
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
    console.error('  ✗ Refusing to write a partial insights.html.')
    process.exit(1)
  }
  return value
}

export function renderInsightsIndexPage(originalHtml, doc) {
  const newsletter = requireField(doc.newsletter, 'newsletter')
  requireField(newsletter.eyebrow, 'newsletter.eyebrow')
  requireField(newsletter.title, 'newsletter.title')
  requireField(newsletter.lede, 'newsletter.lede')
  requireField(newsletter.placeholder, 'newsletter.placeholder')
  requireField(newsletter.buttonLabel, 'newsletter.buttonLabel')

  let html = originalHtml

  // ── Newsletter: eyebrow ──────────────────────────────────────────
  html = safeReplace(
    html,
    /(<section class="insights-newsletter"[\s\S]*?<span class="section-eyebrow">)([^<]*)(<\/span>)/,
    (pre, _old, post) => `${pre}${escapeHtml(newsletter.eyebrow)}${post}`
  )

  // ── Newsletter: title (h2, raw HTML) ─────────────────────────────
  html = safeReplace(
    html,
    /(<h2 id="newsletter-h" class="insights-newsletter-title">)([\s\S]*?)(<\/h2>)/,
    (pre, _old, post) => `${pre}\n          ${sanitizeInlineHtml(newsletter.title)}\n        ${post}`
  )

  // ── Newsletter: lede ─────────────────────────────────────────────
  html = safeReplace(
    html,
    /(<p class="insights-newsletter-lede">)([\s\S]*?)(<\/p>)/,
    (pre, _old, post) => `${pre}\n          ${escapeHtml(newsletter.lede)}\n        ${post}`
  )

  // ── Newsletter: input placeholder ────────────────────────────────
  html = safeReplace(
    html,
    /(<input class="insights-newsletter-input" type="email" name="email" placeholder=")[^"]*(" aria-label="Email address" required \/>)/,
    (pre, post) => `${pre}${escapeHtml(newsletter.placeholder)}${post}`
  )

  // ── Newsletter: button label ─────────────────────────────────────
  html = safeReplace(
    html,
    /(<button class="insights-newsletter-btn" type="submit">)([\s\S]*?)(<\/button>)/,
    (pre, _old, post) => `${pre}${escapeHtml(newsletter.buttonLabel)}${post}`
  )

  // ── SEO injection ─────────────────────────────────────────────────
  html = injectSeo(html, doc, 'https://www.structureme.com.au/img/insights/hero.jpg')

  return html
}

async function main() {
  console.log(`▸ Sanity insights-index build — project=${PROJECT_ID} dataset=${DATASET}`)

  let doc
  try {
    doc = await client.fetch(`*[_type == "insightsIndexPage" && _id == "insightsIndexPage"][0]`)
  } catch (err) {
    console.warn(`  ⚠ Sanity fetch failed: ${err.message}`)
    console.warn('  ⚠ Skipping insights-index build (leaving insights.html as-is).')
    process.exit(0)
  }

  if (!doc) {
    console.warn('  ⚠ No insightsIndexPage doc found in Sanity — leaving insights.html as-is.')
    process.exit(0)
  }

  console.log('  ✓ insightsIndexPage doc fetched')

  // Read the CURRENT insights.html (already rewritten by build-insights.mjs).
  // We only touch the newsletter band; the featured card and grid are preserved.
  const inputPath = path.join(ROOT, 'insights.html')
  if (!existsSync(inputPath)) {
    console.error('  ✗ insights.html not found — run build-insights.mjs first.')
    process.exit(1)
  }
  const originalHtml = readFileSync(inputPath, 'utf8')

  const html = renderInsightsIndexPage(originalHtml, doc)

  // Strip any prior SANITY-GENERATED marker line(s), then prepend new one.
  const stripped = html.replace(/^<!--\s*SANITY-GENERATED[^\n]*-->\n?/, '')
  const marker = `<!-- SANITY-GENERATED ${new Date().toISOString()} — do not edit by hand. Source: Sanity project ${PROJECT_ID}, _id=insightsIndexPage. Edits will be overwritten on next build. -->`
  const output = marker + '\n' + stripped

  writeFileSync(inputPath, output)
  console.log('  ✓ wrote insights.html (newsletter band)')
  console.log('▸ Done.')
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  main().catch((err) => {
    console.error('Build failed:', err)
    process.exit(1)
  })
}
