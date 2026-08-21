import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export type FieldnoteContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }

export type Fieldnote = {
  id: string
  slug: string
  title: string
  excerpt: string
  industry: string
  type: string
  publishedAt: string
  readingTime: number
  featured?: boolean
  content?: Record<string, unknown>
  fallbackContent?: FieldnoteContentBlock[]
}

type ArticleSelection = {
  id: string | number
  slug?: string | null
  title: string
  excerpt: string
  space?: 'fieldnotes' | 'ecommerce-ideas' | null
  industry?: string | number | { id: string | number; name?: string | null } | null
  type?: string | null
  publishedAt?: string | null
  readingTime?: number | null
  featured?: boolean | null
  content?: Record<string, unknown> | null
  createdAt?: string | null
}

export const fallbackFieldnotes: Fieldnote[] = [
  {
    id: 'fieldnote-01',
    slug: 'why-the-best-product-pages-answer-objections-before-they-are-asked',
    title: 'Why the best product pages answer objections before customers have time to ask them',
    excerpt: 'A practical teardown of how high-converting storefronts sequence proof, specificity, and reassurance around the buy box.',
    industry: 'Apparel',
    type: 'Brand teardown',
    publishedAt: '2026-08-08T12:00:00.000Z',
    readingTime: 8,
    featured: true,
    fallbackContent: [
      { type: 'paragraph', text: 'Most product pages are organized around content. The strongest ones are organized around hesitation. Every section earns its place by resolving a question that might otherwise delay the purchase.' },
      { type: 'heading', text: 'The buy box is a decision system' },
      { type: 'paragraph', text: 'Treating the buy box as a stack of components misses the point. Price, variants, delivery promises, returns, reviews, and product claims work together as a decision system. The order matters because customers do not evaluate every detail with equal attention.' },
      { type: 'quote', text: 'Good conversion design does not remove thinking. It gives customers the right evidence at the exact moment they need it.' },
      { type: 'heading', text: 'Put certainty closest to the action' },
      { type: 'paragraph', text: 'The details most likely to change the decision should sit nearest to the primary action: arrival timing, fit guidance, the returns promise, and the strongest proof point. Supporting storytelling can follow once the immediate risk has been reduced.' },
      { type: 'heading', text: 'A blueprint worth testing' },
      { type: 'paragraph', text: 'Start with one clear product promise, make selection effortless, place the most relevant reassurance beside the call to action, and use the next screenful to prove the promise. Measure the effect on add-to-cart rate, but also watch variant errors, returns, and support questions.' },
    ],
  },
  {
    id: 'fieldnote-02',
    slug: 'the-cart-drawer-is-not-a-mini-cart-it-is-the-start-of-checkout',
    title: 'The cart drawer is not a mini cart—it is the first and most persuasive step of checkout',
    excerpt: 'What modern cart drawers reveal about momentum, threshold messaging, cross-sells, and the final moments before checkout.',
    industry: 'Beauty',
    type: 'Pattern report',
    publishedAt: '2026-08-01T12:00:00.000Z',
    readingTime: 7,
    featured: true,
    fallbackContent: [
      { type: 'paragraph', text: 'A cart drawer has one job: preserve momentum. Yet many stores turn it into a dense inventory table or an aggressive upsell surface. Both choices add friction at the moment confidence should be highest.' },
      { type: 'heading', text: 'Momentum before monetization' },
      { type: 'paragraph', text: 'Confirmation should arrive first. Show the chosen product clearly, make edits easy, and explain what happens next. Only then should the interface introduce a threshold or complementary product.' },
      { type: 'heading', text: 'Thresholds need context' },
      { type: 'paragraph', text: 'A progress bar is useful only when the reward is legible and achievable. State the remaining amount in plain language and avoid letting a threshold overpower the checkout action.' },
      { type: 'quote', text: 'The best cart drawer feels less like another page and more like a confident handoff.' },
    ],
  },
  {
    id: 'fieldnote-03',
    slug: 'what-home-and-furniture-brands-can-teach-us-about-selling-without-touch',
    title: 'What home and furniture brands can teach us about selling products customers cannot touch',
    excerpt: 'A category blueprint for replacing physical inspection with scale, material clarity, delivery confidence, and contextual proof.',
    industry: 'Furniture',
    type: 'Industry blueprint',
    publishedAt: '2026-07-24T12:00:00.000Z',
    readingTime: 10,
    fallbackContent: [
      { type: 'paragraph', text: 'Furniture ecommerce has to translate weight, texture, scale, and permanence through a screen. That makes it a useful laboratory for any category where customers feel they need to inspect the product in person.' },
      { type: 'heading', text: 'Show scale in more than one way' },
      { type: 'paragraph', text: 'Dimensions are necessary but abstract. Pair them with room photography, human reference points, measurement diagrams, and practical fit notes. Redundant proof is valuable when the cost of a wrong decision is high.' },
      { type: 'heading', text: 'Delivery is part of the product' },
      { type: 'paragraph', text: 'Lead times, room-of-choice service, assembly, packaging removal, and return logistics shape the perceived value of the item. They should be explained as deliberately as material and construction.' },
    ],
  },
  {
    id: 'fieldnote-04',
    slug: 'seven-small-signals-that-make-a-subscription-offer-feel-less-risky',
    title: 'Seven small signals that make a subscription offer feel useful instead of difficult to escape',
    excerpt: 'A close read of frequency controls, cancellation language, savings framing, and the details that create subscription confidence.',
    industry: 'Health & Wellness',
    type: 'Fieldnote',
    publishedAt: '2026-07-16T12:00:00.000Z',
    readingTime: 6,
    fallbackContent: [
      { type: 'paragraph', text: 'Subscription offers often emphasize savings while leaving the operating rules vague. That imbalance creates suspicion. Customers want to know what they save, but they also want to understand control.' },
      { type: 'heading', text: 'Control is the strongest incentive' },
      { type: 'paragraph', text: 'Show delivery frequency before commitment, explain how reminders work, and use direct cancellation language. A flexible offer can outperform a larger discount because it reduces the perceived cost of being wrong.' },
      { type: 'quote', text: 'Trust grows when the exit is as easy to understand as the entrance.' },
    ],
  },
]

