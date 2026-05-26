#!/usr/bin/env node
/**
 * build-insights.mjs
 * Fetches Insights posts from Sanity and emits static HTML into /insights.
 * Designed to fail soft: if Sanity has no posts (or env vars are missing in
 * a preview build) the script logs and exits 0 so Vercel deploys still succeed.
 */

import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { toHTML } from '@portabletext/to-html'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const INSIGHTS_DIR = path.join(ROOT, 'insights')

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'r3uuoahs'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = '2024-01-01'
const SITE_URL = 'https://www.structureme.com.au'

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: true,
  // Read token only needed if dataset is private. Public-by-default for production.
  token: process.env.SANITY_READ_TOKEN || undefined,
})

const builder = imageUrlBuilder(client)
const urlFor = (src) => (src ? builder.image(src) : null)

// ------------------------------------------------------------------
// Portable Text serializers — match the existing article visual treatments
// ------------------------------------------------------------------
const ptComponents = {
  types: {
    inlineImage: ({ value }) => {
      if (!value?.asset) return ''
      const u = urlFor(value).width(1600).quality(85).url()
      const alt = (value.alt || '').replace(/"/g, '&quot;')
      const caption = value.caption ? `<figcaption>${escapeHtml(value.caption)}</figcaption>` : ''
      return `<figure>${`<img src="${u}" alt="${alt}" loading="lazy" />`}${caption}</figure>`
    },
    callout: ({ value }) => {
      const eyebrow = value.eyebrow ? `<span class="article-callout-eyebrow">${escapeHtml(value.eyebrow)}</span>` : ''
      const text = value.text ? `<p>${escapeHtml(value.text).replace(/\n/g, '<br />')}</p>` : ''
      return `<aside class="article-callout">${eyebrow}${text}</aside>`
    },
  },
  block: {
    h2: ({ children }) => `<h2>${children}</h2>`,
    h3: ({ children }) => `<h3>${children}</h3>`,
    blockquote: ({ children }) => `<blockquote class="article-pullquote">${children}</blockquote>`,
    normal: ({ children }) => `<p>${children}</p>`,
  },
  list: {
    bullet: ({ children }) => `<ul>${children}</ul>`,
    number: ({ children }) => `<ol>${children}</ol>`,
  },
  marks: {
    link: ({ children, value }) => {
      const target = value?.newWindow ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${value.href}"${target}>${children}</a>`
    },
    em: ({ children }) => `<em>${children}</em>`,
    strong: ({ children }) => `<strong>${children}</strong>`,
  },
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ------------------------------------------------------------------
// HTML template — single article page (mirrors existing design exactly)
// ------------------------------------------------------------------
function renderArticle(post) {
  const title = escapeHtml(post.title)
  const metaTitle = escapeHtml(post.metaTitle || `${post.title} | Structure Me`)
  const metaDesc = escapeHtml(post.metaDescription || post.dek || '')
  const metaKeywords = escapeHtml(post.metaKeywords || '')
  const slug = post.slug.current
  const canonical = `${SITE_URL}/insights/${slug}`
  const heroImgUrl = post.heroImage ? urlFor(post.heroImage).width(1800).quality(82).url() : ''
  const heroAlt = escapeHtml(post.heroImage?.alt || post.title)
  const ogImgUrl = post.ogImage ? urlFor(post.ogImage).width(1200).height(630).url() : heroImgUrl
  const flag = escapeHtml(post.flag || (post.category ? `${post.category} · Working paper` : 'Working paper'))
  const dek = escapeHtml(post.dek || '')
  const publishedISO = new Date(post.publishedAt).toISOString()
  const publishedReadable = new Date(post.publishedAt).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
  const author = post.author?.name ? escapeHtml(post.author.name) : 'Structure Me'
  const category = escapeHtml(post.category || 'Insights')
  const readingMin = post.readingMinutes ? `${post.readingMinutes} min read` : ''
  const bodyHtml = post.body ? toHTML(post.body, { components: ptComponents }) : ''
  const tags = Array.isArray(post.tags) ? post.tags : []
  const articleTags = tags.map((t) => `<meta property="article:tag" content="${escapeHtml(t)}" />`).join('\n    ')
  const takeaways = Array.isArray(post.takeaways) && post.takeaways.length
    ? `<section class="article-takeaways">
        <h2 class="article-h2">Key takeaways</h2>
        <ul class="article-list">${post.takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
      </section>`
    : ''

  // JSON-LD Article schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.dek || '',
    image: heroImgUrl ? [heroImgUrl] : [],
    datePublished: publishedISO,
    dateModified: publishedISO,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: 'Structure Me',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/img/logo.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  }

  return `<!doctype html>
<!-- SANITY-GENERATED — do not edit by hand. Source: Sanity project ${PROJECT_ID}. Edits will be overwritten by the next build. -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a0a0a" />

    <title>${metaTitle}</title>
    <meta name="description" content="${metaDesc}" />
    ${metaKeywords ? `<meta name="keywords" content="${metaKeywords}" />` : ''}
    <meta name="author" content="${author}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Structure Me" />
    <meta property="og:title" content="${escapeHtml(post.title)}" />
    <meta property="og:description" content="${metaDesc}" />
    ${ogImgUrl ? `<meta property="og:image" content="${ogImgUrl}" />` : ''}
    <meta property="og:url" content="${canonical}" />
    <meta property="article:published_time" content="${publishedISO}" />
    <meta property="article:modified_time" content="${publishedISO}" />
    <meta property="article:author" content="${author}" />
    <meta property="article:section" content="${category}" />
    ${articleTags}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(post.title)} · Structure Me" />
    <meta name="twitter:description" content="${metaDesc}" />
    ${ogImgUrl ? `<meta name="twitter:image" content="${ogImgUrl}" />` : ''}

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@300;400;500;600&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../styles.css" />

    <link rel="icon" type="image/svg+xml" href='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="%230a0a0a"/><g fill="none" stroke="%23c8a24a" stroke-width="2" stroke-linecap="square"><path d="M8 8h12M8 16h12M8 24h12"/><path d="M22 8v16"/></g></svg>' />

    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>
  <body class="article-page">
    <a href="#main" class="skip-link">Skip to content</a>
    ${renderHeader()}
    <main id="main">
      <article itemscope itemtype="https://schema.org/Article">
        <meta itemprop="datePublished" content="${publishedISO}" />
        <meta itemprop="dateModified" content="${publishedISO}" />
        ${heroImgUrl ? `<meta itemprop="image" content="${heroImgUrl}" />` : ''}

        <header class="article-hero">
          <div class="article-hero-inner">
            <span class="article-hero-flag">— ${flag}</span>
            <h1 class="article-hero-title" itemprop="name">${title}</h1>
            ${dek ? `<p class="article-hero-dek">${dek}</p>` : ''}
            <div class="article-meta">
              <span class="article-meta-item" itemprop="author">${author}</span>
              <span class="article-meta-sep">·</span>
              <time class="article-meta-item" datetime="${publishedISO}">${publishedReadable}</time>
              ${readingMin ? `<span class="article-meta-sep">·</span><span class="article-meta-item">${readingMin}</span>` : ''}
            </div>
          </div>
          ${heroImgUrl ? `<figure class="article-hero-figure">
            <div class="article-hero-image" style="background-image: url('${heroImgUrl}');" role="img" aria-label="${heroAlt}"></div>
          </figure>` : ''}
        </header>

        <section class="article-body">
          <div class="article-body-inner" itemprop="articleBody">
            ${bodyHtml}
            ${takeaways}
          </div>
        </section>
      </article>
    </main>
    ${renderFooter()}
    <script src="../js/subscribe-widget.js" defer></script>
  </body>
</html>
`
}

// Minimal header/footer — kept as functions so a future Sanity-driven nav is trivial.
function renderHeader() {
  return `<header class="site-header" data-article-header>
      <a href="../" class="brand" aria-label="Structure Me home">
        <span class="brand-mark">SM</span>
        <span class="brand-name">Structure<em>Me</em></span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="../insights.html">Insights</a>
        <a href="../about">About</a>
        <a href="../contact.html" class="nav-cta">Begin a conversation</a>
      </nav>
    </header>`
}
function renderFooter() {
  // Pulled from existing site footer — full version lives in source pages.
  return `<footer class="site-footer">
      <div class="footer-inner">
        <p>© Structure Me · Level 4, 380 Collins Street, Melbourne VIC 3000 · <a href="mailto:tarek@structureme.com.au">tarek@structureme.com.au</a></p>
      </div>
    </footer>`
}

// ------------------------------------------------------------------
// Listing page rebuild (insights.html grid)
// ------------------------------------------------------------------
async function rebuildListingPage(posts) {
  const listingPath = path.join(ROOT, 'insights.html')
  const listingExists = await fs
    .access(listingPath)
    .then(() => true)
    .catch(() => false)
  if (!listingExists) return

  const cardsHtml = posts
    .map((p) => {
      const slug = p.slug.current
      const img = p.heroImage ? urlFor(p.heroImage).width(900).quality(78).url() : ''
      const date = new Date(p.publishedAt).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
      return `
        <article class="insight-card">
          <a href="insights/${slug}" class="insight-card-link" aria-label="${escapeHtml(p.title)}">
            ${img ? `<div class="insight-card-image" style="background-image:url('${img}')" role="img" aria-label="${escapeHtml(p.heroImage?.alt || p.title)}"></div>` : ''}
            <div class="insight-card-body">
              <span class="insight-card-flag">— ${escapeHtml(p.category || 'Insights')}</span>
              <h3 class="insight-card-title">${escapeHtml(p.title)}</h3>
              ${p.dek ? `<p class="insight-card-dek">${escapeHtml(p.dek)}</p>` : ''}
              <time class="insight-card-date" datetime="${new Date(p.publishedAt).toISOString()}">${date}</time>
            </div>
          </a>
        </article>`
    })
    .join('\n')

  const html = await fs.readFile(listingPath, 'utf8')
  // Replace content between markers if present
  const start = '<!-- INSIGHTS:CARDS:START -->'
  const end = '<!-- INSIGHTS:CARDS:END -->'
  if (html.includes(start) && html.includes(end)) {
    const next = html.replace(
      new RegExp(`${start}[\\s\\S]*?${end}`),
      `${start}\n${cardsHtml}\n${end}`
    )
    await fs.writeFile(listingPath, next)
    console.log('  ✓ insights.html cards section refreshed')
  } else {
    console.log('  ℹ insights.html has no INSIGHTS:CARDS markers — leaving untouched. Add markers to enable auto-listing.')
  }
}

// ------------------------------------------------------------------
// Sitemap rebuild — preserves static URLs, refreshes article entries
// ------------------------------------------------------------------
async function rebuildSitemap(posts) {
  const sitemapPath = path.join(ROOT, 'sitemap.xml')
  const exists = await fs.access(sitemapPath).then(() => true).catch(() => false)
  if (!exists) return
  const current = await fs.readFile(sitemapPath, 'utf8')
  const articleEntries = posts
    .map((p) => {
      const slug = p.slug.current
      const lastmod = new Date(p.publishedAt).toISOString().split('T')[0]
      return `  <url>
    <loc>${SITE_URL}/insights/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    })
    .join('\n')
  const start = '<!-- SITEMAP:ARTICLES:START -->'
  const end = '<!-- SITEMAP:ARTICLES:END -->'
  if (current.includes(start) && current.includes(end)) {
    const next = current.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${articleEntries}\n  ${end}`)
    await fs.writeFile(sitemapPath, next)
    console.log('  ✓ sitemap.xml articles refreshed')
  } else {
    console.log('  ℹ sitemap.xml has no SITEMAP:ARTICLES markers — leaving untouched. Add markers to enable auto-update.')
  }
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  console.log(`▸ Sanity build — project=${PROJECT_ID} dataset=${DATASET}`)

  let posts = []
  try {
    posts = await client.fetch(
      `*[_type == "insightsPost" && !(_id in path("drafts.**"))]|order(publishedAt desc){
        _id, title, slug, flag, dek, publishedAt, category, readingMinutes,
        body, takeaways, metaTitle, metaDescription, metaKeywords, tags,
        heroImage{..., asset->{_id, url}},
        ogImage{..., asset->{_id, url}},
        "author": author->{name, role}
      }`
    )
  } catch (err) {
    console.warn(`  ⚠ Sanity fetch failed: ${err.message}`)
    console.warn('  ⚠ Skipping Insights build (this is fine for a first deploy before content is added).')
    process.exit(0)
  }

  console.log(`  found ${posts.length} published post${posts.length === 1 ? '' : 's'}`)
  if (posts.length === 0) {
    console.log('  nothing to render. Exiting cleanly.')
    process.exit(0)
  }

  await fs.mkdir(INSIGHTS_DIR, { recursive: true })

  for (const post of posts) {
    if (!post.slug?.current) {
      console.warn(`  ⚠ Skipping post "${post.title}" — missing slug.`)
      continue
    }
    const outPath = path.join(INSIGHTS_DIR, `${post.slug.current}.html`)
    // Safety: only overwrite files that we previously generated (have the marker) or new slugs.
    const existed = await fs.access(outPath).then(() => true).catch(() => false)
    if (existed) {
      const current = await fs.readFile(outPath, 'utf8')
      if (!current.includes('SANITY-GENERATED')) {
        console.log(`  ⚠ Skipping ${post.slug.current}.html — file exists and was hand-authored. Delete it manually to let Sanity take over.`)
        continue
      }
    }
    const html = renderArticle(post)
    await fs.writeFile(outPath, html)
    console.log(`  ✓ wrote ${path.relative(ROOT, outPath)}`)
  }

  await rebuildListingPage(posts)
  await rebuildSitemap(posts)

  console.log('▸ Done.')
}

main().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
