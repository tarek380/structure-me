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

            // ── Service Pages — 5 pinned documents ───────────────────────
            S.listItem()
              .title('Service Pages')
              .id('servicePages')
              .child(
                S.list()
                  .title('Service Pages')
                  .items([
                    S.listItem()
                      .title('Business Advisory')
                      .id('servicePage-advisory')
                      .child(
                        S.document()
                          .schemaType('servicePage')
                          .documentId('servicePage-advisory')
                          .title('Business Advisory')
                      ),
                    S.listItem()
                      .title('Business Structuring')
                      .id('servicePage-business-structuring')
                      .child(
                        S.document()
                          .schemaType('servicePage')
                          .documentId('servicePage-business-structuring')
                          .title('Business Structuring')
                      ),
                    S.listItem()
                      .title('International Structuring')
                      .id('servicePage-international')
                      .child(
                        S.document()
                          .schemaType('servicePage')
                          .documentId('servicePage-international')
                          .title('International Structuring')
                      ),
                    S.listItem()
                      .title('Family Office Structuring')
                      .id('servicePage-family-office')
                      .child(
                        S.document()
                          .schemaType('servicePage')
                          .documentId('servicePage-family-office')
                          .title('Family Office Structuring')
                      ),
                    S.listItem()
                      .title('Business Exit Strategy')
                      .id('servicePage-exit-strategy')
                      .child(
                        S.document()
                          .schemaType('servicePage')
                          .documentId('servicePage-exit-strategy')
                          .title('Business Exit Strategy')
                      ),
                  ])
              ),

            // ── Phase 4 singletons ───────────────────────────────────────
            S.listItem()
              .title('Contact Page')
              .id('contactPage')
              .child(
                S.document()
                  .schemaType('contactPage')
                  .documentId('contactPage')
                  .title('Contact Page')
              ),

            S.listItem()
              .title('Insights Index Page')
              .id('insightsIndexPage')
              .child(
                S.document()
                  .schemaType('insightsIndexPage')
                  .documentId('insightsIndexPage')
                  .title('Insights Index Page')
              ),

            S.listItem()
              .title('Subscribe Details Page')
              .id('subscribeDetailsPage')
              .child(
                S.document()
                  .schemaType('subscribeDetailsPage')
                  .documentId('subscribeDetailsPage')
                  .title('Subscribe Details Page')
              ),

            S.listItem()
              .title('Thank You Subscribe Page')
              .id('thankYouSubscribePage')
              .child(
                S.document()
                  .schemaType('thankYouSubscribePage')
                  .documentId('thankYouSubscribePage')
                  .title('Thank You Subscribe Page')
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
