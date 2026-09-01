export type Site = {
  id?: string
  slug?: string
  name: string
  coverImage?: string
  industry: string
  style: string
  tags?: string[]
  note: string
  url: string
  featured: number
  saveCount?: number
}

export const sites: Site[] = [
  { name: 'Aster & Moss', industry: 'Home', style: 'Editorial', note: 'A quiet homeware storefront that uses proportion and restraint to make a small catalogue feel collectible.', url: 'https://example.com', featured: 12 },
  { name: 'Noma Objects', industry: 'Fashion', style: 'Minimal', note: 'Product storytelling is reduced to a precise sequence of material, fit, and provenance.', url: 'https://example.com', featured: 11 },
  { name: 'Sunday Press', industry: 'Food', style: 'Bold', note: 'Subscription framing appears before price, turning replenishment into the default mental model.', url: 'https://example.com', featured: 10 },
  { name: 'Forme Studio', industry: 'Fashion', style: 'Editorial', note: 'Editorial hierarchy and disciplined navigation let campaign imagery lead without hiding commerce.', url: 'https://example.com', featured: 9 },
  { name: 'Ritual State', industry: 'Health', style: 'Organic', note: 'Trust signals are woven into the product narrative instead of isolated in a badge wall.', url: 'https://example.com', featured: 8 },
  { name: 'Arc Systems', industry: 'Technology', style: 'Dark', note: 'A technical product is made legible through progressive disclosure and unusually direct comparison copy.', url: 'https://example.com', featured: 7 },
  { name: 'Morrow Skin', industry: 'Beauty', style: 'Minimal', note: 'The PDP balances clinical specificity with a warmer, less institutional visual system.', url: 'https://example.com', featured: 6 },
  { name: 'Field Day', industry: 'Food', style: 'Playful', note: 'Merchandising feels exploratory while repeated product anchors keep the path to purchase obvious.', url: 'https://example.com', featured: 5 },
  { name: 'Parlour No. 8', industry: 'Beauty', style: 'Luxury', note: 'Luxury is communicated through pacing and language rather than decorative excess.', url: 'https://example.com', featured: 4 },
  { name: 'Northland', industry: 'Fashion', style: 'Bold', note: 'A dense product range remains easy to scan because every category decision is visible in the grid.', url: 'https://example.com', featured: 3 },
  { name: 'Common Matter', industry: 'Home', style: 'Minimal', note: 'The store turns specifications into editorial detail, helping considered purchases feel effortless.', url: 'https://example.com', featured: 2 },
  { name: 'Signal Works', industry: 'Technology', style: 'Retro', note: 'A retro visual language supports the product story without compromising technical clarity.', url: 'https://example.com', featured: 1 },
  { name: 'Solace Labs', industry: 'Health', style: 'Minimal', note: 'Benefit claims are paired with evidence at exactly the point a skeptical buyer needs it.', url: 'https://example.com', featured: 0 },
  { name: 'Cose Buone', industry: 'Food', style: 'Editorial', note: 'The store uses origin stories as merchandising, making product discovery feel like travel.', url: 'https://example.com', featured: -1 },
  { name: 'Vera Forma', industry: 'Fashion', style: 'Luxury', note: 'Collection navigation is exceptionally restrained while fit details stay close to purchase actions.', url: 'https://example.com', featured: -2 },
  { name: 'Lumen', industry: 'Technology', style: 'Minimal', note: 'A single-product site that explains complexity through an unusually confident content sequence.', url: 'https://example.com', featured: -3 },
  { name: 'Soft Focus', industry: 'Beauty', style: 'Playful', note: 'Shade discovery and education share the same interface, reducing the jump between learning and buying.', url: 'https://example.com', featured: -4 },
  { name: 'Casa Prima', industry: 'Home', style: 'Organic', note: 'Room context, dimensions, and delivery expectations are layered without crowding the product.', url: 'https://example.com', featured: -5 },
]
