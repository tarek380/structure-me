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

  fields: [
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
  ],

  preview: {
    prepare() {
      return { title: 'Insights Index Page' }
    },
  },
})
