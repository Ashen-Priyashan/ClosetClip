/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClothingItem } from '../src/types/clothing'
import OutfitBuilder from '../src/components/OutfitBuilder'

const items: ClothingItem[] = [
  { id: 'shirt', name: 'Linen Shirt', imageUrl: 'https://shop.example/shirt.jpg', sourceUrl: 'https://shop.example/shirt', category: 'top', createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'shoes', name: 'Canvas Sneakers', imageUrl: 'https://shop.example/shoes.jpg', sourceUrl: 'https://shop.example/shoes', category: 'shoes', createdAt: '2026-09-02T00:00:00.000Z' },
]
let values: Record<string, unknown>

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('outfit builder', () => {
  it('selects, removes, and saves selected clothing references', async () => {
    values = { clothingItems: items }
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: values[key] })),
          set: vi.fn(async (next: Record<string, unknown>) => Object.assign(values, next)),
        },
      },
    })
    const onSaved = vi.fn()
    render(<OutfitBuilder items={items} onSaved={onSaved} />)

    await userEvent.type(screen.getByLabelText('Outfit name'), 'Easy weekend')
    await userEvent.click(screen.getByRole('button', { name: 'Linen Shirt' }))
    await userEvent.click(screen.getByRole('button', { name: 'Canvas Sneakers' }))
    expect(screen.getByRole('button', { name: 'Linen Shirt' }).getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'Remove Linen Shirt from outfit' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save outfit' }))

    expect((await screen.findByRole('status')).textContent).toBe('Outfit saved.')
    expect(values.outfits).toMatchObject([{ name: 'Easy weekend', itemIds: ['shoes'] }])
    expect(onSaved).toHaveBeenCalledOnce()
  })
})
