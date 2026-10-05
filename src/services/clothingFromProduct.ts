import type { ClothingItem } from '../types/clothing'
import type { DetectedProduct } from './extractor'

const CATEGORY_TERMS = {
  extras: ['watch', 'watches', 'jewelry', 'jewellery', 'belt', 'belts', 'sunglasses', 'wallet', 'handbag', 'purse', 'bag', 'backpack'],
  accessory: ['accessory', 'accessories', 'necklace', 'earring', 'earrings', 'bracelet', 'bracelets', 'ring', 'rings', 'scarf', 'scarves', 'hat', 'hats', 'cap', 'caps'],
  shoes: ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'sandal', 'sandals', 'heel', 'heels', 'loafer', 'flats'],
  outerwear: ['jacket', 'coat', 'blazer', 'cardigan', 'parka', 'trench', 'vest'],
  dress: ['dress', 'jumpsuit', 'romper'],
  bottom: ['bottom', 'trouser', 'trousers', 'pants', 'jeans', 'shorts', 'skirt', 'leggings'],
  top: ['top', 'shirt', 't-shirt', 'tee', 'blouse', 'sweater', 'sweatshirt', 'hoodie', 'polo', 'tank'],
} as const

export function inferClothingCategory(product: Pick<DetectedProduct, 'name' | 'category'>): ClothingItem['category'] {
  const text = ` ${`${product.category ?? ''} ${product.name ?? ''}`.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `
  for (const category of ['extras', 'accessory', 'shoes', 'outerwear', 'dress', 'bottom', 'top'] as const) {
    if (CATEGORY_TERMS[category].some((term) => text.includes(` ${term.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ')} `))) return category
  }
  return 'unknown'
}

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
    category: inferClothingCategory(product),
    createdAt,
  }
}
