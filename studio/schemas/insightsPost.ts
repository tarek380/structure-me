export default {
  name: 'insightsPost',
  title: 'Insights post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'seo', title: 'SEO & meta' },
  ],
  fields: [
    // --- CONTENT ---
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (R: any) => R.required().max(120),
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'content',
      description:
        'URL path for this article. Auto-generated from the title (lowercase, hyphens). Click “Generate” after changing the title, or type your own — must be kebab-case (lowercase letters, numbers, hyphens only).',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) =>
          String(input || '')
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '') // strip accents
            .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → hyphen
            .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
            .slice(0, 96),
      },
      validation: (R: any) =>
        R.required().custom((value: any) => {
          const v = value?.current
          if (!v) return 'Slug is required.'
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) {
            return 'Slug must be kebab-case: lowercase letters, numbers and hyphens only (no spaces, no uppercase). Click “Generate” to auto-fix.'
          }
          return true
        }),
    },
    {
      name: 'flag',
      title: 'Eyebrow flag',
      type: 'string',
      group: 'content',
      description: 'e.g. "Structuring · Working paper"',
    },
    {
      name: 'dek',
      title: 'Subtitle / dek',
      type: 'text',
      rows: 2,
      group: 'content',
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
    },
    {
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      group: 'content',
      validation: (R: any) => R.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Business Structuring', value: 'Business Structuring' },
          { title: 'International', value: 'International' },
          { title: 'Family Office', value: 'Family Office' },
          { title: 'Business Exit', value: 'Business Exit' },
          { title: 'Business Advisory', value: 'Business Advisory' },
        ],
      },
    },
    {
      name: 'readingMinutes',
      title: 'Reading minutes',
      type: 'number',
      group: 'content',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
    },
    {
      name: 'takeaways',
      title: 'Key takeaways (bullet list shown at the foot)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'content',
    },
    {
      name: 'relatedPosts',
      title: 'Related articles',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'insightsPost' }] }],
      validation: (R: any) => R.max(3),
      description:
        'Up to 3 related articles shown at the bottom of this post. If empty, the 3 most recent other posts are used as fallback.',
      group: 'content',
    },

    // --- HERO ---
    {
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      group: 'hero',
      options: { hotspot: true },
      fields: [
        { name: 'alt', type: 'string', title: 'Alt text (required)' },
      ],
    },

    // --- SEO ---
    {
      name: 'metaTitle',
      title: 'Meta title (browser tab + SERP)',
      type: 'string',
      group: 'seo',
      description: 'Defaults to Title if blank',
      validation: (R: any) => R.max(70),
    },
    {
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      group: 'seo',
      validation: (R: any) => R.max(160),
    },
    {
      name: 'metaKeywords',
      title: 'Meta keywords',
      type: 'string',
      group: 'seo',
    },
    {
      name: 'ogImage',
      title: 'Social-share image',
      type: 'image',
      group: 'seo',
      description: 'Falls back to hero image if blank',
    },
    {
      name: 'tags',
      title: 'Article tags',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'seo',
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'heroImage' },
  },
  orderings: [
    { title: 'Published (newest)', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
}
