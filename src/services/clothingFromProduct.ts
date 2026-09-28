import type { ClothingItem } from '../types/clothing'
import type { DetectedProduct } from './extractor'

export function createClothingItem(
  product: DetectedProduct,
  id = crypto.randomUUID(),
  createdAt = new Date().toISOString(),
): ClothingItem | undefined {
  if (!product.name || !product.imageUrl) return undefined

  return {
    id,
    name: product.name,
    ...(product.brand ? { brand: product.brand } : {}),
    ...(product.price !== undefined ? { price: product.price } : {}),
    ...(product.currency ? { currency: product.currency } : {}),
    imageUrl: product.imageUrl,
    sourceUrl: product.sourceUrl,
    category: 'unknown',
    createdAt,
  }
}
