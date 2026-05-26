import { defineType, defineField } from 'sanity'

/**
 * contactMetaItem — one row in the contact-hero meta list.
 * Renders as <li><span class="contact-meta-label">{label}</span><span class="contact-meta-value">{value}</span></li>
 * If href is provided, the value span becomes an <a class="contact-meta-value contact-meta-link">.
 */
export default defineType({
  name: 'contactMetaItem',
  title: 'Contact Meta Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'e.g. "Email", "Headquarters", "Direct mobile to our principal"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      description: 'The displayed value text.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link href (optional)',
      type: 'string',
      description: 'If set, the value becomes a link. e.g. "mailto:…" or "tel:…"',
    }),
  ],
  preview: {
    select: { label: 'label', value: 'value' },
    prepare({ label, value }) {
      return { title: label, subtitle: value }
    },
  },
})
