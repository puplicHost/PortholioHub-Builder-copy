import { describe, it, expect } from 'vitest'
import { validatePasswordPolicy, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/lib/password'

describe('password policy (plan Phase 1 §15)', () => {
  it('rejects short and long passwords', () => {
    expect(validatePasswordPolicy('Ab1!')).not.toBeNull()
    expect(validatePasswordPolicy('x'.repeat(MAX_PASSWORD_LENGTH + 1))).not.toBeNull()
  })

  it('rejects common passwords', () => {
    expect(validatePasswordPolicy('password')).toMatch(/common/)
    expect(validatePasswordPolicy('12345678')).toMatch(/common/)
  })

  it('accepts a strong password', () => {
    expect(validatePasswordPolicy('Test1234!xQ')).toBeNull()
  })

  it('bounds are sane', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
    expect(MAX_PASSWORD_LENGTH).toBe(128)
  })
})
