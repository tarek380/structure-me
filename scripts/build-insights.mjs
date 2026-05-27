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

// Default fallback images (already in repo) keyed to the filter slug.
// Used when an insightsPost has no heroImage in Sanity yet.
const DEFAULT_IMAGES = {
  advisory: '/img/insights/1-advisory.jpg',
  structuring: '/img/insights/2-structuring.jpg',
  international: '/img/insights/3-international.jpg',
  'family-office': '/img/insights/4-family-office.jpg',
  exit: '/img/insights/5-exit.jpg',
  default: '/img/insights/hero.jpg',
}

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
// safeReplace — like String.replace(re, fn) but avoids $ backreference issues.
// ------------------------------------------------------------------
function safeReplace(html, regex, buildFn) {
  return html.replace(regex, (...args) => {
    const groups = args.slice(1, -2)
    return buildFn(...groups)
  })
}

// ------------------------------------------------------------------
// Internal link resolver for Portable Text link marks
// ------------------------------------------------------------------
function resolveInternalRef(ref) {
  if (!ref) return null
  const type = ref._type
  const slug = ref.slug
  if (type === 'homePage') return '/'
  if (type === 'aboutPage') return '/about'
  if (type === 'contactPage') return '/contact'
  if (type === 'insightsIndexPage') return '/insights'
  if (type === 'subscribeDetailsPage') return '/subscribe-details'
  if (type === 'thankYouSubscribePage') return '/thank-you-subscribe'
  if (type === 'servicePage') return slug ? `/${slug}` : null
  if (type === 'insightsPost') return slug ? `/insights/${slug}` : null
  return null
}

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
      // Feature 4: support internal page references and external URLs
      let href = ''
      let targetAttr = ''

      if (value?.linkType === 'internal') {
        // Resolve internal reference to a URL path
        const resolved = resolveInternalRef(value?.internalRef)
        href = resolved || '#'
      } else {
        // External URL (or legacy data with no linkType)
        href = value?.href || '#'
      }

      // new-tab: honour openInNewTab (new field) or legacy newWindow field
      const openNew = value?.openInNewTab || value?.newWindow
      if (openNew) {
        targetAttr = ' target="_blank" rel="noopener noreferrer"'
      }

      return `<a href="${href}"${targetAttr}>${children}</a>`
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
// Category → filter-slug mapping (shared between listing + article)
// ------------------------------------------------------------------
function categoryToFilter(cat) {
  if (!cat) return 'advisory'
  const c = String(cat).toLowerCase()
  if (c.includes('structur')) return 'structuring'
  if (c.includes('international') || c.includes('cross-border')) return 'international'
  if (c.includes('family')) return 'family-office'
  if (c.includes('exit') || c.includes('sale') || c.includes('succession')) return 'exit'
  if (c.includes('advisory') || c.includes('capital') || c.includes('strategy')) return 'advisory'
  return 'advisory'
}

