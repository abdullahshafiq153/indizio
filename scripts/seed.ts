import type { SanitizedConfig } from 'payload'
import { getPayload } from 'payload'

import { sites } from '../app/_data/sites'

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export async function script(config: SanitizedConfig) {
  const payload = await getPayload({ config })
  const industryIDs = new Map<string, string | number>()
  const styleIDs = new Map<string, string | number>()

  for (const name of [...new Set(sites.map((site) => site.industry))]) {
    const slug = slugify(name)
    const existing = await payload.find({ collection: 'industries', where: { slug: { equals: slug } }, limit: 1 })
    const document = existing.docs[0] || await payload.create({ collection: 'industries', data: { name, slug } })
    industryIDs.set(name, document.id)
  }

  for (const name of [...new Set(sites.map((site) => site.style))]) {
    const slug = slugify(name)
    const existing = await payload.find({ collection: 'styles', where: { slug: { equals: slug } }, limit: 1 })
    const document = existing.docs[0] || await payload.create({ collection: 'styles', data: { name, slug } })
    styleIDs.set(name, document.id)
  }

  for (const site of sites) {
    const slug = slugify(site.name)
    const existing = await payload.find({ collection: 'websites', where: { slug: { equals: slug } }, limit: 1, draft: true })
    if (existing.docs.length) continue

    await payload.create({
      collection: 'websites',
      data: {
        name: site.name,
        slug,
        url: site.url,
        industry: industryIDs.get(site.industry)!,
        styles: [styleIDs.get(site.style)!],
        note: site.note,
        featuredRank: site.featured,
        _status: 'published',
      },
    })
  }

  payload.logger.info(`Seed complete: ${sites.length} websites are ready.`)
}
