export type IndustrySEO = {
  intro: string
  study: string[]
  faqs: Array<{ question: string; answer: string }>
}

const INDUSTRY_SEO: Record<string, IndustrySEO> = {
  apparel: {
    intro: 'Study apparel stores that turn fit, fabric, collections, and styling into clear paths to purchase. This index brings together fashion storefronts selected for useful merchandising and ecommerce design decisions.',
    study: ['Collection navigation and product discovery', 'Fit, sizing, material, and care information', 'Editorial imagery that still supports shopping'],
    faqs: [{ question: 'What makes an apparel ecommerce website effective?', answer: 'Strong apparel stores make fit and material easy to understand, keep collection navigation predictable, and use editorial imagery without hiding product information or purchase actions.' }, { question: 'How are websites selected for this apparel index?', answer: 'INDIZIO selects stores for the usefulness of their storefront decisions, including navigation, merchandising, product detail, and the clarity of the buying journey.' }],
  },
  beauty: {
    intro: 'Explore beauty ecommerce websites that make ingredients, routines, shades, and product benefits easier to understand. Use the collection to compare how brands balance education, proof, and visual identity.',
    study: ['Routine and concern-based navigation', 'Ingredient, shade, and usage education', 'Reviews, proof, and expectation setting'],
    faqs: [{ question: 'What should a beauty ecommerce website explain?', answer: 'A useful beauty storefront clearly explains who a product is for, how it is used, what it contains, and what result a shopper can reasonably expect.' }, { question: 'What can designers learn from these beauty stores?', answer: 'The collection helps designers compare discovery tools, education patterns, product-page hierarchy, shade or routine selection, and trust-building content.' }],
  },
  beverage: {
    intro: 'Browse beverage ecommerce websites across functional drinks, soft drinks, tea, and other direct-to-consumer categories. Compare how brands communicate flavour, format, ingredients, and repeat-purchase offers.',
    study: ['Flavour and variety-pack discovery', 'Ingredient and benefit communication', 'Subscriptions, bundles, and repeat purchase'],
    faqs: [{ question: 'What makes beverage ecommerce different?', answer: 'Beverage stores often need to communicate taste remotely, explain pack formats, and make replenishment or variety discovery feel simple.' }, { question: 'Why study beverage website design?', answer: 'It is useful for understanding flavour-led merchandising, bundles, subscriptions, ingredient communication, and high-frequency repeat purchasing.' }],
  },
  coffee: {
    intro: 'Discover coffee ecommerce websites built around origin, roast, format, brewing method, and replenishment. Compare how roasters help shoppers choose confidently and return regularly.',
    study: ['Roast, origin, and tasting-note discovery', 'Brew-method and format guidance', 'Subscriptions and replenishment'],
    faqs: [{ question: 'What information matters on a coffee product page?', answer: 'Useful coffee pages clarify roast level, origin, tasting notes, format, freshness, and suitable brewing methods before asking the shopper to choose a size or subscription.' }, { question: 'Why does coffee deserve its own ecommerce category?', answer: 'Coffee combines considered product discovery with frequent replenishment, making subscriptions, education, and preference-led navigation especially important.' }],
  },
  eyewear: {
    intro: 'Explore eyewear stores that reduce uncertainty around shape, fit, measurements, lenses, and personal style. Compare the tools and content brands use when customers cannot try frames in person.',
    study: ['Frame shape, fit, and measurement guidance', 'Lens choices and pricing clarity', 'Virtual try-on and visual comparison'],
    faqs: [{ question: 'What makes an eyewear website easier to shop?', answer: 'Clear measurements, shape guidance, useful photography, lens explanations, and comparison tools help shoppers judge fit and total cost remotely.' }, { question: 'What should designers study in eyewear ecommerce?', answer: 'Pay attention to frame discovery, virtual try-on, prescription flows, lens configuration, measurement education, and return reassurance.' }],
  },
  food: {
    intro: 'Study food ecommerce websites that make flavour, ingredients, preparation, pack size, and delivery expectations tangible online. The index highlights useful approaches to discovery and replenishment.',
    study: ['Flavour, ingredient, and dietary discovery', 'Pack size and preparation clarity', 'Bundles, gifting, and replenishment'],
    faqs: [{ question: 'What information helps food sell online?', answer: 'Shoppers benefit from clear ingredients, flavour cues, dietary information, serving or preparation guidance, pack size, storage, and delivery expectations.' }, { question: 'What can ecommerce teams learn from food brands?', answer: 'Food brands offer useful examples of sensory storytelling, bundling, gifting, subscriptions, and turning an unfamiliar product into an understandable purchase.' }],
  },
  fragrance: {
    intro: 'Browse fragrance ecommerce websites that translate scent into language, composition, mood, and occasion. Compare sampling, discovery, storytelling, and reassurance strategies across brands.',
    study: ['Notes, families, mood, and occasion', 'Sampling and discovery-set journeys', 'Storytelling balanced with practical detail'],
    faqs: [{ question: 'How can fragrance be sold effectively online?', answer: 'Strong fragrance stores combine evocative storytelling with concrete notes, scent families, concentration, size, sampling options, and clear expectations.' }, { question: 'Why study fragrance ecommerce design?', answer: 'Fragrance is a useful test of how design communicates an invisible product through language, imagery, discovery tools, and lower-risk trial formats.' }],
  },
  'hair-care': {
    intro: 'Explore hair-care ecommerce websites organized around texture, concern, routine, and product compatibility. Study how brands guide shoppers from diagnosis to a manageable regimen.',
    study: ['Hair type and concern-based discovery', 'Routine building and product compatibility', 'Ingredient, usage, and result education'],
    faqs: [{ question: 'What makes a hair-care website useful?', answer: 'Useful hair-care stores connect hair type and concern to a clear routine, then explain product order, frequency, ingredients, and realistic outcomes.' }, { question: 'What should teams compare across hair-care stores?', answer: 'Compare quizzes, routine builders, concern navigation, before-and-after proof, product compatibility, and instructions for use.' }],
  },
  'hemp-and-cannabis': {
    intro: 'Study hemp and cannabis ecommerce websites that handle product format, intended use, education, trust, and age-sensitive access with clarity. This is a design research index, not product or medical advice.',
    study: ['Product-format and use-case navigation', 'Education, testing, and trust information', 'Responsible access and expectation setting'],
    faqs: [{ question: 'What should hemp and cannabis websites communicate clearly?', answer: 'Stores should make product format, ingredients, testing information, intended use, restrictions, and responsible-use context easy to find.' }, { question: 'What is the purpose of this index?', answer: 'INDIZIO documents ecommerce design and merchandising patterns. Inclusion is not an endorsement and the content is not medical or legal advice.' }],
  },
  jewelry: {
    intro: 'Browse jewelry ecommerce websites that communicate scale, material, craftsmanship, fit, and gifting context. Compare how brands create confidence around considered purchases.',
    study: ['Scale, fit, material, and care details', 'Collection and occasion-based discovery', 'Craft, provenance, and gifting reassurance'],
    faqs: [{ question: 'What details matter on a jewelry product page?', answer: 'Dimensions, material, weight, fit, care, scale photography, delivery timing, packaging, and return information all reduce uncertainty.' }, { question: 'What can designers learn from jewelry ecommerce?', answer: 'Jewelry stores provide useful examples of luxury pacing, gifting journeys, material education, product scale, and building trust for higher-consideration purchases.' }],
  },
  lifestyle: {
    intro: 'Explore lifestyle ecommerce websites that bring several product categories together under one coherent point of view. Study how navigation, curation, and storytelling keep broad catalogues understandable.',
    study: ['Cross-category navigation and curation', 'Editorial storytelling with commercial clarity', 'Gifting, bundles, and discovery'],
    faqs: [{ question: 'What defines a lifestyle ecommerce website?', answer: 'A lifestyle store sells across multiple related categories while using a consistent audience, aesthetic, or point of view to make the assortment feel coherent.' }, { question: 'What should teams study on lifestyle stores?', answer: 'Study taxonomy, cross-selling, editorial curation, gifting, search, and how the brand keeps a broad catalogue easy to navigate.' }],
  },
  'oral-care': {
    intro: 'Study oral-care ecommerce websites that explain routines, product differences, ingredients, replenishment, and evidence without overwhelming the shopper.',
    study: ['Routine and concern-based product selection', 'Ingredient and evidence communication', 'Refills, subscriptions, and replenishment'],
    faqs: [{ question: 'What makes oral-care ecommerce clear?', answer: 'A clear oral-care store connects each product to a specific need and routine, explains usage and ingredients, and separates evidence from vague benefit claims.' }, { question: 'Why study oral-care brands?', answer: 'They offer useful patterns for routine building, education, comparison, subscriptions, refills, and trust in a health-adjacent category.' }],
  },
  supplements: {
    intro: 'Explore supplement ecommerce websites that organize products by goal, format, routine, and evidence. Compare how brands communicate ingredients and expectations in a health-adjacent category.',
    study: ['Goal, format, and routine-based discovery', 'Ingredient amounts and evidence hierarchy', 'Subscriptions and responsible expectation setting'],
    faqs: [{ question: 'What should a supplement website communicate?', answer: 'Useful supplement stores clearly present ingredients, amounts, directions, intended audience, cautions, testing information, and appropriately framed supporting evidence.' }, { question: 'Does inclusion mean INDIZIO endorses a supplement?', answer: 'No. INDIZIO studies ecommerce design and merchandising. Inclusion is not a product endorsement or medical advice.' }],
  },
}

export function getIndustrySEO(slug: string, name: string): IndustrySEO {
  return INDUSTRY_SEO[slug] || {
    intro: `Explore curated ${name.toLowerCase()} ecommerce websites and compare how real brands approach product discovery, merchandising, product detail, and conversion.`,
    study: ['Navigation and product discovery', 'Product information and expectation setting', 'Merchandising and purchase flow'],
    faqs: [{ question: `How are ${name.toLowerCase()} websites selected?`, answer: 'INDIZIO selects storefronts for useful ecommerce, merchandising, and design decisions rather than visual appearance alone.' }, { question: 'How should this collection be used?', answer: 'Use the index as a research starting point, then open individual profiles and storefronts to compare patterns in context.' }],
  }
}