// ------------------------------------------------------------------
// Feature 2: Render related-reading cards for an article page
// ------------------------------------------------------------------
function renderRelatedCards(relatedPosts) {
  if (!relatedPosts || relatedPosts.length === 0) return ''

  const cardsHtml = relatedPosts.map((p) => {
    const slug = p.slug?.current || ''
    const filterSlug = categoryToFilter(p.category)
    const img = p.heroImage
      ? urlFor(p.heroImage).width(900).quality(78).url()
      : (DEFAULT_IMAGES[filterSlug] || DEFAULT_IMAGES.default)
    const dateShort = new Date(p.publishedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    const readingMin = p.readingMinutes ? ` · ${p.readingMinutes} min` : ''
    const flagLabel = escapeHtml(p.category || 'Insights')
    return `      <a class="insights-card" href="../insights/${slug}">
        <div class="insights-card-image" style="background-image: url('${img}');" aria-hidden="true"></div>
        <div class="insights-card-flag">— ${flagLabel}</div>
        <h3 class="insights-card-title">${escapeHtml(p.title)}</h3>
        <div class="insights-card-meta">${dateShort}${readingMin}</div>
      </a>`
  }).join('\n')

  return `    <section class="article-related" aria-labelledby="article-related-h">
      <div class="article-related-inner">
        <h2 id="article-related-h" class="article-related-title">Related Reading</h2>
        <div class="article-related-grid">
${cardsHtml}
        </div>
      </div>
    </section>`
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
  const articleFallback = DEFAULT_IMAGES[categoryToFilter(post.category)] || DEFAULT_IMAGES.default
  const heroImgUrl = post.heroImage
    ? urlFor(post.heroImage).width(1800).quality(82).url()
    : `${SITE_URL}${articleFallback}`
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
        <span class="article-takeaways-label">Key takeaways</span>
        <h3>What to remember</h3>
        <ul>${post.takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
      </section>`
    : ''

  // Feature 2: related reading section
  const relatedSection = renderRelatedCards(post.relatedPosts)

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
${relatedSection}
    </main>
    ${renderFooter()}
    <script src="../js/subscribe-widget.js" defer></script>
  </body>
</html>
`
}

// Header — mirrors the markup used on every other page (insights.html, about.html, etc.)
// so the global stylesheet's `.nav nav--on-light` rules apply.
function renderHeader() {
  return `<header class="nav nav--on-light nav--service" id="nav">
      <div class="nav-inner">
        <a href="../" class="nav-brand" aria-label="Structure Me — Home">
          <svg class="nav-logo" viewBox="0 0 40 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square">
              <path d="M3 4 L18 4" /><path d="M3 14 L18 14" /><path d="M3 24 L18 24" />
              <path d="M3 4 L3 14" opacity="0.55" /><path d="M18 14 L18 24" opacity="0.55" />
              <path d="M24 24 L24 4" /><path d="M24 4 L31 14" />
              <path d="M31 14 L37 4" opacity="0.85" /><path d="M37 4 L37 24" />
            </g>
          </svg>
          <span class="nav-wordmark">
            <span class="nav-wordmark-line">Structure</span>
            <span class="nav-wordmark-line">Me</span>
          </span>
        </a>
        <div class="nav-actions">
          <a href="../contact.html" class="nav-cta">
            <span>Begin a conversation</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
          <button class="nav-toggle" id="navToggle" aria-label="Open menu" aria-controls="navOverlay" aria-expanded="false" type="button">
            <span class="nav-toggle-label">Menu</span>
            <span class="nav-toggle-icon" aria-hidden="true"><span></span><span></span></span>
          </button>
        </div>
      </div>
    </header>
    <div class="nav-overlay" id="navOverlay" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Site navigation">
      <div class="nav-overlay-bg" aria-hidden="true"></div>
      <div class="nav-overlay-inner">
        <div class="nav-overlay-eyebrow">— Navigate</div>
        <nav class="nav-overlay-menu" aria-label="Primary">
          <a href="../advisory.html" data-overlay-link><span class="nav-overlay-num">01</span><span class="nav-overlay-label">Business Advisory</span></a>
          <a href="../business-structuring.html" data-overlay-link><span class="nav-overlay-num">02</span><span class="nav-overlay-label">Business Structuring</span></a>
          <a href="../international.html" data-overlay-link><span class="nav-overlay-num">03</span><span class="nav-overlay-label">International Business Structuring</span></a>
          <a href="../family-office.html" data-overlay-link><span class="nav-overlay-num">04</span><span class="nav-overlay-label">Family Office Structuring</span></a>
          <a href="../exit-strategy.html" data-overlay-link><span class="nav-overlay-num">05</span><span class="nav-overlay-label">Business Exit Strategy</span></a>
          <a href="../about.html" data-overlay-link><span class="nav-overlay-num">06</span><span class="nav-overlay-label">About</span></a>
          <a href="../insights.html" data-overlay-link><span class="nav-overlay-num">07</span><span class="nav-overlay-label">Insights</span></a>
          <a href="../contact.html" data-overlay-link><span class="nav-overlay-num">08</span><span class="nav-overlay-label">Begin a conversation</span></a>
        </nav>
        <div class="nav-overlay-footer">
          <div class="nav-overlay-social">
            <a href="https://www.instagram.com/structureme" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/></svg></a>
            <a href="https://www.facebook.com/structureme" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h-2.5C9.6 4 8.5 5.1 8.5 7v2H6.5v3.5h2V20h3.5v-7.5h2.4l.6-3.5h-3V7.4c0-.6.3-.9 1-.9H14V4z"/></svg></a>
            <a href="https://www.linkedin.com/company/structureme" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="7.5" cy="8" r="0.6" fill="currentColor" stroke="none"/><path d="M7 11v6"/><path d="M11 11v6"/><path d="M11 13.5c0-1.4 1.1-2.5 2.5-2.5S16 12.1 16 13.5V17"/></svg></a>
          </div>
        </div>
      </div>
    </div>`
}
function renderFooter() {
  // Mirrors the structure of insights.html / about.html so styles apply.
  return `<footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <svg class="footer-logo" viewBox="0 0 40 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square">
              <path d="M3 4 L18 4" /><path d="M3 14 L18 14" /><path d="M3 24 L18 24" />
              <path d="M3 4 L3 14" opacity="0.55" /><path d="M18 14 L18 24" opacity="0.55" />
              <path d="M24 24 L24 4" /><path d="M24 4 L31 14" />
              <path d="M31 14 L37 4" opacity="0.85" /><path d="M37 4 L37 24" />
            </g>
          </svg>
          <div class="footer-brand-text">
            <span class="footer-brand-name">Structure Me</span>
            <span class="footer-brand-sub">Advisory · Business · International · Family Office · Exit</span>
          </div>
        </div>

        <div class="footer-cols">
          <div class="footer-col">
            <h4>Services</h4>
            <a href="../advisory.html">Business advisory</a>
            <a href="../business-structuring.html">Business structuring</a>
            <a href="../international.html">International business structuring</a>
            <a href="../family-office.html">Family office structuring</a>
            <a href="../exit-strategy.html">Business exit strategy</a>
          </div>
          <div class="footer-col">
            <h4>Firm</h4>
            <a href="../about.html">About</a>
            <a href="../about.html#team">The team</a>
            <a href="../insights.html">Insights</a>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <span class="footer-city">Melbourne</span>
            <address class="footer-address">Level 4 / 380 Collins Street<br />Melbourne</address>
            <a href="../contact.html" class="footer-getintouch">Get in touch</a></div>
        </div>
      </div>

      <div class="footer-base">
        <span>© 2026 Structure Me Pty Ltd</span>
        <span class="footer-base-divider">·</span>
        <span>Information only · Not legal or tax advice</span>
        <span class="footer-base-spacer"></span>
        <a href="#">Privacy</a>
        <span class="footer-base-divider">·</span>
        <a href="#">Terms</a>
      </div>
    </footer>
    <script>
      // Mobile menu overlay toggle
      (function () {
        var toggle = document.getElementById('navToggle');
        var overlay = document.getElementById('navOverlay');
        if (!toggle || !overlay) return;
        var links = overlay.querySelectorAll('[data-overlay-link]');
        var open = function () { overlay.classList.add('is-open'); overlay.setAttribute('aria-hidden', 'false'); toggle.classList.add('is-active'); toggle.setAttribute('aria-expanded', 'true'); document.body.classList.add('nav-open'); };
        var close = function () { overlay.classList.remove('is-open'); overlay.setAttribute('aria-hidden', 'true'); toggle.classList.remove('is-active'); toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('nav-open'); };
        toggle.addEventListener('click', function () { if (overlay.classList.contains('is-open')) close(); else open(); });
        for (var i = 0; i < links.length; i++) { links[i].addEventListener('click', function () { setTimeout(close, 60); }); }
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('is-open')) close(); });
      })();
    <\/script>`
}

// ------------------------------------------------------------------
// Feature 1: Rebuild the hero card on insights.html
// ------------------------------------------------------------------
async function rebuildHeroCard(posts, heroPost) {
  const listingPath = path.join(ROOT, 'insights.html')
  const listingExists = await fs.access(listingPath).then(() => true).catch(() => false)
  if (!listingExists) return

  const html = await fs.readFile(listingPath, 'utf8')
  const startMarker = '<!-- INSIGHTS:HERO:START -->'
  const endMarker = '<!-- INSIGHTS:HERO:END -->'

  if (!html.includes(startMarker) || !html.includes(endMarker)) {
    console.log('  ℹ insights.html has no INSIGHTS:HERO markers — leaving hero untouched.')
    return html
  }

  // Determine which post to feature: heroPost from Sanity if set, else newest post
  let featured = null
  if (heroPost && heroPost._id) {
    featured = heroPost
    console.log(`  ✓ Using heroPost from Sanity: "${featured.title}"`)
  } else if (posts.length > 0) {
    featured = posts[0] // already sorted publishedAt desc
    console.log(`  ✓ No heroPost set — falling back to newest post: "${featured.title}"`)
  }

  if (!featured) {
    console.log('  ℹ No posts available for hero — leaving hero untouched.')
    return html
  }

  const slug = featured.slug?.current || ''
  const filterSlug = categoryToFilter(featured.category)
  const img = featured.heroImage
    ? urlFor(featured.heroImage).width(1200).quality(82).url()
    : (DEFAULT_IMAGES[filterSlug] || DEFAULT_IMAGES.default)
  const dateISO = new Date(featured.publishedAt).toISOString().split('T')[0]
  const dateReadable = new Date(featured.publishedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const readingMin = featured.readingMinutes ? `${featured.readingMinutes} min read` : ''
  const categoryLabel = featured.category || 'Insights'
  const flagLabel = escapeHtml(`Featured · ${categoryLabel}`)
  const dekHtml = featured.dek
    ? `          <p class="insights-featured-dek">\n              ${escapeHtml(featured.dek)}\n            </p>`
    : ''

  const newCard = `
        <a class="insights-featured-card" id="featuredCard" href="insights/${slug}" data-card data-category="${filterSlug}" data-date="${dateISO}" data-image="${img}">
          <div class="insights-featured-content">
            <span class="insights-featured-flag">— ${flagLabel}</span>
            <h2 class="insights-featured-title">
              ${escapeHtml(featured.title)}
            </h2>
${dekHtml}
            <div class="insights-featured-meta">
              <span>${dateReadable}</span>
              ${readingMin ? `<span class="insights-featured-meta-sep" aria-hidden="true"></span>\n              <span>${readingMin}</span>` : ''}
              <span class="insights-featured-meta-sep" aria-hidden="true"></span>
              <span>Read piece →</span>
            </div>
          </div>
          <div class="insights-featured-image" style="background-image: url('${img}');" aria-hidden="true"></div>
        </a>`

  const updated = safeReplace(
    html,
    new RegExp(`(${escapeRegex(startMarker)})[\\s\\S]*?(${escapeRegex(endMarker)})`),
    (pre, post) => `${pre}\n${newCard}\n${post}`
  )

  await fs.writeFile(listingPath, updated)
  console.log('  ✓ insights.html hero card refreshed')
  return updated
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
      const filterSlugInner = categoryToFilter(p.category)
      const img = p.heroImage
        ? urlFor(p.heroImage).width(900).quality(78).url()
        : (DEFAULT_IMAGES[filterSlugInner] || DEFAULT_IMAGES.default)
      const dateISO = new Date(p.publishedAt).toISOString().split('T')[0]
      const dateShort = new Date(p.publishedAt).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
      const readingMin = p.readingMinutes ? ` · ${p.readingMinutes} min` : ''
      const flagLabel = escapeHtml(p.category || 'Insights')
      return `          <a class="insights-card" data-card data-category="${filterSlugInner}" data-date="${dateISO}" data-image="${img}" href="insights/${slug}">
            <div class="insights-card-image" style="background-image: url('${img}');" aria-hidden="true"></div>
            <div class="insights-card-flag">— ${flagLabel}</div>
            <h3 class="insights-card-title">${escapeHtml(p.title)}</h3>
            ${p.dek ? `<p class="insights-card-dek">${escapeHtml(p.dek)}</p>` : ''}
            <div class="insights-card-meta">${dateShort}${readingMin}</div>
          </a>`
    })
    .join('\n\n')

  const html = await fs.readFile(listingPath, 'utf8')
  // Replace content between markers if present
  const start = '<!-- INSIGHTS:CARDS:START -->'
  const end = '<!-- INSIGHTS:CARDS:END -->'
  if (html.includes(start) && html.includes(end)) {
    const next = safeReplace(
      html,
      new RegExp(`(${escapeRegex(start)})[\\s\\S]*?(${escapeRegex(end)})`),
      (pre, post) => `${pre}\n${cardsHtml}\n        ${post}`
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
    const next = safeReplace(
      current,
      new RegExp(`(${escapeRegex(start)})[\\s\\S]*?(${escapeRegex(end)})`),
      (pre, post) => `${pre}\n${articleEntries}\n  ${post}`
    )
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

  // Fetch all published posts (with relatedPosts dereferenced)
  let posts = []
  let indexPageDoc = null
  try {
    posts = await client.fetch(
      `*[_type == "insightsPost" && !(_id in path("drafts.**"))]|order(publishedAt desc){
        _id, title, slug, flag, dek, publishedAt, category, readingMinutes,
        body[]{...,markDefs[]{...,internalRef->{_type,"slug":slug.current}}},
        takeaways, metaTitle, metaDescription, metaKeywords, tags,
        heroImage{..., asset->{_id, url}},
        ogImage{..., asset->{_id, url}},
        "author": author->{name, role},
        "relatedPosts": relatedPosts[]->{
          _id, slug, title, category, publishedAt, readingMinutes, dek,
          heroImage{..., asset->{_id, url}}
        }
      }`
    )
    // Fetch the insightsIndexPage for heroPost
    indexPageDoc = await client.fetch(
      `*[_type == "insightsIndexPage" && !(_id in path("drafts.**"))][0]{
        heroPost->{
          _id, slug, title, category, dek, publishedAt, readingMinutes,
          heroImage{..., asset->{_id, url}}
        }
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

    // Feature 2: if no relatedPosts set, fall back to 3 most recent other posts
    if (!post.relatedPosts || post.relatedPosts.length === 0) {
      post.relatedPosts = posts.filter((p) => p._id !== post._id).slice(0, 3)
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

  // Feature 1: rebuild hero card on insights.html
  const heroPost = indexPageDoc?.heroPost || null
  await rebuildHeroCard(posts, heroPost)

  // Rebuild listing grid (cards)
  await rebuildListingPage(posts)
  await rebuildSitemap(posts)

  console.log('▸ Done.')
}

main().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
