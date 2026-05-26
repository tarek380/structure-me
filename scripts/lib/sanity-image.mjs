/**
 * sanity-image.mjs
 * Shared helper: if a Sanity image asset is uploaded, return a CDN URL;
 * otherwise return the existing fallback path string. Used by build scripts
 * that mix legacy `img/...` paths with optional Sanity-hosted uploads.
 */

import imageUrlBuilder from '@sanity/image-url'

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'r3uuoahs'
const DATASET = process.env.SANITY_DATASET || 'production'

const builder = imageUrlBuilder({ projectId: PROJECT_ID, dataset: DATASET })

export function resolveImage(field, fallbackPath, opts = {}) {
  if (field && field.asset && field.asset._ref) {
    const w = opts.width || 1600
    const q = opts.quality || 85
    return builder.image(field).width(w).quality(q).auto('format').url()
  }
  return fallbackPath || ''
}
