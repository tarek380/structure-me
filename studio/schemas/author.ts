export default {
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string', validation: (R: any) => R.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name', maxLength: 96 } },
    { name: 'role', title: 'Role / Title', type: 'string' },
    { name: 'bio', title: 'Short bio', type: 'text', rows: 3 },
    { name: 'avatar', title: 'Headshot', type: 'image', options: { hotspot: true } },
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'avatar' } },
}
