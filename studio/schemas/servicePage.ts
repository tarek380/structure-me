import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * servicePage — document type with FIVE instances, one per service page.
 *
 * Document IDs are fixed (pinned via the studio config):
 *   servicePage.advisory
 *   servicePage.business-structuring
 *   servicePage.international
 *   servicePage.family-office
 *   servicePage.exit-strategy
 *
 * Each instance renders one of advisory.html / business-structuring.html /
 * international.html / family-office.html / exit-strategy.html.
 */
export default defineType({
  name: 'servicePage',
  title: 'Service Page',
  type: 'document',
  fields: [
    // ── Slug — display only; the document _id is what actually drives the build.
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'string',
      description:
        'One of: advisory, business-structuring, international, family-office, exit-strategy. ' +
        'Must match the document _id suffix.',
      validation: (Rule) => Rule.required(),
    }),

    // ── HERO ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description: 'Inline HTML. Allowed: <em>, <strong>, <br />.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede paragraph (raw HTML)',
          type: 'text',
          rows: 5,
          description:
            'Body paragraph beneath the title. Inline HTML allowed: <em>, <strong>, <br />, ' +
            'plus &nbsp; / &amp; entities.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'heroImage',
          title: 'Hero image path',
          type: 'string',
          description:
            'Relative image path, e.g. "img/service-business-1-entity.jpg". ' +
            'Leave empty for pages where the hero image is set via CSS (advisory).',
        }),
        defineField({
          name: 'caption',
          title: 'Figure caption',
          type: 'string',
          description: 'e.g. "Counsel · Capital · Structure"',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── PILLARS (always 5) ───────────────────────────────────────────────────
    defineField({
      name: 'pillars',
      title: 'Pillars (5 sections)',
      type: 'array',
      description:
        '5 content pillars in order. Position determines layout modifier: ' +
        '1 = standard (image right), 2 = reverse-cream (image left), ' +
        '3 = standard (image right), 4 = reverse-cream (image left), ' +
        '5 = dark feature band (image right).',
      of: [defineArrayMember({ type: 'servicePillar' })],
      validation: (Rule) => Rule.required().length(5),
    }),

    // ── FAMILY / PHILOSOPHY band ─────────────────────────────────────────────
    defineField({
      name: 'family',
      title: 'Family / Philosophy band',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede paragraph',
          type: 'text',
          rows: 4,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'numberedList',
          title: 'Numbered list',
          type: 'array',
          of: [defineArrayMember({ type: 'numberedListItem' })],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: 'pullquote',
          title: 'Pull quote',
          type: 'text',
          rows: 2,
          description: 'Without typographic quotes — they are added in HTML.',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── THIRDS ──────────────────────────────────────────────────────────────
    defineField({
      name: 'thirds',
      title: 'Three reasons (Why us)',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cards',
          title: 'Cards',
          type: 'array',
          of: [defineArrayMember({ type: 'thirdsCard' })],
          validation: (Rule) => Rule.required().length(3),
        }),
      ],
    }),

    // ── FAQ ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'items',
          title: 'FAQ items',
          type: 'array',
          of: [defineArrayMember({ type: 'faqItem' })],
          validation: (Rule) => Rule.required().min(1),
        }),
      ],
    }),

    // ── CONTACT CTA ─────────────────────────────────────────────────────────
    defineField({
      name: 'contactCta',
      title: 'Contact CTA',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede',
          type: 'text',
          rows: 4,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cta',
          title: 'CTA Button',
          type: 'cta',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── RELATED SERVICES ────────────────────────────────────────────────────
    defineField({
      name: 'relatedServices',
      title: 'Related Services',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cards',
          title: 'Cards',
          type: 'array',
          description: 'Typically 3 cards — the other services worth highlighting from this page.',
          of: [defineArrayMember({ type: 'relatedServiceCard' })],
          validation: (Rule) => Rule.required().min(1),
        }),
      ],
    }),
  ],

  preview: {
    select: { title: 'slug' },
    prepare({ title }) {
      return { title: `Service Page: ${title}` }
    },
  },
})
