import { activePage, api, connectAccount, hostname, INDIZIO_ORIGIN } from './api.js'

let data = null
let page = null
let activeMode = 'save'

const $ = (id) => document.getElementById(id)
const views = { save: $('saveView'), library: $('libraryView') }

function setMode(mode) {
  activeMode = mode
  chrome.storage.local.set({ extensionMode: mode })
  Object.entries(views).forEach(([key, node]) => { node.hidden = key !== mode })
  document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode))
  if (mode === 'library') renderLibrary()
}

function renderCollections() {
  $('collection').innerHTML = '<option value="">All saves</option>' + data.collections.map((item) => `<option value="${item.id}">${escapeHTML(item.name)} (${item.count})</option>`).join('')
}

function renderLibrary(query = '', collectionID = '') {
  if (!data) return
  const q = query.toLowerCase()
  const items = data.bookmarks.filter((item) => (!collectionID || item.collectionID === collectionID) && (!q || `${item.title} ${item.domain} ${item.note}`.toLowerCase().includes(q))).slice(0, 8)
  $('collectionChips').innerHTML = `<button class="${collectionID ? '' : 'active'}" data-collection="">ALL · ${data.bookmarks.length}</button>` + data.collections.map((item) => `<button class="${collectionID === item.id ? 'active' : ''}" data-collection="${item.id}">${escapeHTML(item.name)} · ${item.count}</button>`).join('')
  $('recentBookmarks').innerHTML = items.length ? items.map((item) => `<article><img src="${escapeAttr(item.favicon || item.cover)}" alt=""><div><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(item.domain)}</p></div><a href="${escapeAttr(item.url)}" target="_blank">↗</a></article>`).join('') : '<p class="message">No saved pages match this view.</p>'
  document.querySelectorAll('[data-collection]').forEach((button) => button.onclick = () => renderLibrary($('quickSearch').value, button.dataset.collection))
}

async function boot() {
  $('loading').hidden = false
  $('signedOut').hidden = true
  try {
    ;[data, page] = await Promise.all([api(), activePage().catch(() => null)])
    $('loading').hidden = true
    if (!data.signedIn) { $('signedOut').hidden = false; return }
    renderCollections()
    if (page) {
      $('favicon').src = page.favicon
      $('domain').textContent = hostname(page.url)
      $('title').textContent = page.title
      $('pageUrl').textContent = page.url
      $('pageUrl').href = page.url
      const existing = data.bookmarks.find((item) => item.url === page.url)
      $('saveButton').innerHTML = existing ? 'REMOVE FROM INDIZIO <span>−</span>' : 'SAVE TO INDIZIO <span>+</span>'
      $('saveButton').dataset.bookmark = existing?.id || ''
    } else {
      $('title').textContent = 'This page cannot be saved.'
      $('domain').textContent = 'INDIZIO'
      $('saveButton').disabled = true
    }
    const stored = await chrome.storage.local.get('extensionMode')
    setMode(stored.extensionMode || 'save')
  } catch (error) {
    $('loading').hidden = true
    $('signedOut').hidden = false
    $('signedOut').querySelector('p:not(.eyebrow)').textContent = error.message
  }
}

$('saveButton').onclick = async () => {
  const button = $('saveButton')
  button.disabled = true
  $('saveMessage').textContent = button.dataset.bookmark ? 'Removing…' : 'Saving immediately…'
  try {
    if (button.dataset.bookmark) {
      await api({ action: 'remove', bookmarkID: button.dataset.bookmark })
      $('saveMessage').textContent = 'Removed from your research library.'
      button.dataset.bookmark = ''
      button.innerHTML = 'SAVE TO INDIZIO <span>+</span>'
    } else {
      const result = await api({ action: 'save', ...page, note: $('note').value, collectionID: $('collection').value || null })
      button.dataset.bookmark = result.bookmarkID
      button.innerHTML = 'REMOVE FROM INDIZIO <span>−</span>'
      $('saveMessage').textContent = result.isNew ? 'Saved. This site is new to Indizio and remains private.' : 'Saved to your Indizio research library.'
    }
    data = await api(); renderCollections()
  } catch (error) { $('saveMessage').textContent = error.message }
  finally { button.disabled = false }
}

$('createCollection').onclick = async () => {
  const name = $('newCollection').value.trim()
  if (!name) return
  try { const result = await api({ action: 'create-collection', collectionName: name }); data.collections.unshift(result.collection); $('newCollection').value = ''; renderCollections(); $('collection').value = result.collection.id } catch (error) { $('saveMessage').textContent = error.message }
}
$('openLibrary').onclick = $('viewAll').onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL('library.html') })
$('signIn').onclick = () => chrome.tabs.create({ url: INDIZIO_ORIGIN })
$('retry').onclick = async () => {
  $('retry').disabled = true
  const copy = $('signedOut').querySelector('p:not(.eyebrow)')
  copy.textContent = 'Connecting securely…'
  try { await connectAccount(); await boot() } catch (error) { copy.textContent = error.message } finally { $('retry').disabled = false }
}
$('searchToggle').onclick = () => { $('quickSearch').hidden = !$('quickSearch').hidden; if (!$('quickSearch').hidden) $('quickSearch').focus() }
$('quickSearch').oninput = (event) => renderLibrary(event.target.value)
document.querySelectorAll('[data-mode]').forEach((button) => button.onclick = () => setMode(button.dataset.mode))

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]))
const escapeAttr = escapeHTML
boot()
