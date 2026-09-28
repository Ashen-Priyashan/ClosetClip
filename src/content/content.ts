import { extractProduct } from '../services/extractor'

chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
  if (message.type === 'CLOSETCLIP_DETECT_PRODUCT') {
    sendResponse(extractProduct(document))
  }
  return false
})
