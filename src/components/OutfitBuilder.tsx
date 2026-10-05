import { useMemo, useState } from 'react'
import { Check, Shirt, X } from 'lucide-react'
import type { ClothingCategory, ClothingItem } from '../types/clothing'
import { CLOTHING_CATEGORIES } from '../types/clothing'
import { createOutfit } from '../services/outfitStorage'
import type { Outfit } from '../types/outfit'

interface OutfitBuilderProps {
  items: ClothingItem[]
  onSaved: (outfit: Outfit) => void
}

export default function OutfitBuilder({ items, onSaved }: OutfitBuilderProps) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const selectedItems = useMemo(() => items.filter((item) => selectedIds.includes(item.id)), [items, selectedIds])

  function toggleItem(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id])
    setError('')
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Give this outfit a name.')
      return
    }
    if (selectedIds.length === 0) {
      setError('Choose at least one piece.')
      return
    }

    setSaving(true)
    try {
      const outfit = await createOutfit({
        id: crypto.randomUUID(),
        name: name.trim(),
        itemIds: selectedIds,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        createdAt: new Date().toISOString(),
      })
      setName('')
      setNotes('')
      setSelectedIds([])
      setError('')
      setSavedMessage('Outfit saved.')
      onSaved(outfit)
    } catch {
      setError('Could not save this outfit. Check that its pieces are still in your closet.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="outfit-builder" aria-labelledby="builder-title">
      <span className="eyebrow">PUT IT TOGETHER</span>
      <h2 id="builder-title">Create an outfit</h2>
      <label className="outfit-name-field">Outfit name<input value={name} onChange={(event) => { setName(event.target.value); setSavedMessage('') }} placeholder="e.g. Weekend in the city" /></label>

      <div className="selected-outfit" aria-label="Selected outfit pieces">
        <span className="selected-heading">YOUR LOOK <span>{selectedItems.length} pieces</span></span>
        {selectedItems.length === 0 ? <span className="selected-empty">Choose pieces below to start your look.</span> :
          <div className="selected-chips">{selectedItems.map((item) => <button key={item.id} className="selected-chip" onClick={() => toggleItem(item.id)} aria-label={`Remove ${item.name} from outfit`}>
            <img src={item.imageUrl} alt="" /><span>{item.name}</span><X size={13} />
          </button>)}</div>}
      </div>

      {items.length === 0 ? <div className="empty-state"><Shirt size={27} /><strong>Your closet is empty.</strong><span>Save a few pieces before styling an outfit.</span></div> :
        <div className="builder-categories">{CLOTHING_CATEGORIES.filter((category) => items.some((item) => item.category === category)).map((category) => {
          const categoryItems = items.filter((item) => item.category === category)
          return <section className="builder-category" key={category}>
            <h3>{labelForCategory(category)}</h3>
            <div className="builder-item-list">{categoryItems.map((item) => {
              const selected = selectedIds.includes(item.id)
              return <button key={item.id} className={selected ? 'builder-item selected' : 'builder-item'} onClick={() => toggleItem(item.id)} aria-pressed={selected}>
                <img src={item.imageUrl} alt="" /><span>{item.name}</span>{selected && <Check size={14} />}
              </button>
            })}</div>
          </section>
        })}</div>}

      <label className="outfit-notes-field">Notes (optional)<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Where will you wear this?" /></label>
      {error && <p className="feedback error-message" role="alert">{error}</p>}
      {savedMessage && <p className="feedback" role="status">{savedMessage}</p>}
      <button className="save-button outfit-save" disabled={saving || items.length === 0} onClick={() => void handleSave()}>{saving ? 'Saving…' : 'Save outfit'}</button>
    </section>
  )
}

function labelForCategory(category: ClothingCategory): string {
  const labels: Record<ClothingCategory, string> = {
    top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes', outerwear: 'Outerwear',
    accessory: 'Accessories', extras: 'Extras', dress: 'Dresses', unknown: 'Other pieces',
  }
  return labels[category]
}
