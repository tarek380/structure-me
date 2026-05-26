import { defineType, defineField, defineArrayMember } from 'sanity'

/**
 * highlightedText — constrained Portable Text that allows ONLY em and strong marks.
 * No headings, no links, no block types beyond "normal".
 * Used for headlines and titles that carry <em> highlights in the rendered HTML.
 */
export default defineType({
  name: 'highlightedText',
  title: 'Highlighted Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [],
      marks: {
        // Only em and strong — no links, no annotations
        decorators: [
          { title: 'Emphasis (italic highlight)', value: 'em' },
          { title: 'Strong', value: 'strong' },
        ],
        annotations: [],
      },
    }),
  ],
})
