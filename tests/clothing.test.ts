import { describe, expect, it } from 'vitest'
import { CLOTHING_CATEGORIES, isClothingCategory } from '../src/types/clothing'

describe('clothing categories', () => {
  it('includes the categories supported by the initial model', () => {
    expect(CLOTHING_CATEGORIES).toEqual([
      'top',
      'bottom',
      'shoes',
      'outerwear',
      'accessory',
      'extras',
      'dress',
      'unknown',
    ])
  })

  it('recognizes valid categories and rejects other values', () => {
    expect(isClothingCategory('outerwear')).toBe(true)
    expect(isClothingCategory('tops')).toBe(false)
    expect(isClothingCategory(undefined)).toBe(false)
  })
})
