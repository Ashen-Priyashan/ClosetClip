const SAVE_MENU_ID = 'closetclip-save-product'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: SAVE_MENU_ID,
    title: 'Save to ClosetClip',
    contexts: ['page'],
    documentUrlPatterns: ['http://*/*', 'https://*/*'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== SAVE_MENU_ID || !tab?.id) return
  const tabId = tab.id

  void chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] })
    .then(() => chrome.tabs.sendMessage<{ type: string }, { message: string }>(tabId, {
      type: 'CLOSETCLIP_SAVE_PRODUCT',
    }))
    .catch(() => undefined)
})
