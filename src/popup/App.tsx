import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Bookmark, Check, LoaderCircle, Pencil, Search, Shirt, Sparkles, Trash2, X } from 'lucide-react'
import type { ClothingCategory, ClothingItem } from '../types/clothing'
import { CLOTHING_CATEGORIES } from '../types/clothing'
import type { DetectedProduct } from '../services/extractor'
import { saveClothing, getClothingItems, updateClothing, deleteClothing } from '../services/storage'
import OutfitBuilder from '../components/OutfitBuilder'
import type { Outfit } from '../types/outfit'

type DetectionStatus = 'loading' | 'ready' | 'unavailable' | 'error'
type View = 'save' | 'closet' | 'outfits'

export default function App() {
  const [view, setView] = useState<View>('save')
  const [product, setProduct] = useState<DetectedProduct>()
  const [status, setStatus] = useState<DetectionStatus>('loading')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<ClothingItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ClothingCategory | 'all'>('all')
  const [editingId, setEditingId] = useState<string>()
  const [draft, setDraft] = useState({ name: '', brand: '', price: '', notes: '', category: 'unknown' as ClothingCategory })

  useEffect(() => {
    let active = true

    async function detectCurrentPage() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.id) throw new Error('No active tab')
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] })
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

    if (view === 'save') void detectCurrentPage()
    return () => { active = false }
  }, [view])

  useEffect(() => {
    if (view !== 'closet' && view !== 'outfits') return
    let active = true
    void getClothingItems().then((savedItems) => {
      if (active) setItems(savedItems.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    }).catch(() => {
      if (active) setMessage('Could not load your closet.')
    })
    return () => { active = false }
  }, [view])

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

  function beginEdit(item: ClothingItem) {
    setEditingId(item.id)
    setDraft({
      name: item.name,
      brand: item.brand ?? '',
      price: item.price?.toString() ?? '',
      notes: item.notes ?? '',
      category: item.category,
    })
  }

  async function handleUpdate(id: string) {
    const parsedPrice = draft.price.trim() ? Number(draft.price) : undefined
    if (!draft.name.trim() || (parsedPrice !== undefined && (!Number.isFinite(parsedPrice) || parsedPrice < 0))) {
      setMessage('Enter a name and a valid non-negative price.')
      return
    }
    const updated = await updateClothing(id, {
      name: draft.name.trim(),
      brand: draft.brand.trim() || undefined,
      price: parsedPrice,
      notes: draft.notes.trim() || undefined,
      category: draft.category,
    })
    if (updated) setItems((current) => current.map((item) => item.id === id ? updated : item))
    setEditingId(undefined)
  }

  async function handleDelete(id: string) {
    const deleted = await deleteClothing(id)
    if (deleted) setItems((current) => current.filter((item) => item.id !== id))
  }

  const filteredItems = useMemo(() => items.filter((item) => {
    const term = search.trim().toLocaleLowerCase()
    const matchesSearch = !term || [item.name, item.brand, item.notes].some((field) => field?.toLocaleLowerCase().includes(term))
    return matchesSearch && (category === 'all' || item.category === category)
  }), [items, search, category])

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

      <nav className="view-tabs" aria-label="ClosetClip sections">
        {(['save', 'closet', 'outfits'] as const).map((tab) => (
          <button key={tab} className={view === tab ? 'view-tab active' : 'view-tab'} onClick={() => { setView(tab); setMessage('') }}>
            {tab === 'save' ? 'Save' : tab === 'closet' ? 'My Closet' : 'Outfits'}
          </button>
        ))}
      </nav>

      {view === 'save' && <>
        <section className="welcome" aria-labelledby="welcome-title">
          <h1 id="welcome-title">A little space<br />for <em>great finds.</em></h1>
          <p>Keep the pieces you love, all in one place.</p>
        </section>
        <section className="product-panel" aria-live="polite">
          {status === 'loading' && <div className="status-panel"><LoaderCircle className="spin" size={20} /> Looking for product details…</div>}
          {status === 'error' && <div className="status-panel">Open a shopping page to detect an item.</div>}
          {status === 'unavailable' && <div className="status-panel">No product details found on this page.</div>}
          {status === 'ready' && product && <div className="product-card">
            {product.imageUrl ? <img className="product-image" src={product.imageUrl} alt="Detected product" /> : <div className="product-image product-image-empty"><Shirt size={30} /></div>}
            <div className="product-details">
              <span className="preview-label">FOUND ON THIS PAGE</span>
              <strong>{product.name || 'Product details found'}</strong>
              {product.brand && <span>{product.brand}</span>}
              {product.price !== undefined && <span>{product.currency ? `${product.currency} ` : ''}{product.price.toFixed(2)}</span>}
              {!product.imageUrl && <span>Product image was not found, so this item cannot be saved yet.</span>}
            </div>
          </div>}
        </section>
        <button className="save-button" type="button" disabled={!canSave || saving} onClick={() => void handleSave()}>
          {saving ? <LoaderCircle className="spin" size={16} /> : message.startsWith('Saved') ? <Check size={16} /> : <Bookmark size={16} />}
          {saving ? 'Saving…' : message.startsWith('Saved') ? 'Saved' : 'Save to my closet'}
        </button>
        <p className="feedback" role="status">{message}</p>
      </>}

      {view === 'closet' && <section className="closet-view" aria-labelledby="closet-title">
        <div className="section-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h2 id="closet-title">My Closet <span>{items.length}</span></h2></div></div>
        <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your closet" /></label>
        <div className="category-row" aria-label="Filter by category">
          <button className={category === 'all' ? 'category-chip selected' : 'category-chip'} onClick={() => setCategory('all')}>All</button>
          {CLOTHING_CATEGORIES.filter((value) => value !== 'unknown').map((value) => (
            <button key={value} className={category === value ? 'category-chip selected' : 'category-chip'} onClick={() => setCategory(value)}>{categoryLabel(value)}</button>
          ))}
        </div>
        {message && <p className="feedback" role="status">{message}</p>}
        {filteredItems.length === 0
          ? <div className="empty-state"><Shirt size={27} /><strong>{items.length ? 'No pieces match your search.' : 'Your closet is waiting.'}</strong><span>{items.length ? 'Try another search or category.' : 'Save something you love while browsing.'}</span></div>
          : <div className="clothing-grid">{filteredItems.map((item) => <article className="clothing-card" key={item.id}>
            <a className="clothing-image-link" href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.name} original page`}>
              <img src={item.imageUrl} alt={item.name} loading="lazy" />
            </a>
            <div className="clothing-card-copy">
              {editingId === item.id ? <div className="edit-form">
                <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                <label>Brand<input value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} /></label>
                <label>Price<input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label>
                <label>Category<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ClothingCategory })}>{CLOTHING_CATEGORIES.map((value) => <option key={value} value={value}>{categoryLabel(value)}</option>)}</select></label>
                <label>Notes<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
                <div className="edit-actions"><button onClick={() => void handleUpdate(item.id)} aria-label="Save edits"><Check size={15} /></button><button onClick={() => setEditingId(undefined)} aria-label="Cancel edits"><X size={15} /></button></div>
              </div> : <>
                <span className="clothing-category">{categoryLabel(item.category)}</span>
                <a className="clothing-title" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.name}<ArrowUpRight size={13} /></a>
                {item.brand && <span className="clothing-brand">{item.brand}</span>}
                {item.price !== undefined && <span className="clothing-price">{item.currency ? `${item.currency} ` : ''}{item.price.toFixed(2)}</span>}
                {item.notes && <p className="clothing-notes">{item.notes}</p>}
                <div className="card-actions"><button onClick={() => beginEdit(item)} aria-label={`Edit ${item.name}`}><Pencil size={14} /></button><button onClick={() => void handleDelete(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={14} /></button></div>
              </>}
            </div>
          </article>)}</div>}
      </section>}

      {view === 'outfits' && <OutfitBuilder items={items} onSaved={(_outfit: Outfit) => setMessage('Outfit saved.')} />}

      <footer className="footer-note"><span>Made for the pieces that feel like you.</span><ArrowUpRight size={15} /></footer>
    </main>
  )
}

function categoryLabel(category: ClothingCategory): string {
  const labels: Record<ClothingCategory, string> = {
    top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes', outerwear: 'Outerwear',
    accessory: 'Accessories', dress: 'Dresses', unknown: 'Other',
  }
  return labels[category]
}
