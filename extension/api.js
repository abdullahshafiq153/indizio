const INDIZIO_ORIGIN = 'https://www.indizio.space'
const EXTENSION_API = `${INDIZIO_ORIGIN}/api/extension`

export async function api(body) {
  const response = await fetch(EXTENSION_API, {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok && response.status !== 401) throw new Error(data.message || 'Indizio could not complete the request.')
  return data
}

export async function activePage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id || !/^https?:/.test(tab.url || '')) throw new Error('Open a public website to save it.')
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({
      url: document.querySelector('link[rel="canonical"]')?.href || location.href,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      favicon: document.querySelector('link[rel~="icon"]')?.href || `${location.origin}/favicon.ico`,
    }),
  })
  return result
}

export function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

export { INDIZIO_ORIGIN }
