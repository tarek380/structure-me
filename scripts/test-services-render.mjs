#!/usr/bin/env node
/**
 * test-services-render.mjs
 *
 * Test harness for build-services.mjs:
 *  1. Reads studio/seed-services.ndjson to get the 5 seed documents.
 *  2. Renders each one against its <slug>.html.pre-sanity-backup template.
 *  3. Whitespace-normalised-diffs the rendered output against the backup.
 *  4. Reports per-slug pass/fail and exits non-zero if any slug fails.
 *
 * Mocks the Sanity client by importing renderServicePage directly from build-services.mjs.
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderServicePage } from './build-services.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const SLUGS = ['advisory', 'business-structuring', 'international', 'family-office', 'exit-strategy']

// ── Load seed docs ──────────────────────────────────────────────────────
const seedPath = path.join(ROOT, 'studio', 'seed-services.ndjson')
if (!existsSync(seedPath)) {
  console.error('❌ FAIL: seed-services.ndjson not found at', seedPath)
  process.exit(1)
}
const seedDocs = readFileSync(seedPath, 'utf8')
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line))

const docsBySlug = {}
for (const doc of seedDocs) {
  docsBySlug[doc.slug] = doc
}

// ── Whitespace normalisation ────────────────────────────────────────────
function normalise(html) {
  return html
    .replace(/^<!--\s*SANITY-GENERATED[^\n]*-->\n?/, '')
    .replace(/\s+/g, ' ')
    // Strip whitespace immediately after > or before < so multi-line tag
    // bodies normalise to the same form as single-line ones.
    .replace(/>\s+/g, '>')
    .replace(/\s+</g, '<')
    .trim()
}

// ── Run ─────────────────────────────────────────────────────────────────
console.log('▸ test-services-render: running render pipeline against seed data…')

let pass = 0
let fail = 0
const failures = []

for (const slug of SLUGS) {
  const doc = docsBySlug[slug]
  if (!doc) {
    console.error(`❌ ${slug}: no seed doc found`)
    fail++
    failures.push({ slug, reason: 'no seed doc' })
    continue
  }

  const templatePath = path.join(ROOT, `${slug}.html.pre-sanity-backup`)
  if (!existsSync(templatePath)) {
    console.error(`❌ ${slug}: backup not found at ${templatePath}`)
    fail++
    failures.push({ slug, reason: 'no backup' })
    continue
  }
  const originalHtml = readFileSync(templatePath, 'utf8')

  let rendered
  try {
    rendered = renderServicePage(originalHtml, doc, slug)
  } catch (err) {
    console.error(`❌ ${slug}: render threw — ${err.message}`)
    fail++
    failures.push({ slug, reason: err.message })
    continue
  }

  const normRendered = normalise(rendered)
  const normOriginal = normalise(originalHtml)

  if (normRendered === normOriginal) {
    console.log(`✅ ${slug}: PASS`)
    pass++
  } else {
    // Find first difference
    let firstDiffIdx = -1
    for (let i = 0; i < Math.max(normRendered.length, normOriginal.length); i++) {
      if (normRendered[i] !== normOriginal[i]) {
        firstDiffIdx = i
        break
      }
    }
    const ctx = 160
    const start = Math.max(0, firstDiffIdx - ctx)
    const end = firstDiffIdx + ctx

    console.error(`❌ ${slug}: FAIL (first diff @ char ${firstDiffIdx})`)
    console.error('  backup:   ' + JSON.stringify(normOriginal.slice(start, end)))
    console.error('  rendered: ' + JSON.stringify(normRendered.slice(start, end)))
    fail++
    failures.push({ slug, reason: `diff at ${firstDiffIdx}` })
  }
}

console.log(`\n▸ Summary: ${pass} pass, ${fail} fail`)

if (fail > 0) process.exit(1)
process.exit(0)
