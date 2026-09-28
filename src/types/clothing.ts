export const CLOTHING_CATEGORIES = [
  'top',
  'bottom',
  'shoes',
  'outerwear',
  'accessory',
  'dress',
  'unknown',
] as const

export type ClothingCategory = (typeof CLOTHING_CATEGORIES)[number]

export interface ClothingItem {
  id: string
  name: string
  brand?: string
  price?: number
  currency?: string
  imageUrl: string
  sourceUrl: string
  category: ClothingCategory
  notes?: string
  createdAt: string
}

export function isClothingCategory(value: unknown): value is ClothingCategory {
  return typeof value === 'string' && CLOTHING_CATEGORIES.some((category) => category === value)
}
