import { extractProduct } from '../services/extractor'
import { saveClothing } from '../services/storage'
import { createClothingItem } from '../services/clothingFromProduct'

type ClosetClipWindow = Window & { __closetClipListenerInstalled?: boolean }

const contentWindow = window as ClosetClipWindow
if (!contentWindow.__closetClipListenerInstalled) {
  contentWindow.__closetClipListenerInstalled = true
  chrome.runtime.onMessage.addListener((message: { type?: string }, _sender, sendResponse) => {
    if (message.type === 'CLOSETCLIP_DETECT_PRODUCT') {
      sendResponse(extractProduct(document))
      return false
    }
    if (message.type === 'CLOSETCLIP_SAVE_PRODUCT') {
      void saveCurrentProduct().then(sendResponse)
      return true
    }
    return false
  })
}

async function saveCurrentProduct(): Promise<{ status: 'saved' | 'alreadySaved' | 'unavailable' | 'error'; message: string }> {
  try {
    const item = createClothingItem(extractProduct(document))
    if (!item) {
      const message = 'Could not find a product name and image on this page.'
      showToast(message)
      return { status: 'unavailable', message }
    }
    const result = await saveClothing(item)
    const response = result.alreadySaved
      ? { status: 'alreadySaved' as const, message: 'Already saved to your ClosetClip.' }
      : { status: 'saved' as const, message: 'Saved to your ClosetClip.' }
    showToast(response.message)
    return response
  } catch {
    const message = 'Could not save this item. Please try again.'
    showToast(message)
    return { status: 'error', message }
  }
}

function showToast(message: string): void {
  const toast = document.createElement('div')
  toast.textContent = message
  Object.assign(toast.style, {
    position: 'fixed', zIndex: '2147483647', right: '20px', bottom: '20px',
    padding: '12px 16px', borderRadius: '10px', color: '#f8f7f1',
    background: '#3d5145', boxShadow: '0 4px 16px #0003',
    font: '13px/1.4 system-ui, sans-serif',
  })
  document.documentElement.append(toast)
  window.setTimeout(() => toast.remove(), 3200)
}
