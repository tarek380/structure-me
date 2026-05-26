import { defineType, defineField } from 'sanity'

/**
 * faqItem — one Q+A pair in the service-page FAQ.
 * Multiple body paragraphs supported (advisory FAQ item 3 has two paragraphs).
 */
export default defineType({
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answerParagraphs',
      title: 'Answer paragraphs',
      type: 'array',
      description: 'One or more paragraphs (each item = one <p>).',
      of: [{ type: 'text' }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'open',
      title: 'Open by default',
      type: 'boolean',
      description: 'Adds the "open" attribute to the <details> element. Set true for the first FAQ item.',
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: 'question' },
  },
})
