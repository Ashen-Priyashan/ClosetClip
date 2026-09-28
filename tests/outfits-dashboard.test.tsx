/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClothingItem } from '../src/types/clothing'
import type { Outfit } from '../src/types/outfit'
import App from '../src/popup/App'

const item: ClothingItem = {
  id: 'shirt', name: 'Linen Shirt', imageUrl: 'https://shop.example/shirt.jpg',
  sourceUrl: 'https://shop.example/shirt', category: 'top', createdAt: '2026-09-01T00:00:00.000Z',
}
const outfit: Outfit = {
  id: 'weekend', name: 'Weekend', itemIds: [item.id], notes: 'Easy layers', createdAt: '2026-09-02T00:00:00.000Z',
}
let values: Record<string, unknown>

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('outfits dashboard', () => {
  it('opens an outfit, links its pieces, edits it, and deletes it', async () => {
    values = { clothingItems: [item], outfits: [outfit] }
    vi.stubGlobal('chrome', {
      tabs: { query: vi.fn(async () => [{ id: 1 }]), sendMessage: vi.fn(async () => ({})) },
      scripting: { executeScript: vi.fn(async () => []) },
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: values[key] })),
          set: vi.fn(async (next: Record<string, unknown>) => Object.assign(values, next)),
        },
      },
    })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Outfits' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Open Weekend' }))

    expect(screen.getByRole('heading', { name: 'Weekend' })).toBeTruthy()
    const productLink = screen.getByRole('link', { name: /Linen Shirt/ })
    expect(productLink.getAttribute('href')).toBe(item.sourceUrl)
    expect(screen.getByText('Easy layers')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Edit outfit' }))
    const nameInput = screen.getByLabelText('Outfit name')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Coffee run')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('heading', { name: 'Coffee run' })).toBeTruthy()
    expect((values.outfits as Outfit[])[0].name).toBe('Coffee run')

    await userEvent.click(screen.getByRole('button', { name: 'Delete outfit' }))
    expect(await screen.findByText('No outfits saved yet.')).toBeTruthy()
    expect(values.outfits).toEqual([])
  })
})
