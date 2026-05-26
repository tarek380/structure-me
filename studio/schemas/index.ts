import insightsPost from './insightsPost'
import author from './author'
import blockContent from './blockContent'

// Homepage schemas
import homePage from './homePage'
import cta from './objects/cta'
import pillar from './objects/pillar'
import serviceCard from './objects/serviceCard'
import metric from './objects/metric'
import approachRow from './objects/approachRow'
import highlightedText from './objects/highlightedText'

export const schemaTypes = [
  // Existing
  insightsPost,
  author,
  blockContent,
  // Homepage singleton + objects
  homePage,
  cta,
  pillar,
  serviceCard,
  metric,
  approachRow,
  highlightedText,
]
