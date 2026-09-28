import { extractProduct } from '../services/extractor'

type ClosetClipWindow = Window & { __closetClipListenerInstalled?: boolean }

const contentWindow = window as ClosetClipWindow
if (!contentWindow.__closetClipListenerInstalled) {
  contentWindow.__closetClipListenerInstalled = true
  chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
    if (message.type === 'CLOSETCLIP_DETECT_PRODUCT') {
      sendResponse(extractProduct(document))
    }
    return false
  })
}
