chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create?.({ id: 'indizio-save', title: 'Save page to Indizio', contexts: ['page', 'link'] })
})

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-current-page') await chrome.action.openPopup().catch(() => undefined)
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'indizio-save') await chrome.action.openPopup().catch(() => undefined)
})
