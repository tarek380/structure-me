import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * servicePillar — one of the 5 main content pillars on a service page.
 *
 * Layouts:
 *  - 'list'        → single bulleted list (<ul class="svc-pillar-list">)
 *  - 'two-column'  → two <h3>+<ul> columns (<div class="svc-pillar-two">)
 *
 * The dark/cream/reverse modifier and image-side is determined positionally
 * by the build script based on pillar index — not stored here.
 */
export default defineType({
  name: 'servicePillar',
  title: 'Service Pillar',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'e.g. "— 01 · Real solutions, not paperwork"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title (raw HTML)',
      type: 'text',
      rows: 2,
      description:
        'Inline HTML. Allowed tags: <em>, <strong>, <br />. ' +
        'e.g. "The right <em>structures</em><br />for a business that will thrive."',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bodyParagraphs',
      title: 'Body paragraphs',
      type: 'array',
      description: 'One or two paragraphs of prose between the title and the list.',
      of: [{ type: 'text' }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      description: '"list" = single ul; "two-column" = two h3+ul columns.',
      options: { list: ['list', 'two-column'] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'listItems',
      title: 'List items',
      type: 'array',
      description: 'Used when layout = "list". Each item = one <li>.',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'columns',
      title: 'Columns (two-column layout)',
      type: 'array',
      description: 'Used when layout = "two-column". Exactly two columns.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'pillarColumn',
          fields: [
            defineField({
              name: 'heading',
              title: 'Heading',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'items',
              title: 'Items',
              type: 'array',
              of: [{ type: 'string' }],
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'linkLabel',
      title: 'Link label',
      type: 'string',
      description: 'CTA link text, e.g. "Speak to a business adviser".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'linkHref',
      title: 'Link href',
      type: 'string',
      description: 'e.g. "contact.html"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image path',
      type: 'string',
      description: 'Relative path, e.g. "img/advisory-structures.jpg".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'imageAsset',
      title: 'Image (upload)',
      type: 'image',
      description:
        'Optional. Upload here to override the "Image path" above. ' +
        'Sanity-hosted, CDN-delivered.',
      options: { hotspot: true },
    }),
  ],

  preview: {
    select: { title: 'eyebrow', subtitle: 'layout' },
  },
})
