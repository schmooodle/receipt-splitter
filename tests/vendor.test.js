import { describe, it, expect, beforeEach } from 'vitest'

// Replicate vendor mapping logic we'll add to the frontend
const vendorMappings = {}

function saveVendorMapping(storeName, accountId) {
  const normalized = storeName.trim().toLowerCase()
  vendorMappings[normalized] = accountId
}

function getVendorMapping(storeName) {
  const normalized = storeName.trim().toLowerCase()
  return vendorMappings[normalized] || null
}

function normalizeStoreName(raw) {
  return raw
    .replace(/#\d+/g, '')        // remove store numbers e.g. "Costco #123"
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim()
    .toLowerCase()
}

beforeEach(() => {
  // clear mappings between tests
  Object.keys(vendorMappings).forEach(k => delete vendorMappings[k])
})

describe('Vendor mapping', () => {
  it('saves and retrieves a vendor mapping', () => {
    saveVendorMapping('Costco', 'account-uuid-1')
    expect(getVendorMapping('Costco')).toBe('account-uuid-1')
  })

  it('returns null for unknown vendor', () => {
    expect(getVendorMapping('Unknown Store')).toBeNull()
  })

  it('is case insensitive', () => {
    saveVendorMapping('Costco', 'account-uuid-1')
    expect(getVendorMapping('COSTCO')).toBe('account-uuid-1')
    expect(getVendorMapping('costco')).toBe('account-uuid-1')
  })

  it('trims whitespace from store name', () => {
    saveVendorMapping('  Costco  ', 'account-uuid-1')
    expect(getVendorMapping('Costco')).toBe('account-uuid-1')
  })

  it('overwrites existing mapping for same vendor', () => {
    saveVendorMapping('Costco', 'account-uuid-1')
    saveVendorMapping('Costco', 'account-uuid-2')
    expect(getVendorMapping('Costco')).toBe('account-uuid-2')
  })

  it('normalizes store numbers out of name', () => {
    expect(normalizeStoreName('Costco #123')).toBe('costco')
    expect(normalizeStoreName('Costco Whse #456')).toBe('costco whse')
  })

  it('normalizes extra whitespace', () => {
    expect(normalizeStoreName('Trader  Joes')).toBe('trader joes')
  })

  it('treats normalized variants as same vendor', () => {
    saveVendorMapping(normalizeStoreName('Costco #123'), 'account-uuid-1')
    expect(getVendorMapping(normalizeStoreName('Costco #456'))).toBe('account-uuid-1')
  })
})