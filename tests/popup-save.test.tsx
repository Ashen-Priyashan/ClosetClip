/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/popup/App'

const detectedProduct = {
  name: 'Cotton Shirt',
  brand: 'Example',
  price: 49.95,
  currency: 'USD',
  imageUrl: 'https://shop.example/shirt.jpg',
  sourceUrl: 'https://shop.example/products/shirt',
}

let storage: Record<string, unknown>
const storageSet = vi.fn(async (values: Record<string, unknown>) => Object.assign(storage, values))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('popup save action', () => {
  it('detects the active page and saves its product metadata', async () => {
    storage = {}
    vi.stubGlobal('chrome', {
      tabs: {
        query: vi.fn(async () => [{ id: 7 }]),
        sendMessage: vi.fn(async () => detectedProduct),
      },
      scripting: { executeScript: vi.fn(async () => []) },
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: storage[key] })),
          set: storageSet,
        },
      },
    })

    render(<App />)
    expect(await screen.findByText('Cotton Shirt')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Save to my closet' }))

    expect((await screen.findByRole('status')).textContent).toBe('Saved to your closet.')
    await waitFor(() => expect(storageSet).toHaveBeenCalledOnce())
    const savedItems = storage.clothingItems as Array<Record<string, unknown>>
    expect(savedItems).toHaveLength(1)
    expect(savedItems[0]).toMatchObject({
      name: 'Cotton Shirt',
      brand: 'Example',
      price: 49.95,
      currency: 'USD',
      imageUrl: detectedProduct.imageUrl,
      sourceUrl: detectedProduct.sourceUrl,
      category: 'unknown',
    })
  })
})
