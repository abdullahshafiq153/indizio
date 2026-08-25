const INDIZIO_ORIGIN = 'https://www.indizio.space'
const EXTENSION_API = `${INDIZIO_ORIGIN}/api/extension`

export async function api(body) {
  const { extensionToken } = await chrome.storage.local.get('extensionToken')
  const response = await fetch(EXTENSION_API, {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(extensionToken ? { Authorization: `Bearer ${extensionToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok && response.status !== 401) throw new Error(data.message || 'Indizio could not complete the request.')
  return data
}

export async function connectAccount() {
  const redirectURL = chrome.identity.getRedirectURL('auth')
  const authURL = `${INDIZIO_ORIGIN}/api/extension/connect?redirect_uri=${encodeURIComponent(redirectURL)}`
  const resultURL = await chrome.identity.launchWebAuthFlow({ url: authURL, interactive: true })
  if (!resultURL) throw new Error('Indizio connection was cancelled.')
  const params = new URLSearchParams(new URL(resultURL).hash.slice(1))
  const token = params.get('token')
  if (!token) {
    if (params.get('error') === 'not_signed_in') throw new Error('Sign in on indizio.space, then click connect again.')
    throw new Error('Indizio could not authorize this extension.')
  }
  await chrome.storage.local.set({ extensionToken: token })
  return token
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
