import { describe, it, expect, beforeEach } from 'vitest'

// Replicate logic from public/ynab.js
function normalizeStoreName(raw) {
  return raw
    .replace(/#\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function getVendorMapping(storeName, mappings) {
  return mappings[normalizeStoreName(storeName)] || null
}

function saveVendorMapping(storeName, accountId, mappings) {
  mappings[normalizeStoreName(storeName)] = accountId
  return mappings
}

function buildTransaction(receiptData, accountId, categories) {
  const categoryMap = Object.fromEntries(categories.map(c => [c.name, c.id]))

  const grouped = {}
  for (const item of receiptData.items) {
    const catId = categoryMap[item.category] || null
    if (!grouped[item.category]) {
      grouped[item.category] = { amount: 0, category_id: catId, memo: item.category }
    }
    grouped[item.category].amount += item.price
  }

  const subtransactions = Object.values(grouped).map(sub => ({
    amount: -Math.round(sub.amount * 1000),
    category_id: sub.category_id,
    memo: sub.memo
  }))

  return {
    account_id: accountId,
    date: receiptData.date || new Date().toISOString().split('T')[0],
    amount: -Math.round(receiptData.total * 1000),
    payee_name: receiptData.store,
    memo: 'via Receipt Splitter',
    approved: false,
    subtransactions
  }
}

describe('normalizeStoreName', () => {
  it('lowercases the name', () => {
    expect(normalizeStoreName('Costco')).toBe('costco')
  })

  it('removes store numbers', () => {
    expect(normalizeStoreName('Costco #123')).toBe('costco')
  })

  it('collapses extra whitespace', () => {
    expect(normalizeStoreName('Trader  Joes')).toBe('trader joes')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalizeStoreName('  Costco  ')).toBe('costco')
  })
})

describe('vendor mapping', () => {
  let mappings

  beforeEach(() => {
    mappings = {}
  })

  it('saves and retrieves a mapping', () => {
    mappings = saveVendorMapping('Costco', 'account-1', mappings)
    expect(getVendorMapping('Costco', mappings)).toBe('account-1')
  })

  it('returns null for unknown vendor', () => {
    expect(getVendorMapping('Unknown', mappings)).toBeNull()
  })

  it('is case insensitive', () => {
    mappings = saveVendorMapping('Costco', 'account-1', mappings)
    expect(getVendorMapping('COSTCO', mappings)).toBe('account-1')
  })

  it('overwrites existing mapping', () => {
    mappings = saveVendorMapping('Costco', 'account-1', mappings)
    mappings = saveVendorMapping('Costco', 'account-2', mappings)
    expect(getVendorMapping('Costco', mappings)).toBe('account-2')
  })
})

describe('buildTransaction', () => {
  const categories = [
    { id: 'cat-1', name: 'Groceries' },
    { id: 'cat-2', name: 'Household Supplies' }
  ]

  it('sets correct total in milliunits', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 50.00,
      items: [{ name: 'Apples', price: 50.00, category: 'Groceries' }]
    }
    const result = buildTransaction(receipt, 'account-1', categories)
    expect(result.amount).toBe(-50000)
  })

  it('sets account_id correctly', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 50.00,
      items: [{ name: 'Apples', price: 50.00, category: 'Groceries' }]
    }
    const result = buildTransaction(receipt, 'account-1', categories)
    expect(result.account_id).toBe('account-1')
  })

  it('maps category names to IDs', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 50.00,
      items: [{ name: 'Apples', price: 50.00, category: 'Groceries' }]
    }
    const result = buildTransaction(receipt, 'account-1', categories)
    expect(result.subtransactions[0].category_id).toBe('cat-1')
  })

  it('groups items by category', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 50.00,
      items: [
        { name: 'Apples', price: 20.00, category: 'Groceries' },
        { name: 'Bread', price: 10.00, category: 'Groceries' },
        { name: 'Soap', price: 20.00, category: 'Household Supplies' }
      ]
    }
    const result = buildTransaction(receipt, 'account-1', categories)
    expect(result.subtransactions).toHaveLength(2)
  })

  it('uses today as date if receipt has none', () => {
    const receipt = {
      store: 'Costco', date: null, total: 50.00,
      items: [{ name: 'Apples', price: 50.00, category: 'Groceries' }]
    }
    const result = buildTransaction(receipt, 'account-1', categories)
    expect(result.date).toBe(new Date().toISOString().split('T')[0])
  })

  it('sets approved to false', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 50.00,
      items: [{ name: 'Apples', price: 50.00, category: 'Groceries' }]
    }
    const result = buildTransaction(receipt, 'account-1', categories)
    expect(result.approved).toBe(false)
  })

  it('includes via Receipt Splitter memo', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 10.00,
      items: [{ name: 'Apples', price: 10.00, category: 'Groceries', categoryId: 'uuid-1' }]
    }
    const result = buildTransaction(receipt, 'account-1', categories)
    expect(result.memo).toBe('via Receipt Splitter')
  })

  it('subtransaction amounts always sum to total exactly', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 215.42,
      items: [
        { name: 'Apples', price: 195.19, category: 'Groceries' },
        { name: 'Hoto Wand', price: 20.23, category: 'House Projects' }
      ]
    }
    const result = buildTransaction(receipt, 'account-1', categories)
    const subSum = result.subtransactions.reduce((s, t) => s + t.amount, 0)
    expect(subSum).toBe(result.amount)
  })
})