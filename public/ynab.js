export const ACCOUNTS = [
  { id: "88528ad4-93eb-494a-b787-4edaa04256e1", name: "Bank of America Card" },
  { id: "bf38ccc2-d06b-442e-8ebb-caa770780535", name: "Amex Card" },
  { id: "fad9f1ec-00e9-4e5a-8f68-4211a0b5d6ff", name: "Chase Card" }
]

export async function fetchCategories() {
  const res = await fetch('/api/ynab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getCategories' })
  })
  const data = await res.json()
  return data.categories
}

export async function postTransaction(transaction) {
  const res = await fetch('/api/ynab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'postTransaction', transaction })
  })
  return res.json()
}

export function getVendorMapping(storeName, mappings) {
  return mappings[normalizeStoreName(storeName)] || null
}

export function saveVendorMapping(storeName, accountId) {
  const mappings = JSON.parse(localStorage.getItem('vendorMappings') || '{}')
  mappings[normalizeStoreName(storeName)] = accountId
  localStorage.setItem('vendorMappings', JSON.stringify(mappings))
}

export function normalizeStoreName(raw) {
  return raw
    .replace(/#\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function buildTransaction(receiptData, accountId, categories) {
  const categoryMap = Object.fromEntries(categories.map(c => [c.name, c.id]))

  const grouped = {}
  for (const item of receiptData.items) {
    const catId = categoryMap[item.category] || null
    if (!grouped[item.category]) {
      grouped[item.category] = { amount: 0, category_id: catId, memo: item.category }
    }
    grouped[item.category].amount += item.price
  }

  const total = -Math.round(receiptData.total * 1000)

let subtransactions = Object.values(grouped).map(sub => ({
  amount: -Math.round(sub.amount * 1000),
  category_id: sub.category_id,
  memo: sub.memo
}))

// Fix rounding drift so subtransactions always sum to total exactly
const subTotal = subtransactions.reduce((s, t) => s + t.amount, 0)
const drift = total - subTotal
if (drift !== 0) subtransactions[0].amount += drift

return {
  account_id: accountId,
  date: receiptData.date || new Date().toISOString().split('T')[0],
  amount: total,
    payee_name: receiptData.store,
    memo: 'via Receipt Splitter',
    approved: false,
    subtransactions
  }
}