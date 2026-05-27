import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * contactPage — singleton. _id is 'contactPage'.
 * Manages the contact-hero (eyebrow, title, lede, meta list) and the
 * contact-form aside (eyebrow, title, copy paragraph). The form markup
 * itself is static and not Sanity-managed.
 */
export default defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  __experimental_actions: ['update', 'publish'],

  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO & meta' },
  ],

  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow text',
          type: 'string',
          description: 'e.g. "— Contact · Structure Me"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "Begin a <em>conversation</em>."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede paragraph',
          type: 'text',
          rows: 5,
          description: 'Opening paragraph beneath the title.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'meta',
          title: 'Meta list items',
          type: 'array',
          description: 'Rows under the lede: Email, Phone, Office, etc.',
          of: [defineArrayMember({ type: 'contactMetaItem' })],
          validation: (Rule) => Rule.required().min(1),
        }),
      ],
    }),

    defineField({
      name: 'formAside',
      title: 'Form aside',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— Enquiry"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "Tell us what you\'re <em>working on</em>."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'copy',
          title: 'Copy paragraph',
          type: 'text',
          rows: 4,
          description: 'The paragraph beneath the aside title.',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── SEO ──────────────────────────────────────────────────────────────────
    defineField({
      name: 'metaTitle',
      title: 'Meta title (browser tab + SERP)',
      type: 'string',
      group: 'seo',
      description: 'Defaults to page title if blank. Max 70 characters recommended.',
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      group: 'seo',
      description: 'Shown in search results beneath the title. Max 200 characters.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'metaKeywords',
      title: 'Meta keywords',
      type: 'string',
      group: 'seo',
      description: 'Comma-separated keywords.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social-share image (OG image)',
      type: 'image',
      group: 'seo',
      description: 'Social share image. 1200x630 recommended. Falls back to hero image.',
    }),
    ],
  preview: {
    prepare() {
      return { title: 'Contact Page' }
    },
  },
})
