import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'approachRow',
  title: 'Approach Row',
  type: 'object',
  fields: [
    defineField({
      name: 'num',
      title: 'Roman numeral',
      type: 'string',
      description: 'e.g. "I.", "II.", "III.", "IV."',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Short heading for this approach point.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 4,
      description: 'Explanatory paragraph.',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
