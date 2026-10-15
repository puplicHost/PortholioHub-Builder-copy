import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

// Normalize a user-entered phone number to E.164 (e.g. "+201012345678").
// Default region is Egypt (EG) per plan assumption A6. Returns null when invalid.
export function normalizePhone(input: string | null | undefined, defaultCountry = 'EG'): string | null {
  if (!input) return null
  try {
    const parsed = parsePhoneNumberFromString(input.trim(), defaultCountry as 'EG')
    if (!parsed || !parsed.isValid()) return null
    return parsed.number
  } catch {
    return null
  }
}
