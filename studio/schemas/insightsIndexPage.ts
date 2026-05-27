import { defineType, defineField } from 'sanity'

/**
 * insightsIndexPage — singleton. _id is 'insightsIndexPage'.
 * Manages ONLY the <section class="insights-newsletter"> block on insights.html.
 * The featured-card and insights-grid are managed by build-insights.mjs.
 */
export default defineType({
  name: 'insightsIndexPage',
  title: 'Insights Index Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],

  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO & meta' },
  ],

  fields: [
    defineField({
      name: 'heroPost',
      title: 'Featured (hero) article',
      type: 'reference',
      to: [{ type: 'insightsPost' }],
      description:
        'The post shown in the big "Featured" hero block at the top of the insights page. ' +
        'If empty, falls back to the newest published post.',
      group: 'content',
    }),

    defineField({
      name: 'newsletter',
      title: 'Newsletter section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— Quiet quarterly note"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "One piece, every quarter,<br />on the work that <em>compounds</em>."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede paragraph',
          type: 'text',
          rows: 4,
          description: 'Paragraph beneath the title.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'placeholder',
          title: 'Input placeholder',
          type: 'string',
          description: 'e.g. "you@yourbusiness.com"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'buttonLabel',
          title: 'Button label',
          type: 'string',
          description: 'e.g. "Subscribe"',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── SEO ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'metaTitle',
      title: 'Meta title (browser tab + SERP)',
      type: 'string',
      group: 'seo',
      description: 'Defaults to page title if blank. Max 70 characters recommended.',
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      group: 'seo',
      description: 'Shown in search results beneath the title. Max 200 characters.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'metaKeywords',
      title: 'Meta keywords',
      type: 'string',
      group: 'seo',
      description: 'Comma-separated keywords.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social-share image (OG image)',
      type: 'image',
      group: 'seo',
      description: 'Social share image. 1200x630 recommended. Falls back to hero image.',
    }),
    ],
  preview: {
    prepare() {
      return { title: 'Insights Index Page' }
    },
  },
})
