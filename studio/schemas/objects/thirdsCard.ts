import { defineType, defineField } from 'sanity'

/**
 * thirdsCard — one of the three "Why us" cards (1/3, 2/3, 3/3).
 */
export default defineType({
  name: 'thirdsCard',
  title: 'Thirds Card',
  type: 'object',
  fields: [
    defineField({
      name: 'num',
      title: 'Number label',
      type: 'string',
      description: 'e.g. "1 / 3", "2 / 3", "3 / 3".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'heading', subtitle: 'num' },
  },
})
