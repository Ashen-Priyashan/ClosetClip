import { describe, expect, it } from 'vitest'
import { createClothingItem, inferClothingCategory } from '../src/services/clothingFromProduct'

describe('createClothingItem', () => {
  it('converts detected product fields to a clothing item', () => {
    expect(createClothingItem({
      name: 'Linen shirt', brand: 'Studio', price: 24, currency: 'USD',
      imageUrl: 'https://shop.example/shirt.jpg', sourceUrl: 'https://shop.example/shirt',
    }, 'item-id', '2026-09-29T00:00:00.000Z')).toEqual({
      id: 'item-id', name: 'Linen shirt', brand: 'Studio', price: 24, currency: 'USD',
      imageUrl: 'https://shop.example/shirt.jpg', sourceUrl: 'https://shop.example/shirt',
      category: 'top', createdAt: '2026-09-29T00:00:00.000Z',
    })
  })

  it('returns no item when required identifying details are missing', () => {
    expect(createClothingItem({ sourceUrl: 'https://shop.example/product', name: 'Unknown image' })).toBeUndefined()
  })

  it.each([
    ['Gold hoop earrings', 'accessory'],
    ['Linen shirt', 'top'],
    ['Wide-leg jeans', 'bottom'],
    ['Leather boots', 'shoes'],
    ['Wool coat', 'outerwear'],
    ['Midi dress', 'dress'],
  ] as const)('infers %s as %s', (name, category) => {
    expect(inferClothingCategory({ name })).toBe(category)
  })

  it('uses product category metadata and leaves ambiguous names uncategorized', () => {
    expect(inferClothingCategory({ category: 'Fashion accessories', name: 'Luna' })).toBe('accessory')
    expect(inferClothingCategory({ name: 'Luna' })).toBe('unknown')
  })
})
