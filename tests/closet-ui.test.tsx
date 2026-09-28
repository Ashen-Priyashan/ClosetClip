/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClothingItem } from '../src/types/clothing'
import App from '../src/popup/App'

const savedItems: ClothingItem[] = [
  { id: 'shirt', name: 'Linen Shirt', imageUrl: 'https://shop.example/shirt.jpg', sourceUrl: 'https://shop.example/shirt', category: 'top', createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'shoes', name: 'Canvas Sneakers', imageUrl: 'https://shop.example/shoes.jpg', sourceUrl: 'https://shop.example/shoes', category: 'shoes', createdAt: '2026-09-02T00:00:00.000Z' },
]

let values: Record<string, unknown>

function installChromeMock() {
  values = { clothingItems: structuredClone(savedItems) }
  vi.stubGlobal('chrome', {
    tabs: { query: vi.fn(async () => [{ id: 1 }]), sendMessage: vi.fn(async () => ({})) },
    scripting: { executeScript: vi.fn(async () => []) },
    storage: {
      local: {
          get: vi.fn(async (key: string | string[]) => Array.isArray(key)
            ? Object.fromEntries(key.map((entry) => [entry, values[entry]]))
            : { [key]: values[key] }),
        set: vi.fn(async (next: Record<string, unknown>) => Object.assign(values, next)),
      },
    },
  })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('My Closet view', () => {
  it('searches and filters clothing, edits an item, and deletes it', async () => {
    installChromeMock()
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'My Closet' }))
    expect(await screen.findByText('Linen Shirt')).toBeTruthy()
    expect(screen.getByText('Canvas Sneakers')).toBeTruthy()

    await userEvent.type(screen.getByPlaceholderText('Search your closet'), 'linen')
    expect(screen.getByText('Linen Shirt')).toBeTruthy()
    expect(screen.queryByText('Canvas Sneakers')).toBeNull()
    await userEvent.clear(screen.getByPlaceholderText('Search your closet'))
    await userEvent.click(screen.getByRole('button', { name: 'Shoes' }))
    expect(screen.getByText('Canvas Sneakers')).toBeTruthy()
    expect(screen.queryByText('Linen Shirt')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Edit Canvas Sneakers' }))
    await userEvent.type(screen.getByLabelText('Notes'), 'Everyday pair')
    await userEvent.click(screen.getByRole('button', { name: 'Save edits' }))
    expect(await screen.findByText('Everyday pair')).toBeTruthy()
    expect((values.clothingItems as ClothingItem[]).find((item) => item.id === 'shoes')?.notes).toBe('Everyday pair')

    await userEvent.click(screen.getByRole('button', { name: 'Delete Canvas Sneakers' }))
    expect(screen.queryByText('Canvas Sneakers')).toBeNull()
    expect(values.clothingItems).toEqual([savedItems[0]])
  })
})
