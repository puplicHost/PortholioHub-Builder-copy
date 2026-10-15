import { COMMON_PASSWORDS } from './common-passwords'

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

// Returns a human-readable problem, or null when the password is acceptable.
export function validatePasswordPolicy(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`
  }
  if (COMMON_PASSWORDS.has(password.trim().toLowerCase())) {
    return 'This password is too common, choose another one'
  }
  return null
}
