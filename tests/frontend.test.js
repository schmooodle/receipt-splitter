import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'

// Replicate category summary logic from index.html
function buildCategorySummary(items) {
  const grouped = {}
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = 0
    grouped[item.category] += item.price
  }
  return Object.entries(grouped).map(([category, total]) => ({
    category,
    total: Math.round(total * 100) / 100
  }))
}

// Replicate account selector logic
function getDefaultAccount(storeName, mappings, accounts) {
  const normalized = storeName.replace(/#\d+/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
  const mappedId = mappings[normalized]
  if (mappedId) return accounts.find(a => a.id === mappedId) || accounts[0]
  return accounts[0]
}

describe('category summary', () => {
  it('sums items by category', () => {
    const items = [
      { name: 'Apples', price: 10.00, category: 'Groceries' },
      { name: 'Bread', price: 5.00, category: 'Groceries' },
      { name: 'Soap', price: 3.00, category: 'Household Supplies' }
    ]
    const result = buildCategorySummary(items)
    const groceries = result.find(r => r.category === 'Groceries')
    expect(groceries.total).toBe(15.00)
  })

  it('handles single item per category', () => {
    const items = [
      { name: 'Apples', price: 10.00, category: 'Groceries' }
    ]
    const result = buildCategorySummary(items)
    expect(result).toHaveLength(1)
    expect(result[0].total).toBe(10.00)
  })

  it('rounds to 2 decimal places', () => {
    const items = [
      { name: 'Item1', price: 1.005, category: 'Groceries' },
      { name: 'Item2', price: 1.005, category: 'Groceries' }
    ]
    const result = buildCategorySummary(items)
    expect(result[0].total).toBe(2.01)
  })

  it('handles multiple categories', () => {
    const items = [
      { name: 'Apples', price: 10.00, category: 'Groceries' },
      { name: 'Soap', price: 3.00, category: 'Household Supplies' },
      { name: 'Shirt', price: 20.00, category: 'Clothes' }
    ]
    const result = buildCategorySummary(items)
    expect(result).toHaveLength(3)
  })
})

describe('account selector', () => {
  const accounts = [
    { id: 'acc-1', name: 'Bank of America Card' },
    { id: 'acc-2', name: 'Amex Card' },
    { id: 'acc-3', name: 'Chase Card' }
  ]

  it('returns first account when no vendor mapping exists', () => {
    const result = getDefaultAccount('Unknown Store', {}, accounts)
    expect(result.id).toBe('acc-1')
  })

  it('returns mapped account for known vendor', () => {
    const mappings = { 'costco': 'acc-2' }
    const result = getDefaultAccount('Costco', mappings, accounts)
    expect(result.id).toBe('acc-2')
  })

  it('is case insensitive for vendor lookup', () => {
    const mappings = { 'costco': 'acc-2' }
    const result = getDefaultAccount('COSTCO', mappings, accounts)
    expect(result.id).toBe('acc-2')
  })

  it('ignores store numbers in vendor lookup', () => {
    const mappings = { 'costco': 'acc-2' }
    const result = getDefaultAccount('Costco #123', mappings, accounts)
    expect(result.id).toBe('acc-2')
  })

  it('falls back to first account if mapped id not found', () => {
    const mappings = { 'costco': 'acc-999' }
    const result = getDefaultAccount('Costco', mappings, accounts)
    expect(result.id).toBe('acc-1')
  })
})