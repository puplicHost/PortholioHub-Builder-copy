import { describe, it, expect } from 'vitest'
import { validateUsername, USERNAME_PATTERN } from '@/lib/portfolio'

describe('username policy (plan Phase 5 §24)', () => {
  it('accepts valid usernames', () => {
    for (const u of ['testuser', 'john-doe-99', 'abc', 'ab1', 'x'.repeat(30)]) {
      expect(validateUsername(u), u).toBeNull()
      expect(USERNAME_PATTERN.test(u)).toBe(true)
    }
  })

  it('normalizes case before validating', () => {
    expect(validateUsername('UPPER')).toBeNull()
  })

  it('rejects bad shapes', () => {
    for (const u of ['', 'ab', 'x'.repeat(31), '-lead', 'trail-', 'a--b', 'under_score', 'with space']) {
      expect(validateUsername(u), u).not.toBeNull()
    }
  })

  it('rejects reserved names', () => {
    expect(validateUsername('admin')).toBe('This username is reserved')
    expect(validateUsername('settings')).toBe('This username is reserved')
    // too short to reach the reserved check — still rejected, other message
    expect(validateUsername('u')).not.toBeNull()
  })
})
