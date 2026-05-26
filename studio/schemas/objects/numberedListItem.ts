import { defineType, defineField } from 'sanity'

/**
 * numberedListItem — a single item in the family/network numbered list.
 * num is the roman-numeral marker, e.g. "i.", "ii.", "iii.", "iv."
 */
export default defineType({
  name: 'numberedListItem',
  title: 'Numbered List Item',
  type: 'object',
  fields: [
    defineField({
      name: 'num',
      title: 'Number',
      type: 'string',
      description: 'Roman numeral marker, e.g. "i.", "ii.", "iii.", "iv."',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 2,
      description: 'The list item body text.',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'num',
      subtitle: 'text',
    },
  },
})
