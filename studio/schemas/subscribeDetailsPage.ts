import { defineType, defineField } from 'sanity'

/**
 * subscribeDetailsPage — singleton. _id is 'subscribeDetailsPage'.
 * Manages the hero block (eyebrow, title, lede) and the consent fineprint
 * on subscribe-details.html. The form markup is static.
 */
export default defineType({
  name: 'subscribeDetailsPage',
  title: 'Subscribe Details Page',
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
          description: 'e.g. "— One more step"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "A few <em>details</em>, then we\'re done."',
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
      ],
    }),

    defineField({
      name: 'form',
      title: 'Form content',
      type: 'object',
      fields: [
        defineField({
          name: 'submitLabel',
          title: 'Submit button label',
          type: 'string',
          description: 'e.g. "Confirm subscription"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'consent',
          title: 'Consent fineprint',
          type: 'text',
          rows: 3,
          description: 'The paragraph below the submit button.',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return { title: 'Subscribe Details Page' }
    },
  },
})
