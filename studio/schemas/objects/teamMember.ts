import { defineType, defineField } from 'sanity'

/**
 * teamMember — an individual on the about page team grid.
 * image stores the relative path to the background image (e.g. "img/about-team-1.jpg").
 * The build script writes it back into style="background-image: url('...')".
 */
export default defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image path',
      type: 'string',
      description: 'Relative path to the team member image, e.g. "img/about-team-1.jpg".',
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
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g. "Principal" or "Director, Capital"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Display name, e.g. "[Name One]"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      description: 'Short biography paragraph.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Profile link',
      type: 'string',
      description: 'e.g. "team/name-one.html"',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
    },
  },
})
