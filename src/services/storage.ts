/// <reference types="chrome" />

import type { ClothingItem } from '../types/clothing'

const CLOTHING_STORAGE_KEY = 'clothingItems'

async function readClothingItems(): Promise<ClothingItem[]> {
  const stored = await chrome.storage.local.get(CLOTHING_STORAGE_KEY)
  const items: unknown = stored[CLOTHING_STORAGE_KEY]
  return Array.isArray(items) ? (items as ClothingItem[]) : []
}

async function writeClothingItems(items: ClothingItem[]): Promise<void> {
  await chrome.storage.local.set({ [CLOTHING_STORAGE_KEY]: items })
}

export async function getClothingItems(): Promise<ClothingItem[]> {
  return readClothingItems()
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
  const items = await readClothingItems()
  const updatedItems = items.filter((item) => item.id !== id)

  if (updatedItems.length === items.length) {
    return false
  }

  await writeClothingItems(updatedItems)
  return true
}
