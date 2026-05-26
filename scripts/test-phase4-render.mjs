#!/usr/bin/env node
/**
 * test-phase4-render.mjs
 *
 * Combined test harness for the Phase 4 build scripts:
 *   - contact (build-contact.mjs)
 *   - insights-index (build-insights-index.mjs)
 *   - subscribe-details (build-subscribe-details.mjs)
 *   - thank-you-subscribe (build-thank-you-subscribe.mjs)
 *
 * Reads studio/seed-phase4.ndjson (4 docs), imports each renderer, runs it
 * against the corresponding .pre-sanity-backup, and whitespace-normalised
 * diffs the result. Exit 0 iff all 4 pass.
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderContactPage } from './build-contact.mjs'
import { renderInsightsIndexPage } from './build-insights-index.mjs'
import { renderSubscribeDetailsPage } from './build-subscribe-details.mjs'
import { renderThankYouSubscribePage } from './build-thank-you-subscribe.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ── Load seed ────────────────────────────────────────────────────────────────
const seedPath = path.join(ROOT, 'studio', 'seed-phase4.ndjson')
if (!existsSync(seedPath)) {
  console.error('❌ FAIL: seed-phase4.ndjson not found at', seedPath)
  process.exit(1)
}

const seedDocs = readFileSync(seedPath, 'utf8')
  .split('\n')
  .filter((line) => line.trim().length > 0)
  .map((line) => JSON.parse(line))

const byId = Object.fromEntries(seedDocs.map((d) => [d._id, d]))

// ── Whitespace normalisation ─────────────────────────────────────────────────
function normalise(html) {
  return html
    .replace(/^<!--\s*SANITY-GENERATED[^\n]*-->\n?/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function diff(rendered, original) {
  const a = normalise(rendered)
  const b = normalise(original)
  if (a === b) return null
  let idx = -1
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      idx = i
      break
    }
  }
  const ctx = 120
  const start = Math.max(0, idx - ctx)
  const end = idx + ctx
  return {
    idx,
    original: b.slice(start, end),
    rendered: a.slice(start, end),
  }
}

// ── Cases ────────────────────────────────────────────────────────────────────
const cases = [
  {
    name: 'contact',
    backup: 'contact.html.pre-sanity-backup',
    docId: 'contactPage',
    render: renderContactPage,
  },
  {
    name: 'insights-index',
    backup: 'insights.html.pre-sanity-backup',
    docId: 'insightsIndexPage',
    render: renderInsightsIndexPage,
  },
  {
    name: 'subscribe-details',
    backup: 'subscribe-details.html.pre-sanity-backup',
    docId: 'subscribeDetailsPage',
    render: renderSubscribeDetailsPage,
  },
  {
    name: 'thank-you-subscribe',
    backup: 'thank-you-subscribe.html.pre-sanity-backup',
    docId: 'thankYouSubscribePage',
    render: renderThankYouSubscribePage,
  },
]

console.log('▸ test-phase4-render: running render pipeline against seed data…')

let passes = 0
const failures = []

for (const c of cases) {
  const templatePath = path.join(ROOT, c.backup)
  if (!existsSync(templatePath)) {
    failures.push({ name: c.name, reason: `missing backup: ${c.backup}` })
    continue
  }
  const original = readFileSync(templatePath, 'utf8')
  const doc = byId[c.docId]
  if (!doc) {
    failures.push({ name: c.name, reason: `seed doc missing: _id=${c.docId}` })
    continue
  }

  let rendered
  try {
    rendered = c.render(original, doc)
  } catch (err) {
    failures.push({ name: c.name, reason: `render threw: ${err.message}` })
    continue
  }

  const d = diff(rendered, original)
  if (!d) {
    console.log(`  ✅ PASS  ${c.name}`)
    passes++
  } else {
    failures.push({
      name: c.name,
      reason: `whitespace-normalised diff at char ${d.idx}`,
      d,
    })
  }
}

console.log('')
console.log(`▸ ${passes}/${cases.length} passed`)

if (failures.length === 0) {
  console.log('✅ ALL PASS')
  process.exit(0)
}

for (const f of failures) {
  console.error(`❌ FAIL  ${f.name} — ${f.reason}`)
  if (f.d) {
    console.error('  --- backup (original):')
    console.error('  ' + JSON.stringify(f.d.original))
    console.error('  --- rendered:')
    console.error('  ' + JSON.stringify(f.d.rendered))
  }
}
process.exit(1)
