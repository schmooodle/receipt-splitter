import { describe, it, expect } from 'vitest'

// Replicate the category filtering logic from api/ynab.js
function filterCategories(categoryGroups) {
  return categoryGroups
    .filter(g => !g.hidden && !g.deleted && 
      g.name !== "Internal Master Category" && 
      g.name !== "Credit Card Payments")
    .flatMap(g => g.categories
      .filter(c => !c.hidden && !c.deleted)
      .map(c => ({ id: c.id, name: c.name, group: g.name }))
    )
}

describe('YNAB category filtering', () => {
  it('filters out hidden category groups', () => {
    const groups = [
      { name: 'Everyday Expenses', hidden: false, deleted: false, categories: [
        { id: '1', name: 'Groceries', hidden: false, deleted: false }
      ]},
      { name: 'Hidden Group', hidden: true, deleted: false, categories: [
        { id: '2', name: 'Secret', hidden: false, deleted: false }
      ]}
    ]
    const result = filterCategories(groups)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Groceries')
  })

  it('filters out deleted categories', () => {
    const groups = [
      { name: 'Everyday Expenses', hidden: false, deleted: false, categories: [
        { id: '1', name: 'Groceries', hidden: false, deleted: false },
        { id: '2', name: 'Old Category', hidden: false, deleted: true }
      ]}
    ]
    const result = filterCategories(groups)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Groceries')
  })

  it('filters out Internal Master Category group', () => {
    const groups = [
      { name: 'Internal Master Category', hidden: false, deleted: false, categories: [
        { id: '1', name: 'Uncategorized', hidden: false, deleted: false }
      ]},
      { name: 'Everyday Expenses', hidden: false, deleted: false, categories: [
        { id: '2', name: 'Groceries', hidden: false, deleted: false }
      ]}
    ]
    const result = filterCategories(groups)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Groceries')
  })

  it('filters out Credit Card Payments group', () => {
    const groups = [
      { name: 'Credit Card Payments', hidden: false, deleted: false, categories: [
        { id: '1', name: 'Chase Card', hidden: false, deleted: false }
      ]},
      { name: 'Everyday Expenses', hidden: false, deleted: false, categories: [
        { id: '2', name: 'Groceries', hidden: false, deleted: false }
      ]}
    ]
    const result = filterCategories(groups)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Groceries')
  })

  it('includes group name on each category', () => {
    const groups = [
      { name: 'Everyday Expenses', hidden: false, deleted: false, categories: [
        { id: '1', name: 'Groceries', hidden: false, deleted: false }
      ]}
    ]
    const result = filterCategories(groups)
    expect(result[0].group).toBe('Everyday Expenses')
  })
})