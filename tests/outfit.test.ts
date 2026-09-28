import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ClothingItem } from '../src/types/clothing'
import type { Outfit } from '../src/types/outfit'
import { createOutfit, deleteOutfit, getOutfitById, getOutfits, updateOutfit } from '../src/services/outfitStorage'

const shirt: ClothingItem = {
  id: 'shirt-1', name: 'Linen Shirt', imageUrl: 'https://shop.example/shirt.jpg',
  sourceUrl: 'https://shop.example/shirt', category: 'top', createdAt: '2026-09-01T00:00:00.000Z',
}
const outfit: Outfit = {
  id: 'outfit-1', name: 'Weekend', itemIds: [shirt.id], createdAt: '2026-09-02T00:00:00.000Z',
}
let values: Record<string, unknown>

beforeEach(() => {
  values = { clothingItems: [shirt] }
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: values[key] })),
        set: vi.fn(async (next: Record<string, unknown>) => Object.assign(values, next)),
      },
    },
  })
})

describe('outfit storage service', () => {
  it('creates an outfit using unique references to existing clothing items', async () => {
    await expect(createOutfit({ ...outfit, itemIds: [shirt.id, shirt.id] })).resolves.toEqual(outfit)
    await expect(getOutfits()).resolves.toEqual([outfit])
    await expect(getOutfitById(outfit.id)).resolves.toEqual(outfit)
  })

  it('rejects references to clothing items that are not in the closet', async () => {
    await expect(createOutfit({ ...outfit, itemIds: ['missing'] })).rejects.toThrow('do not exist: missing')
  })

  it('updates an outfit and deletes it', async () => {
    values.outfits = [outfit]
    await expect(updateOutfit(outfit.id, { name: 'Sunday walk' })).resolves.toEqual({ ...outfit, name: 'Sunday walk' })
    await expect(deleteOutfit(outfit.id)).resolves.toBe(true)
    await expect(getOutfits()).resolves.toEqual([])
    await expect(deleteOutfit(outfit.id)).resolves.toBe(false)
  })
})
