# Migrate trusts article → Sanity insightsPost

## Goal
Convert `insights/trusts-companies-hybrids-business-structure.html` into a Sanity `insightsPost` document so it's editable in Studio. Also create an `author` doc for Tarek Murad. After publish, the build-insights script will regenerate the static `/insights/trusts-companies-hybrids-business-structure.html` from Sanity content (URL unchanged).

## Existing schema
`studio/schemas/insightsPost.ts` and `studio/schemas/author.ts` already registered. Use those.

`insightsPost` fields (from the schema, summary):
- `title` (string)
- `slug` (slug — set to `trusts-companies-hybrids-business-structure`)
- `flag` (string — small category label like "Article", "Briefing", etc. — check HTML for what's used)
- `dek` (string — the deck/subtitle/lede)
- `author` (reference to `author`)
- `publishedAt` (datetime)
- `category` (string)
- `readingMinutes` (number)
- `body` (block content / Portable Text — the actual article)
- `takeaways` (array of strings — the bullet list of key takeaways shown at end)
- `heroImage` (image with alt)
- SEO fields: `metaTitle`, `metaDescription`, `metaKeywords`, `ogImage`

`author` fields:
- `name`
- `slug`
- `role` (e.g. "Founder & Principal")
- `bio` (text)
- `avatar` (image — optional, leave empty)

## What to deliver

**File**: `studio/seed-insights.ndjson` (2 lines — one author doc, one insightsPost doc)

### Author doc
- `_id`: `author-tarek-murad`
- `name`: "Tarek Murad"
- `slug.current`: `tarek-murad`
- `role`: read from the article byline / contact page
- `bio`: short bio (1-2 sentences). If unsure, use: "Founder of Royce Stone Capital and Structure Me. Advises on private credit and business structuring for entrepreneurs and family offices."

### insightsPost doc
- `_id`: `insightsPost-trusts-companies-hybrids` (no dot — hyphenated, per Phase 3 rule)
- `_type`: `insightsPost`
- `title`: from the `<title>` or `<h1>` in the article
- `slug.current`: `trusts-companies-hybrids-business-structure`
- `flag`, `dek`, `category`, `publishedAt`, `readingMinutes`: extract from the article's hero section (look at `<header>`, `<time>`, `<span class="flag">`, etc.)
- `author`: `{ _type: 'reference', _ref: 'author-tarek-murad' }`
- `body`: **Portable Text array**. Convert each `<p>`, `<h2>`, `<h3>`, `<ul>`, `<ol>`, `<blockquote>`, etc. from the article body into Portable Text blocks. Preserve `<em>` and `<strong>` as marks. Preserve `<a href>` as marks too.
- `takeaways`: array of bullet point strings from the "Key takeaways" section at end of article (if present)
- `heroImage`: leave empty for now (string fallback path can be added later); SEO `ogImage` same

## Portable Text rules
- Headings: `{_type: 'block', style: 'h2', children: [{_type: 'span', text: '...'}]}`
- Paragraphs: `{_type: 'block', style: 'normal', children: [{_type: 'span', text: '...'}]}`
- Bullet list: each li becomes its own block with `listItem: 'bullet'`, `level: 1`
- Numbered list: `listItem: 'number'`
- Bold/italic: spans get `marks: ['strong']` or `marks: ['em']`
- Links: define in `markDefs` at block top, span gets that key in `marks`
- Blockquote: `style: 'blockquote'`
- Use `_key` random uuids for blocks, spans, markDefs

Example block:
```json
{
  "_key": "abc123",
  "_type": "block",
  "style": "h2",
  "children": [{"_key": "def456", "_type": "span", "text": "Section heading", "marks": []}],
  "markDefs": []
}
```

## Source HTML
Path: `insights/trusts-companies-hybrids-business-structure.html`

Read it carefully. Convert ONLY the article body content — skip:
- `<head>`, `<nav>`, `<header>` (site chrome)
- `<footer>`, scripts, "Related insights" section
- The hero banner/breadcrumb area (extract title/dek/flag/etc. from it, but don't put it in body)

## Quality bar
- All paragraphs, headings, lists, blockquotes, links preserved
- No raw HTML in span `.text` — only plain text with marks
- No empty blocks
- Each block has a unique `_key`

## What NOT to do
- Do NOT change the URL slug
- Do NOT modify `build-insights.mjs` — it already handles rendering
- Do NOT push or import — leave the seed file in the repo and the parent agent will import it

## Done criteria
- `studio/seed-insights.ndjson` exists with 2 valid NDJSON lines
- Each line is valid JSON when parsed
- Author has all required fields, post references author correctly
- Body Portable Text faithfully represents the article content
