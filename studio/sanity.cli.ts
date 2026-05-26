import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: { projectId: 'r3uuoahs', dataset: 'production' },
  // Built bundle is served under https://www.structureme.com.au/studio/
  // basePath ensures all asset/manifest URLs are prefixed correctly.
  studioHost: 'structureme',
  /* @ts-expect-error sanity CLI accepts this at runtime */
  project: { basePath: '/studio' },
})
