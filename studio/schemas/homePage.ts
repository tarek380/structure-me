import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * homePage — singleton document. _id is fixed to 'homePage'.
 * __experimental_actions restricts to update + publish only (no create/delete).
 * Covers all 8 homepage sections: hero, creds, divider, services, philosophy,
 * metrics, approach, contactCta.
 */
export default defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  // Singleton: prevent creating new docs or deleting
  __experimental_actions: ['update', 'publish'],

  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO & meta' },
  ],

  fields: [
    // ── HERO ──────────────────────────────────────────────────────────────
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow text',
          type: 'string',
          description: 'e.g. "Business Structuring & Business Advisory"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'headlineLines',
          title: 'Headline lines',
          type: 'array',
          description:
            'Each item is one <span class="hl-line"> in the h1. Use em marks for gold-highlighted words. ' +
            'Currently two lines: "Solid structures" and "to grow and protect."',
          of: [
            defineArrayMember({
              type: 'highlightedText',
              title: 'Headline line',
            }),
          ],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: 'sub',
          title: 'Sub-headline',
          type: 'text',
          rows: 2,
          description: 'Paragraph beneath the headline.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cta',
          title: 'CTA Button',
          type: 'cta',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'pillars',
          title: 'Pillars',
          type: 'array',
          description: 'Four numbered pillars shown beneath the CTA (e.g. "01 We Analyse").',
          of: [defineArrayMember({ type: 'pillar' })],
          validation: (Rule) => Rule.required().length(4),
        }),
        defineField({
          name: 'videoWebm',
          title: 'Hero video — WebM source',
          type: 'string',
          initialValue: 'video/hero.webm',
          description: 'Relative path to the .webm video. Defaults to video/hero.webm.',
        }),
        defineField({
          name: 'videoMp4',
          title: 'Hero video — MP4 source',
          type: 'string',
          initialValue: 'video/hero.mp4',
          description: 'Relative path to the .mp4 video. Defaults to video/hero.mp4.',
        }),
        defineField({
          name: 'videoPoster',
          title: 'Hero video — Poster image',
          type: 'string',
          initialValue: 'video/hero-poster.jpg',
          description: 'Relative path to the poster image. Defaults to video/hero-poster.jpg.',
        }),
      ],
    }),

    // ── CREDS ─────────────────────────────────────────────────────────────
    defineField({
      name: 'creds',
      title: 'Credentials strip',
      type: 'object',
      fields: [
        defineField({
          name: 'label',
          title: 'Label',
          type: 'string',
          description: 'e.g. "Built For"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'items',
          title: 'Items',
          type: 'array',
          description: 'The credential items shown separated by dots, e.g. "Ambitious Business Owners".',
          of: [{ type: 'string' }],
          validation: (Rule) => Rule.required().min(1),
        }),
      ],
    }),

    // ── DIVIDER ───────────────────────────────────────────────────────────
    defineField({
      name: 'divider',
      title: 'Full-bleed divider',
      type: 'object',
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'e.g. "Melbourne · Headquarters"',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── SERVICES ──────────────────────────────────────────────────────────
    defineField({
      name: 'services',
      title: 'Services section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— What we do"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Section title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'Example: "Five disciplines,<br /><em>one architecture</em>."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Section lede',
          type: 'text',
          rows: 3,
          description: 'Introductory paragraph beneath the title.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cards',
          title: 'Service cards',
          type: 'array',
          description: 'Five service cards in order.',
          of: [defineArrayMember({ type: 'serviceCard' })],
          validation: (Rule) => Rule.required().length(5),
        }),
      ],
    }),

    // ── PHILOSOPHY ────────────────────────────────────────────────────────
    defineField({
      name: 'philosophy',
      title: 'Philosophy quote',
      type: 'object',
      fields: [
        defineField({
          name: 'quote',
          title: 'Quote',
          type: 'highlightedText',
          description: 'The blockquote text. Supports em/strong for highlighted words.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'attribution',
          title: 'Attribution',
          type: 'string',
          description: 'e.g. "Structure Me · Founding principle"',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── METRICS ───────────────────────────────────────────────────────────
    defineField({
      name: 'metrics',
      title: 'Metrics section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— By the numbers"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Section title',
          type: 'highlightedText',
          description: 'Supports em/strong. Current: "An architecture that compounds."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'items',
          title: 'Metrics',
          type: 'array',
          of: [defineArrayMember({ type: 'metric' })],
          validation: (Rule) => Rule.required().min(1),
        }),
      ],
    }),

    // ── APPROACH ──────────────────────────────────────────────────────────
    defineField({
      name: 'approach',
      title: 'Approach section',
      type: 'object',
      fields: [
        defineField({
          name: 'imageCaption',
          title: 'Image caption',
          type: 'string',
          description: 'Caption beneath the approach aside image, e.g. "Designed, not assembled"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— Our approach"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Section title',
          type: 'highlightedText',
          description: 'Supports em/strong. Current: "Architecture, before activity."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'rows',
          title: 'Approach rows',
          type: 'array',
          of: [defineArrayMember({ type: 'approachRow' })],
          validation: (Rule) => Rule.required().length(4),
        }),
      ],
    }),

    // ── CONTACT CTA ───────────────────────────────────────────────────────
    defineField({
      name: 'contactCta',
      title: 'Contact CTA section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— Begin"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'highlightedText',
          description: 'Supports em/strong. Current: "Most of our work begins with a quiet conversation."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede',
          type: 'text',
          rows: 3,
          description: 'Paragraph beneath the title.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cta',
          title: 'CTA Button',
          type: 'cta',
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
      return { title: 'Homepage' }
    },
  },
})
