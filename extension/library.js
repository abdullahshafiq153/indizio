import { api } from './api.js'

let data = null
let collectionID = ''
let view = 'list'
let activeBookmark = null
const $ = (id) => document.getElementById(id)
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]))

function render() {
  if (!data?.signedIn) {
    $('results').innerHTML = '<div class="empty"><h2>Sign in to Indizio.</h2><p>Open indizio.space, sign in, then refresh this page.</p></div>'
    return
  }
  $('identity').innerHTML = `<strong>${escapeHTML(data.member.name)}</strong><span>${escapeHTML(data.member.email)}</span>`
  $('collections').innerHTML = `<button class="${collectionID ? '' : 'active'}" data-id=""><b>▰ &nbsp; All saves</b><span>${data.bookmarks.length}</span></button>` + data.collections.map((item) => `<button class="${collectionID === item.id ? 'active' : ''}" data-id="${item.id}"><b>□ &nbsp; ${escapeHTML(item.name)}</b><span>${item.count}</span></button>`).join('')
  document.querySelectorAll('#collections button').forEach((button) => button.onclick = () => { collectionID = button.dataset.id; render() })
  const query = $('search').value.toLowerCase()
  const items = data.bookmarks.filter((item) => (!collectionID || item.collectionID === collectionID) && (!query || `${item.title} ${item.domain} ${item.description} ${item.note}`.toLowerCase().includes(query)))
  const current = data.collections.find((item) => item.id === collectionID)
  $('heading').textContent = current ? `${current.name}.` : 'All saves.'
  $('total').textContent = `${String(items.length).padStart(2, '0')} SAVED PAGES`
  $('results').className = `results ${view}`
  $('results').innerHTML = items.length ? items.map((item) => `<article data-id="${item.id}"><img src="${escapeHTML(item.cover || item.favicon)}" alt=""><div><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(item.domain)} · ${new Date(item.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</p></div><div class="note"><p>${escapeHTML(item.note || item.description || 'No note added.')}</p></div><div class="actions"><button data-edit="${item.id}" title="Edit save">✎</button><button data-remove="${item.id}" title="Remove save">◇</button><a href="${escapeHTML(item.url)}" target="_blank" title="Open website">↗</a></div></article>`).join('') : '<div class="empty"><h2>No signals here yet.</h2><p>Save a page from the compact extension view and it will appear here immediately.</p></div>'
  document.querySelectorAll('[data-edit]').forEach((button) => button.onclick = () => openEditor(button.dataset.edit))
  document.querySelectorAll('[data-remove]').forEach((button) => button.onclick = () => remove(button.dataset.remove))
}

function openEditor(id) {
  activeBookmark = data.bookmarks.find((item) => item.id === id)
  $('editTitle').textContent = activeBookmark.title
  $('editNote').value = activeBookmark.note || ''
  $('editCollection').innerHTML = '<option value="">All saves</option>' + data.collections.map((item) => `<option value="${item.id}">${escapeHTML(item.name)}</option>`).join('')
  $('editCollection').value = activeBookmark.collectionID || ''
  $('editMessage').textContent = ''
  $('editor').showModal()
}

async function remove(id) {
  const previous = data.bookmarks
  data.bookmarks = previous.filter((item) => item.id !== id); render()
  try { await api({ action: 'remove', bookmarkID: id }); await load() } catch (error) { data.bookmarks = previous; render(); alert(error.message) }
}

async function load() {
  data = await api(); render()
}

$('saveEdit').onclick = async () => {
  if (!activeBookmark) return
  $('saveEdit').disabled = true
  try { await api({ action: 'update', bookmarkID: activeBookmark.id, note: $('editNote').value, collectionID: $('editCollection').value || null }); $('editor').close(); await load() } catch (error) { $('editMessage').textContent = error.message } finally { $('saveEdit').disabled = false }
}
$('newFolder').onclick = () => $('folderDialog').showModal()
$('createFolder').onclick = async () => {
  try { const result = await api({ action: 'create-collection', collectionName: $('folderName').value }); data.collections.unshift(result.collection); $('folderName').value = ''; $('folderDialog').close(); render() } catch (error) { $('folderMessage').textContent = error.message }
}
$('search').oninput = render
$('listView').onclick = () => { view = 'list'; $('listView').classList.add('active'); $('gridView').classList.remove('active'); chrome.storage.local.set({ libraryView: view }); render() }
$('gridView').onclick = () => { view = 'grid'; $('gridView').classList.add('active'); $('listView').classList.remove('active'); chrome.storage.local.set({ libraryView: view }); render() }
$('refresh').onclick = load
chrome.storage.local.get('libraryView').then((stored) => { if (stored.libraryView === 'grid') $('gridView').click(); else load() })
