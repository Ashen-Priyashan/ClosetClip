export interface DetectedProduct {
  name?: string
  category?: string
  brand?: string
  price?: number
  currency?: string
  imageUrl?: string
  sourceUrl: string
}

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | undefined {
  return typeof value === 'object' && value !== null ? (value as JsonRecord) : undefined
}

function asText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  const record = asRecord(value)
  return record ? asText(record.name) : undefined
}

function findProducts(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.flatMap(findProducts)
  const record = asRecord(value)
  if (!record) return []

  const graphProducts = Array.isArray(record['@graph']) ? findProducts(record['@graph']) : []
  const type = record['@type']
  const types = Array.isArray(type) ? type : [type]
  const isProduct = types.some((entry) => typeof entry === 'string'
    && (entry === 'Product' || entry.endsWith('/Product') || entry.endsWith('#Product')))
  return isProduct ? [record, ...graphProducts] : graphProducts
}

function firstMeta(document: Document, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const value = document.querySelector<HTMLMetaElement>(selector)?.content?.trim()
    if (value) return value
  }
  return undefined
}

function productImage(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const image = productImage(candidate)
      if (image) return image
    }
    return undefined
  }
  if (typeof value === 'string' && value.trim()) return value.trim()
  const record = asRecord(value)
  return record ? asText(record.url) ?? asText(record.contentUrl) : undefined
}

function productOffer(product: JsonRecord): JsonRecord | undefined {
  const offers = product.offers
  if (Array.isArray(offers)) return asRecord(offers[0])
  return asRecord(offers)
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const normalized = String(value).replace(/[^\d.,-]/g, '')
  if (!normalized || !/\d/.test(normalized)) return undefined
  const parsed = Number(normalized.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

function resolveUrl(value: string | undefined, base: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value, base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

export function extractProduct(document: Document = window.document): DetectedProduct {
  const products = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .flatMap((script) => {
      try {
        return findProducts(JSON.parse(script.textContent ?? ''))
      } catch {
        return []
      }
    })
  const product = products[0]
  const offer = product ? productOffer(product) : undefined
  const price = parsePrice(offer?.price ?? offer?.lowPrice)
    ?? parsePrice(firstMeta(document, ['meta[property="product:price:amount"]', 'meta[itemprop="price"]']))
  const rawImage = productImage(product?.image)
    ?? firstMeta(document, ['meta[property="og:image"]', 'meta[name="twitter:image"]'])
    ?? document.querySelector<HTMLImageElement>('img[itemprop="image"]')?.src
    ?? document.querySelector<HTMLImageElement>('main img, article img')?.src
  const rawUrl = asText(product?.url) ?? firstMeta(document, ['meta[property="og:url"]'])
    ?? document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
  const currentUrl = document.location?.href || window.location.href
  const pageUrl = resolveUrl(currentUrl, 'https://closetclip.invalid/') ?? 'https://closetclip.invalid/'
  const sourceUrl = resolveUrl(rawUrl, pageUrl) ?? pageUrl
  const name = asText(product?.name)
    ?? firstMeta(document, ['meta[property="og:title"]', 'meta[name="twitter:title"]'])
    ?? document.querySelector('h1')?.textContent?.trim()
    ?? document.title.trim()
  const imageUrl = resolveUrl(rawImage, sourceUrl)

  const detected: DetectedProduct = { sourceUrl }
  const category = asText(product?.category)
  const brand = asText(product?.brand) ?? firstMeta(document, ['meta[property="product:brand"]'])
  const currency = asText(offer?.priceCurrency)
    ?? firstMeta(document, ['meta[property="product:price:currency"]'])

  if (name) detected.name = name
  if (category) detected.category = category
  if (brand) detected.brand = brand
  if (price !== undefined) detected.price = price
  if (currency) detected.currency = currency
  if (imageUrl) detected.imageUrl = imageUrl
  return detected
}
