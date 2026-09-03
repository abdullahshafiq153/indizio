import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export type FieldnoteContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'image'; src: string; alt: string; caption: string; width: number; height: number }

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
    id: 'fieldnote-brand-atlas-01',
    slug: 'how-to-find-hidden-ecommerce-pages-with-brand-atlas',
    title: 'How to find the ecommerce pages a storefront does not make easy to find',
    excerpt: 'A practical Manukora research workflow for finding quiz results—and using a classified URL index to uncover products, collections, articles, and other public pages.',
    industry: 'Research tools',
    type: 'Workflow',
    publishedAt: '2026-09-03T12:00:00.000Z',
    readingTime: 6,
    featured: true,
    fallbackContent: [
      { type: 'paragraph', text: 'The research question was unusually specific: what result screens does Manukora show after its product quiz? The storefront made the quiz itself easy to find. The pages at the end of that journey were less obvious.' },
      { type: 'paragraph', text: 'Instead of clicking through every possible answer combination or trying increasingly narrow search queries, we entered manukora.com into Brand Atlas. Once its discoverable public URLs had been collected, typing “quiz” into the URL filter reduced the index to the pages relevant to the investigation.' },
      { type: 'quote', text: 'The useful unit of ecommerce research is often not the brand. It is the exact page where a decision is being shaped.' },
      { type: 'heading', text: 'The homepage was not the research question' },
      { type: 'paragraph', text: 'Most ecommerce research begins on a homepage, but it rarely ends there. A researcher may need a quiz result, every product in a range, a particular collection, the editorial archive, an about page, or the policies surrounding a purchase. Store navigation is designed to guide shoppers, not to reveal the complete structure of the site to researchers.' },
      { type: 'paragraph', text: 'That distinction matters. A polished homepage can explain the brand, but the deeper pages show how it segments customers, frames product choices, organizes inventory, answers objections, and moves intent toward a purchase.' },
      { type: 'heading', text: 'A three-step research workflow' },
      { type: 'paragraph', text: 'First, enter a brand domain or URL in Brand Atlas. Second, let the tool assemble the public URLs it can discover and classify recognizable page types. Third, narrow the index by page type or by a word in the URL. In the Manukora example, the word “quiz” turned a large set of pages into a focused list of likely quiz and result URLs.' },
      { type: 'image', src: '/images/fieldnotes/brand-atlas-manukora-quiz-filter.png', alt: 'Brand Atlas showing 421 Manukora URLs filtered to seven quiz-related pages', caption: 'The Manukora map contained 421 URLs. Filtering for “quiz” surfaced seven relevant paths, including the quiz and result pages.', width: 1808, height: 941 },
      { type: 'paragraph', text: 'The same method works when the question changes. Filter for product pages to study an assortment, collections to understand merchandising, articles and blog pages to inspect a content strategy, or policies to compare the reassurance surrounding delivery and returns.' },
      { type: 'heading', text: 'Classification is what makes a crawl useful' },
      { type: 'paragraph', text: 'A raw export of URLs creates a new sorting problem. Brand Atlas adds structure by grouping recognizable paths such as homepages, products, collections, blogs, articles, informational pages, help pages, policies, account pages, carts, checkouts, search pages, and gift cards. Researchers can begin with the page type most likely to answer the question, then use the text filter to become more precise.' },
      { type: 'image', src: '/images/fieldnotes/brand-atlas-page-type-filter.png', alt: 'Brand Atlas page-type menu listing its URL classifications', caption: 'Page-type filters turn the crawl into a navigable research index instead of a raw URL dump.', width: 662, height: 605 },
      { type: 'paragraph', text: 'Classification is deliberately a starting point rather than a claim that every site follows the same architecture. Ecommerce platforms use familiar URL patterns, but brands also create custom landing pages and unusual paths. The searchable index keeps those other pages available instead of discarding them.' },
      { type: 'heading', text: 'Take the working set with you' },
      { type: 'paragraph', text: 'Once the list answers the question, export the filtered results as a CSV. In this case, the export contained only the seven Manukora quiz paths instead of all 421 discovered URLs. Each row retains the URL, classified page type, available title, and discovery source, so the research can continue in a spreadsheet, audit, or team workspace.' },
      { type: 'image', src: '/images/fieldnotes/brand-atlas-filtered-csv-export.png', alt: 'Spreadsheet containing seven exported Manukora quiz URLs with type and source columns', caption: 'The active quiz results exported as a compact CSV, ready to annotate, share, or use in a deeper teardown.', width: 855, height: 495 },
      { type: 'heading', text: 'What Brand Atlas changes' },
      { type: 'paragraph', text: 'The value is not the number of URLs returned. It is the time between forming a research question and reaching the pages that can answer it. A competitor teardown, content audit, product-range review, or quiz-flow investigation becomes repeatable: map the domain, select a page type, filter the paths, and open the relevant evidence.' },
      { type: 'paragraph', text: 'Brand Atlas only surfaces public URLs it can discover; it does not access private or gated content. Within that boundary, it turns a storefront from a sequence of navigation choices into a reusable research map.' },
      { type: 'link', text: 'Map a brand with Brand Atlas', href: '/atlas' },
    ],
  },
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
    if (!articles.length) return fallbackFieldnotes

    const articleSlugs = new Set(articles.map((article) => article.slug))
    const localArticles = fallbackFieldnotes.filter((article) => !articleSlugs.has(article.slug))
    return [...articles, ...localArticles].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
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
