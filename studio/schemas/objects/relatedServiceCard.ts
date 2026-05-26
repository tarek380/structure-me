import { defineType, defineField } from 'sanity'

/**
 * relatedServiceCard — a single card in the "Related Services" grid.
 * number is the display number string, e.g. "01 / 05".
 */
export default defineType({
  name: 'relatedServiceCard',
  title: 'Related Service Card',
  type: 'object',
  fields: [
    defineField({
      name: 'number',
      title: 'Number',
      type: 'string',
      description: 'Display number, e.g. "01 / 05".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Service name, e.g. "Business Advisory".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'blurb',
      title: 'Blurb',
      type: 'text',
      rows: 2,
      description: 'Short description beneath the title.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'Relative URL, e.g. "advisory.html".',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'number',
    },
  },
})
