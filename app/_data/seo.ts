export const SITE_URL = 'https://indizio.space'

export function absoluteURL(path: string) {
  return new URL(path, SITE_URL).toString()
}

export function jsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
