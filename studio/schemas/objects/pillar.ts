import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'pillar',
  title: 'Pillar',
  type: 'object',
  fields: [
    defineField({
      name: 'num',
      title: 'Number',
      type: 'string',
      description: 'e.g. "01"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'e.g. "We Analyse"',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
