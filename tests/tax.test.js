import { describe, it, expect } from 'vitest'

// Replicate tax distribution logic from the frontend
function distributeTax(items, subtotal, total) {
  const multiplier = total / subtotal
  return items.map(item => ({
    ...item,
    price: Math.round(item.price * multiplier * 100) / 100
  }))
}

function sumItems(items) {
  return Math.round(items.reduce((sum, item) => sum + item.price, 0) * 100) / 100
}

describe('Tax distribution', () => {
  it('grosses up item prices by tax multiplier', () => {
    const items = [
      { name: 'Shirt', price: 20.00, category: 'Clothes' }
    ]
    const result = distributeTax(items, 20.00, 21.60)
    expect(result[0].price).toBe(21.60)
  })

  it('distributes tax proportionally across multiple items', () => {
    const items = [
      { name: 'Shirt', price: 20.00, category: 'Clothes' },
      { name: 'Pants', price: 40.00, category: 'Clothes' }
    ]
    const result = distributeTax(items, 60.00, 64.80)
    expect(result[0].price).toBe(21.60)
    expect(result[1].price).toBe(43.20)
  })

  it('item prices sum to receipt total after tax distribution', () => {
    const items = [
      { name: 'Apples', price: 3.99, category: 'Groceries' },
      { name: 'Bread', price: 2.49, category: 'Groceries' },
      { name: 'Soap', price: 1.99, category: 'Household Supplies' }
    ]
    const subtotal = 8.47
    const total = 9.15
    const result = distributeTax(items, subtotal, total)
    expect(sumItems(result)).toBe(total)
  })

  it('handles zero tax gracefully', () => {
    const items = [
      { name: 'Groceries', price: 10.00, category: 'Groceries' }
    ]
    const result = distributeTax(items, 10.00, 10.00)
    expect(result[0].price).toBe(10.00)
  })

  it('preserves item name and category after distribution', () => {
    const items = [
      { name: 'Shirt', price: 20.00, category: 'Clothes' }
    ]
    const result = distributeTax(items, 20.00, 21.60)
    expect(result[0].name).toBe('Shirt')
    expect(result[0].category).toBe('Clothes')
  })
})