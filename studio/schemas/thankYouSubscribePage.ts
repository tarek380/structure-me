import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * thankYouSubscribePage — singleton. _id is 'thankYouSubscribePage'.
 * Manages the thanks-hero block on thank-you-subscribe.html — eyebrow,
 * title, lede, meta rows, and the two CTA buttons.
 */
export default defineType({
  name: 'thankYouSubscribePage',
  title: 'Thank You Subscribe Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],

  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO & meta' },
  ],

  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— You\'re on the list"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "Welcome. You\'ll <em>hear</em> from us."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede paragraph',
          type: 'text',
          rows: 5,
          description: 'Paragraph beneath the title.',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    defineField({
      name: 'meta',
      title: 'Meta rows',
      type: 'array',
      description: 'Detail rows beneath the lede.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'thanksMetaRow',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value (raw HTML)',
              type: 'text',
              rows: 3,
              description:
                'Inline HTML allowed for inline links: <a class="thanks-link" href="…">…</a>',
              validation: (Rule) => Rule.required(),
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
            select: { label: 'label', value: 'value' },
            prepare({ label, value }) {
              return { title: label, subtitle: value }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: 'primaryCta',
      title: 'Primary CTA',
      type: 'cta',
      description: 'e.g. "Read the latest insight" → "insights.html"',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'secondaryCta',
      title: 'Secondary CTA',
      type: 'cta',
      description: 'e.g. "Return home" → "index.html"',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Thank You Subscribe Page' }
    },
  },
})
