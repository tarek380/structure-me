import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'serviceCard',
  title: 'Service Card',
  type: 'object',
  fields: [
    defineField({
      name: 'number',
      title: 'Number',
      type: 'string',
      description: 'e.g. "01 / 05"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Service name, e.g. "Business Advisory"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'copy',
      title: 'Copy',
      type: 'text',
      rows: 4,
      description: 'Main body paragraph for this service.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'points',
      title: 'Bullet Points',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Four to five short bullet points. Use & for ampersands.',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA Label',
      type: 'string',
      description: 'e.g. "Discover business advisory"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'ctaHref',
      title: 'CTA Link',
      type: 'string',
      description: 'Relative path, e.g. "advisory.html"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'imageCssClass',
      title: 'Image CSS class (read-only)',
      type: 'string',
      description:
        'CSS class that controls the tile background image (e.g. service-image--business-advisory). Images are currently managed in styles.css. Do not change this field unless styles.css is also updated.',
      readOnly: true,
    }),
  ],
})
