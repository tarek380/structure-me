import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * aboutPage — singleton document. _id is fixed to 'aboutPage'.
 * __experimental_actions restricts to update + publish only (no create/delete).
 * Covers all 6 about-page sections: hero, missionPillar, team, family,
 * contactCta, relatedServices.
 */
export default defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  // Singleton: prevent creating new docs or deleting
  __experimental_actions: ['update', 'publish'],

  fields: [
    // ── HERO ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow text',
          type: 'string',
          description: 'e.g. "— About · Structure Me"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "An advisory firm<br />built like a <em>family office</em>."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede paragraph',
          type: 'text',
          rows: 4,
          description: 'Opening paragraph beneath the title.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'bullets',
          title: 'Bullet points',
          type: 'array',
          description: 'Four bullet points shown beneath the lede.',
          of: [{ type: 'string' }],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: 'primaryCta',
          title: 'Primary CTA',
          type: 'cta',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'secondaryCta',
          title: 'Secondary CTA',
          type: 'cta',
          description: 'Ghost button. e.g. "Meet the team" → "#team"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'heroImage',
          title: 'Hero image path',
          type: 'string',
          description: 'Relative path, e.g. "img/about-hero.jpg".',
          initialValue: 'img/about-hero.jpg',
          validation: (Rule) => Rule.required(),
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

    // ── MISSION PILLAR ───────────────────────────────────────────────────────
    defineField({
      name: 'missionPillar',
      title: 'Mission Pillar section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— 01 · The brief we hold ourselves to"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "A practice <em>built on judgement</em><br />not billable hours."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'bodyParagraphs',
          title: 'Body paragraphs',
          type: 'array',
          description: 'Two paragraphs of prose (each item = one <p>).',
          of: [{ type: 'text' }],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: 'list',
          title: 'Bullet list',
          type: 'array',
          description: 'Four bullet items shown beneath the paragraphs.',
          of: [{ type: 'string' }],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: 'link',
          title: 'Bottom link',
          type: 'cta',
          description: 'e.g. "Meet the team" → "#team"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'figureImage',
          title: 'Figure image path',
          type: 'string',
          description: 'Relative path to the portrait image, e.g. "img/about-team-3.jpg".',
          initialValue: 'img/about-team-3.jpg',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── TEAM ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'team',
      title: 'Team section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— 03 · The people"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "A small team<br />of <em>senior advisers</em>."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede paragraph',
          type: 'text',
          rows: 3,
          description: 'Short paragraph beneath the title.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'members',
          title: 'Team members',
          type: 'array',
          description: 'Four team member cards in order.',
          of: [defineArrayMember({ type: 'teamMember' })],
          validation: (Rule) => Rule.required().length(4),
        }),
      ],
    }),

    // ── FAMILY / NETWORK ─────────────────────────────────────────────────────
    defineField({
      name: 'family',
      title: 'Family / Network section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— 04 · A network of entrepreneurs"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "A firm <em>defined by the company</em> it keeps."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede paragraph',
          type: 'text',
          rows: 3,
          description: 'Opening paragraph of the network section.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'numberedList',
          title: 'Numbered list',
          type: 'array',
          description: 'Four roman-numeral items.',
          of: [defineArrayMember({ type: 'numberedListItem' })],
          validation: (Rule) => Rule.required().length(4),
        }),
        defineField({
          name: 'pullquote',
          title: 'Pull quote',
          type: 'text',
          rows: 2,
          description: 'The blockquote at the base of the section (without typographic quotes — they are added in HTML).',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // ── CONTACT CTA ──────────────────────────────────────────────────────────
    defineField({
      name: 'contactCta',
      title: 'Contact CTA section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— Begin"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 2,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "Most engagements begin with a <em>quiet conversation</em>."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'lede',
          title: 'Lede',
          type: 'text',
          rows: 3,
          description: 'Paragraph beneath the title.',
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

    // ── RELATED SERVICES ─────────────────────────────────────────────────────
    defineField({
      name: 'relatedServices',
      title: 'Related Services section',
      type: 'object',
      fields: [
        defineField({
          name: 'eyebrow',
          title: 'Eyebrow',
          type: 'string',
          description: 'e.g. "— Disciplines"',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Title (raw HTML)',
          type: 'text',
          rows: 1,
          description:
            'Inline HTML string. Allowed tags: <em>, <strong>, <br />. ' +
            'e.g. "What we <em>practise</em>."',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'cards',
          title: 'Service cards',
          type: 'array',
          description: 'Five related service cards in order.',
          of: [defineArrayMember({ type: 'relatedServiceCard' })],
          validation: (Rule) => Rule.required().length(5),
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return { title: 'About Page' }
    },
  },
})
