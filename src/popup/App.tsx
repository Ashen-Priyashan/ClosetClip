import { useEffect, useState } from 'react'
import { ArrowUpRight, Bookmark, Check, LoaderCircle, Shirt, Sparkles } from 'lucide-react'
import type { DetectedProduct } from '../services/extractor'
import { saveClothing } from '../services/storage'

type DetectionStatus = 'loading' | 'ready' | 'unavailable' | 'error'

export default function App() {
  const [product, setProduct] = useState<DetectedProduct>()
  const [status, setStatus] = useState<DetectionStatus>('loading')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function detectCurrentPage() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.id) throw new Error('No active tab')

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        })
        const detected = await chrome.tabs.sendMessage<{ type: string }, DetectedProduct>(tab.id, {
          type: 'CLOSETCLIP_DETECT_PRODUCT',
        })
        if (!active) return
        setProduct(detected)
        setStatus(detected.name || detected.imageUrl ? 'ready' : 'unavailable')
      } catch {
        if (active) setStatus('error')
      }
    }

    void detectCurrentPage()
    return () => { active = false }
  }, [])

  async function handleSave() {
    if (!product?.name || !product.imageUrl) return
    setSaving(true)
    setMessage('')

    try {
      const result = await saveClothing({
        id: crypto.randomUUID(),
        name: product.name,
        ...(product.brand ? { brand: product.brand } : {}),
        ...(product.price !== undefined ? { price: product.price } : {}),
        ...(product.currency ? { currency: product.currency } : {}),
        imageUrl: product.imageUrl,
        sourceUrl: product.sourceUrl,
        category: 'unknown',
        createdAt: new Date().toISOString(),
      })
      setMessage(result.alreadySaved ? 'Already saved to your closet.' : 'Saved to your closet.')
    } catch {
      setMessage('Could not save this item. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = Boolean(product?.name && product.imageUrl)

  return (
    <main className="popup-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="ClosetClip home">
          <span className="brand-mark"><Shirt size={19} strokeWidth={2.2} /></span>
          <span>closet<span className="brand-accent">clip</span></span>
        </a>
        <span className="eyebrow"><Sparkles size={13} /> YOUR STYLE, COLLECTED</span>
      </header>

      <section className="welcome" aria-labelledby="welcome-title">
        <h1 id="welcome-title">A little space<br />for <em>great finds.</em></h1>
        <p>Keep the pieces you love, all in one place.</p>
      </section>

      <section className="product-panel" aria-live="polite">
        {status === 'loading' && (
          <div className="status-panel"><LoaderCircle className="spin" size={20} /> Looking for product details…</div>
        )}
        {status === 'error' && (
          <div className="status-panel">Open a shopping page to detect an item.</div>
        )}
        {status === 'unavailable' && (
          <div className="status-panel">No product details found on this page.</div>
        )}
        {status === 'ready' && product && (
          <div className="product-card">
            {product.imageUrl
              ? <img className="product-image" src={product.imageUrl} alt="Detected product" />
              : <div className="product-image product-image-empty"><Shirt size={30} /></div>}
            <div className="product-details">
              <span className="preview-label">FOUND ON THIS PAGE</span>
              <strong>{product.name || 'Product details found'}</strong>
              {product.brand && <span>{product.brand}</span>}
              {product.price !== undefined && <span>{product.currency ? `${product.currency} ` : ''}{product.price.toFixed(2)}</span>}
              {!product.imageUrl && <span>Product image was not found, so this item cannot be saved yet.</span>}
            </div>
          </div>
        )}
      </section>

      <button className="save-button" type="button" disabled={!canSave || saving} onClick={() => void handleSave()}>
        {saving ? <LoaderCircle className="spin" size={16} /> : message.startsWith('Saved') ? <Check size={16} /> : <Bookmark size={16} />}
        {saving ? 'Saving…' : message.startsWith('Saved') ? 'Saved' : 'Save to my closet'}
      </button>
      <p className="feedback" role="status">{message}</p>

      <footer className="footer-note">
        <span>Made for the pieces that feel like you.</span>
        <ArrowUpRight size={15} />
      </footer>
    </main>
  )
}
