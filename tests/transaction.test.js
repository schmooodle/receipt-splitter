import { describe, it, expect } from 'vitest'

// Replicate transaction building logic we'll add to the frontend
function buildTransaction(receiptData, accountId) {
  const subtransactions = Object.entries(
    receiptData.items.reduce((groups, item) => {
      if (!groups[item.categoryId]) groups[item.categoryId] = { amount: 0, category_id: item.categoryId, memo: item.category }
      groups[item.categoryId].amount += item.price
      return groups
    }, {})
  ).map(([_, sub]) => ({
    amount: -Math.round(sub.amount * 1000),
    category_id: sub.category_id,
    memo: sub.memo
  }))

  return {
    account_id: accountId,
    date: receiptData.date,
    amount: -Math.round(receiptData.total * 1000),
    payee_name: receiptData.store,
    memo: 'via Receipt Splitter',
    approved: false,
    subtransactions
  }
}

describe('YNAB transaction building', () => {
  it('converts total to negative milliunits', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 127.43,
      items: [{ name: 'Apples', price: 127.43, category: 'Groceries', categoryId: 'uuid-1' }]
    }
    const result = buildTransaction(receipt, 'account-uuid')
    expect(result.amount).toBe(-127430)
  })

  it('converts subtransaction amounts to negative milliunits', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 127.43,
      items: [{ name: 'Apples', price: 127.43, category: 'Groceries', categoryId: 'uuid-1' }]
    }
    const result = buildTransaction(receipt, 'account-uuid')
    expect(result.subtransactions[0].amount).toBe(-127430)
  })

  it('groups items by category into subtransactions', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 50.00,
      items: [
        { name: 'Apples', price: 20.00, category: 'Groceries', categoryId: 'uuid-1' },
        { name: 'Bread', price: 10.00, category: 'Groceries', categoryId: 'uuid-1' },
        { name: 'Soap', price: 20.00, category: 'Household Supplies', categoryId: 'uuid-2' }
      ]
    }
    const result = buildTransaction(receipt, 'account-uuid')
    expect(result.subtransactions).toHaveLength(2)
  })

  it('sums items in same category into one subtransaction', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 30.00,
      items: [
        { name: 'Apples', price: 20.00, category: 'Groceries', categoryId: 'uuid-1' },
        { name: 'Bread', price: 10.00, category: 'Groceries', categoryId: 'uuid-1' }
      ]
    }
    const result = buildTransaction(receipt, 'account-uuid')
    expect(result.subtransactions[0].amount).toBe(-30000)
  })

  it('sets approved to false', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 10.00,
      items: [{ name: 'Apples', price: 10.00, category: 'Groceries', categoryId: 'uuid-1' }]
    }
    const result = buildTransaction(receipt, 'account-uuid')
    expect(result.approved).toBe(false)
  })

  it('includes via Receipt Splitter memo', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 10.00,
      items: [{ name: 'Apples', price: 10.00, category: 'Groceries', categoryId: 'uuid-1' }]
    }
    const result = buildTransaction(receipt, 'account-uuid')
    expect(result.memo).toBe('via Receipt Splitter')
  })

  it('assigns correct account id', () => {
    const receipt = {
      store: 'Costco', date: '2026-04-09', total: 10.00,
      items: [{ name: 'Apples', price: 10.00, category: 'Groceries', categoryId: 'uuid-1' }]
    }
    const result = buildTransaction(receipt, 'account-uuid-123')
    expect(result.account_id).toBe('account-uuid-123')
  })
})