const typeLabel = (value?: string | null) => value
  ? value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  : 'Fieldnote'

function mapArticle(article: ArticleSelection): Fieldnote {
  const industry = typeof article.industry === 'object' && article.industry
    ? article.industry.name || 'Ecommerce'
    : 'Ecommerce'

  return {
    id: String(article.id),
    slug: article.slug || String(article.id),
    title: article.title,
    excerpt: article.excerpt,
    industry,
    type: typeLabel(article.type),
    publishedAt: article.publishedAt || article.createdAt || new Date().toISOString(),
    readingTime: article.readingTime || 6,
    featured: Boolean(article.featured),
    content: article.content || undefined,
  }
}

export const loadFieldnotes = cache(async (): Promise<Fieldnote[]> => {
  if (!process.env.DATABASE_URL) return fallbackFieldnotes

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'articles',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        space: true,
        industry: true,
        type: true,
        publishedAt: true,
        readingTime: true,
        featured: true,
        content: true,
        createdAt: true,
      },
      sort: '-publishedAt',
    })
    const articles = (result.docs as unknown as ArticleSelection[])
      .filter((article) => article.space !== 'ecommerce-ideas')
      .map(mapArticle)
    return articles.length ? articles : fallbackFieldnotes
  } catch {
    return fallbackFieldnotes
  }
})

export const loadFieldnote = cache(async (slug: string): Promise<Fieldnote | null> => {
  if (process.env.DATABASE_URL) {
    try {
      const payload = await getPayload({ config })
      const result = await payload.find({
        collection: 'articles',
        depth: 1,
        limit: 1,
        overrideAccess: false,
        where: { slug: { equals: slug } },
      })
      const article = result.docs[0] as unknown as ArticleSelection | undefined
      if (article && article.space !== 'ecommerce-ideas') return mapArticle(article)
    } catch {
      // Fall through to the local editorial preview content.
    }
  }

  return fallbackFieldnotes.find((article) => article.slug === slug) || null
})
