import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'structure-me',
  title: 'Structure Me',
  projectId: 'r3uuoahs',
  dataset: 'production',
  basePath: '/studio',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // ── Homepage singleton ───────────────────────────────────────
            S.listItem()
              .title('Homepage')
              .id('homePage')
              .child(
                S.document()
                  .schemaType('homePage')
                  .documentId('homePage')
                  .title('Homepage')
              ),

            // ── About Page singleton ─────────────────────────────────────
            S.listItem()
              .title('About Page')
              .id('aboutPage')
              .child(
                S.document()
                  .schemaType('aboutPage')
                  .documentId('aboutPage')
                  .title('About Page')
              ),

            S.divider(),

            // ── Insights ────────────────────────────────────────────────
            S.listItem()
              .title('Insights Posts')
              .schemaType('insightsPost')
              .child(S.documentTypeList('insightsPost').title('Insights Posts')),

            S.listItem()
              .title('Authors')
              .schemaType('author')
              .child(S.documentTypeList('author').title('Authors')),
          ]),
    }),
    visionTool(),
  ],

  schema: { types: schemaTypes },
})
