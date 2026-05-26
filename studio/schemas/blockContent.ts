// Portable Text — rich text schema used by insightsPost.body
// Mirrors the visual treatments available in the article HTML template:
//   - regular paragraphs
//   - H2 (section heads) and H3 (sub-heads)
//   - blockquotes / callouts
//   - bullet + numbered lists
//   - links (with optional new-window)
//   - inline images and "callout" blocks

export default {
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Pull quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Emphasis', value: 'em' },
          { title: 'Strong', value: 'strong' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              { name: 'href', type: 'url', title: 'URL', validation: (R: any) => R.required() },
              { name: 'newWindow', type: 'boolean', title: 'Open in new window' },
            ],
          },
        ],
      },
    },
    {
      type: 'image',
      name: 'inlineImage',
      title: 'Inline image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', type: 'string', title: 'Alt text (required for SEO)' },
        { name: 'caption', type: 'string', title: 'Caption' },
      ],
    },
    {
      type: 'object',
      name: 'callout',
      title: 'Callout box',
      fields: [
        { name: 'eyebrow', type: 'string', title: 'Eyebrow' },
        { name: 'text', type: 'text', title: 'Text', rows: 4 },
      ],
      preview: { select: { title: 'eyebrow', subtitle: 'text' } },
    },
  ],
}
