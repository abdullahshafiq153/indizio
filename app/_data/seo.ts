export const SITE_URL = 'https://www.indizio.space'

export function absoluteURL(path: string) {
  return new URL(path, SITE_URL).toString()
}

export function jsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function truncateSEOText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized

  const candidate = normalized.slice(0, Math.max(0, maxLength - 1))
  const lastSpace = candidate.lastIndexOf(' ')
  const safeCut = lastSpace >= Math.floor(maxLength * 0.7) ? lastSpace : candidate.length
  return `${candidate.slice(0, safeCut).replace(/[\s,;:.-]+$/g, '')}…`
}
