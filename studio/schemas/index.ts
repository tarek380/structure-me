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

// About page schemas
import aboutPage from './aboutPage'
import teamMember from './objects/teamMember'
import numberedListItem from './objects/numberedListItem'
import relatedServiceCard from './objects/relatedServiceCard'

// Service page schemas
import servicePage from './servicePage'
import servicePillar from './objects/servicePillar'
import thirdsCard from './objects/thirdsCard'
import faqItem from './objects/faqItem'

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
  // About page singleton + objects
  aboutPage,
  teamMember,
  numberedListItem,
  relatedServiceCard,
  // Service page document + objects
  servicePage,
  servicePillar,
  thirdsCard,
  faqItem,
]
