import { describe, it, expect } from 'vitest'
import { normalizePhone } from '@/lib/phone'

describe('phone normalization (E.164, default EG)', () => {
  it('normalizes Egyptian formats', () => {
    expect(normalizePhone('01012345678')).toBe('+201012345678')
    expect(normalizePhone('+201012345678')).toBe('+201012345678')
    expect(normalizePhone('00201012345678')).toBe('+201012345678')
  })

  it('rejects invalid input', () => {
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('123')).toBeNull()
    expect(normalizePhone('not-a-phone')).toBeNull()
  })
})
