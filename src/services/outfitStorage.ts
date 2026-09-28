import { getClothingItems } from './storage'
import type { Outfit } from '../types/outfit'

const OUTFIT_STORAGE_KEY = 'outfits'

async function readOutfits(): Promise<Outfit[]> {
  const stored = await chrome.storage.local.get(OUTFIT_STORAGE_KEY)
  const outfits: unknown = stored[OUTFIT_STORAGE_KEY]
  return Array.isArray(outfits) ? (outfits as Outfit[]) : []
}

async function writeOutfits(outfits: Outfit[]): Promise<void> {
  await chrome.storage.local.set({ [OUTFIT_STORAGE_KEY]: outfits })
}

async function uniqueExistingItemIds(itemIds: string[]): Promise<string[]> {
  const availableIds = new Set((await getClothingItems()).map((item) => item.id))
  const uniqueIds = [...new Set(itemIds)]
  const missingIds = uniqueIds.filter((id) => !availableIds.has(id))

  if (missingIds.length > 0) {
    throw new Error(`Outfit references clothing items that do not exist: ${missingIds.join(', ')}`)
  }
  return uniqueIds
}

export async function getOutfits(): Promise<Outfit[]> {
  return readOutfits()
}

export async function getOutfitById(id: string): Promise<Outfit | undefined> {
  return (await readOutfits()).find((outfit) => outfit.id === id)
}

export async function createOutfit(outfit: Outfit): Promise<Outfit> {
  const normalized = { ...outfit, itemIds: await uniqueExistingItemIds(outfit.itemIds) }
  const outfits = await readOutfits()
  await writeOutfits([...outfits, normalized])
  return normalized
}

export async function updateOutfit(
  id: string,
  updates: Partial<Omit<Outfit, 'id' | 'createdAt'>>,
): Promise<Outfit | undefined> {
  const outfits = await readOutfits()
  const index = outfits.findIndex((outfit) => outfit.id === id)
  if (index === -1) return undefined

  const merged = { ...outfits[index], ...updates }
  const updated = { ...merged, itemIds: await uniqueExistingItemIds(merged.itemIds) }
  const next = [...outfits]
  next[index] = updated
  await writeOutfits(next)
  return updated
}

export async function deleteOutfit(id: string): Promise<boolean> {
  const outfits = await readOutfits()
  const next = outfits.filter((outfit) => outfit.id !== id)
  if (next.length === outfits.length) return false
  await writeOutfits(next)
  return true
}
