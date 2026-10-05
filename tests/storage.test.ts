import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ClothingItem } from '../src/types/clothing'
import {
  deleteClothing,
  getClothingById,
  getClothingItems,
  saveClothing,
  updateClothing,
} from '../src/services/storage'

const STORAGE_KEY = 'clothingItems'
let values: Record<string, unknown>

const item: ClothingItem = {
  id: 'item-1',
  name: 'Linen shirt',
  imageUrl: 'https://shop.example/shirt.jpg',
  sourceUrl: 'https://shop.example/shirt',
  category: 'top',
  createdAt: '2026-09-29T00:00:00.000Z',
}
const otherItem: ClothingItem = { ...item, id: 'other', name: 'Other shirt', sourceUrl: 'https://shop.example/other' }

beforeEach(() => {
  values = {}
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn(async (key: string | string[]) => Array.isArray(key)
          ? Object.fromEntries(key.map((entry) => [entry, values[entry]]))
          : { [key]: values[key] }),
        set: vi.fn(async (nextValues: Record<string, unknown>) => {
          Object.assign(values, nextValues)
        }),
      },
    },
  })
})

describe('clothing storage service', () => {
  it('saves an item and retrieves the saved items', async () => {
    await expect(saveClothing(item)).resolves.toEqual({ item, alreadySaved: false })
    await expect(getClothingItems()).resolves.toEqual([item])
  })

  it('retrieves a clothing item by id', async () => {
    values[STORAGE_KEY] = [item, otherItem]

    await expect(getClothingById(item.id)).resolves.toEqual(item)
    await expect(getClothingById('missing')).resolves.toBeUndefined()
  })

  it('moves existing watches from accessories into wardrobe extras', async () => {
    const watch: ClothingItem = { ...item, id: 'watch', name: 'Silver watch', category: 'accessory' }
    values[STORAGE_KEY] = [watch]

    await expect(getClothingItems()).resolves.toEqual([{ ...watch, category: 'extras' }])
    expect(values[STORAGE_KEY]).toEqual([{ ...watch, category: 'extras' }])
  })

  it('updates editable fields while preserving the id and creation date', async () => {
    values[STORAGE_KEY] = [item]

    const updated = await updateClothing(item.id, { name: 'Blue linen shirt', notes: 'Summer' })

    expect(updated).toEqual({ ...item, name: 'Blue linen shirt', notes: 'Summer' })
    expect(values[STORAGE_KEY]).toEqual([updated])
    await expect(updateClothing('missing', { name: 'Unknown' })).resolves.toBeUndefined()
  })

  it('deletes an existing item and reports when an item was not found', async () => {
    values[STORAGE_KEY] = [item, otherItem]
    values.outfits = [{ id: 'outfit-1', name: 'Weekend', itemIds: [item.id, 'other'], createdAt: '2026-09-29' }]

    await expect(deleteClothing(item.id)).resolves.toBe(true)
    await expect(getClothingItems()).resolves.toEqual([otherItem])
    expect(values.outfits).toEqual([{ id: 'outfit-1', name: 'Weekend', itemIds: ['other'], createdAt: '2026-09-29' }])
    await expect(deleteClothing('missing')).resolves.toBe(false)
  })

  it('does not save a second item with the same source URL', async () => {
    values[STORAGE_KEY] = [item]
    const duplicate = { ...item, id: 'item-2', name: 'Different title' }

    await expect(saveClothing(duplicate)).resolves.toEqual({ item, alreadySaved: true })
    expect(values[STORAGE_KEY]).toEqual([item])
  })
})
