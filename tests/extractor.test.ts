/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { extractProduct } from '../src/services/extractor'

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  document.title = ''
  window.history.replaceState({}, '', '/')
})

describe('product metadata extraction', () => {
  it('reads product details from JSON-LD, including nested offers and relative images', () => {
    document.head.innerHTML = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Cotton Shirt',
      brand: { '@type': 'Brand', name: 'Example' },
      image: '/images/shirt.jpg',
      offers: { price: '49.95', priceCurrency: 'USD' },
      url: '/products/shirt',
    })}</script>`

    expect(extractProduct()).toEqual({
      name: 'Cotton Shirt',
      brand: 'Example',
      price: 49.95,
      currency: 'USD',
      imageUrl: 'http://localhost:3000/images/shirt.jpg',
      sourceUrl: 'http://localhost:3000/products/shirt',
    })
  })

  it('falls back to Open Graph metadata and the page heading', () => {
    document.head.innerHTML = '<meta property="og:image" content="/coat.jpg"><meta property="product:price:amount" content="120">'
    document.body.innerHTML = '<h1>Wool Coat</h1>'

    expect(extractProduct()).toMatchObject({
      name: 'Wool Coat',
      price: 120,
      imageUrl: 'http://localhost:3000/coat.jpg',
      sourceUrl: 'http://localhost:3000/',
    })
    expect(extractProduct().brand).toBeUndefined()
  })

  it('ignores malformed structured data and still returns a usable URL', () => {
    document.head.innerHTML = '<script type="application/ld+json">{broken json}</script>'

    expect(extractProduct()).toEqual({ sourceUrl: 'http://localhost:3000/' })
  })
})
