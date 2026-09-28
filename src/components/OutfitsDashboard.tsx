import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Pencil, Plus, Shirt, Trash2 } from 'lucide-react'
import { getClothingItems } from '../services/storage'
import { deleteOutfit, getOutfits, updateOutfit } from '../services/outfitStorage'
import type { ClothingItem } from '../types/clothing'
import type { Outfit } from '../types/outfit'

interface OutfitsDashboardProps {
  onCreate: () => void
}

export default function OutfitsDashboard({ onCreate }: OutfitsDashboardProps) {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [items, setItems] = useState<ClothingItem[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void Promise.all([getOutfits(), getClothingItems()]).then(([savedOutfits, savedItems]) => {
      if (!active) return
      setOutfits(savedOutfits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      setItems(savedItems)
    }).catch(() => {
      if (active) setError('Could not load your outfits.')
    })
    return () => { active = false }
  }, [])

  const selectedOutfit = outfits.find((outfit) => outfit.id === selectedId)
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const outfitItems = selectedOutfit?.itemIds.flatMap((id) => {
    const item = itemMap.get(id)
    return item ? [item] : []
  }) ?? []

  function beginEdit(outfit: Outfit) {
    setNameDraft(outfit.name)
    setNotesDraft(outfit.notes ?? '')
    setEditing(true)
    setError('')
  }

  async function saveEdit() {
    if (!selectedOutfit || !nameDraft.trim()) {
      setError('Give this outfit a name.')
      return
    }
    try {
      const updated = await updateOutfit(selectedOutfit.id, {
        name: nameDraft.trim(),
        notes: notesDraft.trim() || undefined,
      })
      if (updated) setOutfits((current) => current.map((outfit) => outfit.id === updated.id ? updated : outfit))
      setEditing(false)
      setError('')
    } catch {
      setError('Could not update this outfit.')
    }
  }

  async function removeOutfit(id: string) {
    if (await deleteOutfit(id)) {
      setOutfits((current) => current.filter((outfit) => outfit.id !== id))
      setSelectedId(undefined)
    }
  }

  if (selectedOutfit) {
    return <section className="outfits-dashboard" aria-labelledby="outfit-detail-title">
      <button className="back-button" onClick={() => { setSelectedId(undefined); setEditing(false); setError('') }}><ArrowLeft size={15} /> All outfits</button>
      {editing ? <div className="outfit-edit-form">
        <label>Outfit name<input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} /></label>
        <label>Notes<textarea value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} /></label>
        <button className="save-button" onClick={() => void saveEdit()}>Save changes</button>
        <button className="text-button" onClick={() => setEditing(false)}>Cancel</button>
      </div> : <>
        <span className="eyebrow">SAVED LOOK</span>
        <div className="outfit-detail-heading"><div><h2 id="outfit-detail-title">{selectedOutfit.name}</h2><span>{outfitItems.length} pieces · {new Date(selectedOutfit.createdAt).toLocaleDateString()}</span></div>
          <div className="card-actions"><button onClick={() => beginEdit(selectedOutfit)} aria-label="Edit outfit"><Pencil size={14} /></button><button onClick={() => void removeOutfit(selectedOutfit.id)} aria-label="Delete outfit"><Trash2 size={14} /></button></div>
        </div>
        {selectedOutfit.notes && <p className="outfit-notes-copy">{selectedOutfit.notes}</p>}
        {outfitItems.length === 0 ? <div className="empty-state"><Shirt size={27} /><strong>No saved pieces in this look.</strong><span>The clothing items may have been removed from your closet.</span></div> :
          <div className="outfit-piece-list">{outfitItems.map((item) => <a key={item.id} className="outfit-piece" href={item.sourceUrl} target="_blank" rel="noreferrer">
            <img src={item.imageUrl} alt={item.name} /><span><strong>{item.name}</strong>{item.brand && <small>{item.brand}</small>}</span><ArrowUpRight size={15} />
          </a>)}</div>}
      </>}
      {error && <p className="feedback error-message" role="alert">{error}</p>}
    </section>
  }

  return <section className="outfits-dashboard" aria-labelledby="outfits-title">
    <div className="section-heading"><div><span className="eyebrow">MADE BY YOU</span><h2 id="outfits-title">Your Outfits <span>{outfits.length}</span></h2></div><button className="add-outfit-button" onClick={onCreate} aria-label="Create outfit"><Plus size={16} /></button></div>
    {error && <p className="feedback error-message" role="alert">{error}</p>}
    {outfits.length === 0 ? <div className="empty-state"><Shirt size={27} /><strong>No outfits saved yet.</strong><span>Bring a few favorite pieces together.</span><button className="text-button" onClick={onCreate}>Create your first outfit</button></div> :
      <div className="outfit-grid">{outfits.map((outfit) => {
        const previewItems = outfit.itemIds.flatMap((id) => {
          const item = itemMap.get(id)
          return item ? [item] : []
        }).slice(0, 3)
        return <article className="outfit-card" key={outfit.id}>
          <button className="outfit-preview" onClick={() => setSelectedId(outfit.id)} aria-label={`Open ${outfit.name}`}>
            {previewItems.length ? previewItems.map((item) => <img key={item.id} src={item.imageUrl} alt="" />) : <Shirt size={26} />}
          </button>
          <button className="outfit-card-title" onClick={() => setSelectedId(outfit.id)}>{outfit.name}<ArrowUpRight size={13} /></button>
          <span className="outfit-card-meta">{previewItems.length === outfit.itemIds.length ? outfit.itemIds.length : previewItems.length} pieces</span>
        </article>
      })}</div>}
  </section>
}
