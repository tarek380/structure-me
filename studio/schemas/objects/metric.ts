import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'metric',
  title: 'Metric',
  type: 'object',
  fields: [
    defineField({
      name: 'num',
      title: 'Number',
      type: 'string',
      description: 'e.g. "15" or "$2B"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'suffix',
      title: 'Suffix',
      type: 'string',
      description: 'Optional suffix shown below the number, e.g. "structures". Leave blank if not needed.',
    }),
    defineField({
      name: 'plus',
      title: 'Show "+" after number?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'text',
      rows: 2,
      description: 'Descriptive text beneath the metric.',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
