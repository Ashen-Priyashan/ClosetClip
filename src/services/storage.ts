/// <reference types="chrome" />

import type { ClothingItem } from '../types/clothing'
import type { Outfit } from '../types/outfit'
import { inferClothingCategory } from './clothingFromProduct'

const CLOTHING_STORAGE_KEY = 'clothingItems'
const OUTFIT_STORAGE_KEY = 'outfits'

async function readClothingItems(): Promise<ClothingItem[]> {
  const stored = await chrome.storage.local.get(CLOTHING_STORAGE_KEY)
  const items: unknown = stored[CLOTHING_STORAGE_KEY]
  return Array.isArray(items) ? (items as ClothingItem[]) : []
}

async function writeClothingItems(items: ClothingItem[]): Promise<void> {
  await chrome.storage.local.set({ [CLOTHING_STORAGE_KEY]: items })
}

export async function getClothingItems(): Promise<ClothingItem[]> {
  const items = await readClothingItems()
  let changed = false
  const categorized = items.map((item) => {
    if (item.category !== 'unknown' && item.category !== 'accessory') return item
    const category = inferClothingCategory(item)
    if (category === 'unknown' || category === item.category) return item
    changed = true
    return { ...item, category }
  })
  if (changed) await writeClothingItems(categorized)
  return categorized
}

export async function getClothingById(id: string): Promise<ClothingItem | undefined> {
  const items = await readClothingItems()
  return items.find((item) => item.id === id)
}

export async function saveClothing(
  item: ClothingItem,
): Promise<{ item: ClothingItem; alreadySaved: boolean }> {
  const items = await readClothingItems()
  const existingItem = items.find((savedItem) => savedItem.sourceUrl === item.sourceUrl)

  if (existingItem) {
    return { item: existingItem, alreadySaved: true }
  }

  await writeClothingItems([...items, item])
  return { item, alreadySaved: false }
}

export async function updateClothing(
  id: string,
  updates: Partial<Omit<ClothingItem, 'id' | 'createdAt'>>,
): Promise<ClothingItem | undefined> {
  const items = await readClothingItems()
  const itemIndex = items.findIndex((item) => item.id === id)

  if (itemIndex === -1) {
    return undefined
  }

  const updatedItem = { ...items[itemIndex], ...updates }
  const updatedItems = [...items]
  updatedItems[itemIndex] = updatedItem
  await writeClothingItems(updatedItems)
  return updatedItem
}

export async function deleteClothing(id: string): Promise<boolean> {
  const stored = await chrome.storage.local.get([CLOTHING_STORAGE_KEY, OUTFIT_STORAGE_KEY])
  const rawItems: unknown = stored[CLOTHING_STORAGE_KEY]
  const items = Array.isArray(rawItems) ? rawItems as ClothingItem[] : []
  const updatedItems = items.filter((item) => item.id !== id)

  if (updatedItems.length === items.length) {
    return false
  }

  const nextValues: { clothingItems: ClothingItem[]; outfits?: Outfit[] } = {
    clothingItems: updatedItems,
  }
  const savedOutfits: unknown = stored[OUTFIT_STORAGE_KEY]
  if (Array.isArray(savedOutfits)) {
    nextValues.outfits = (savedOutfits as Outfit[]).map((outfit) => ({
      ...outfit,
      itemIds: outfit.itemIds.filter((itemId) => itemId !== id),
    }))
  }
  await chrome.storage.local.set(nextValues)
  return true
}
