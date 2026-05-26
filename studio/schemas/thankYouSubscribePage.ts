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
