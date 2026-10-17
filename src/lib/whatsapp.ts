// WhatsApp deep-links (plan Phase 2/3). Numbers are digits-only;
// message text is encodeURIComponent-encoded. Empty platform number
// disables the buttons (callers hide them on null).
//
// This module is imported by client components (builder, landing, portfolio
// templates), so it must stay free of server-only imports — the settings
// lookup is loaded lazily inside getPlatformWhatsapp().

export function digitsOnly(input: string): string {
  return (input || '').replace(/[^0-9]/g, '')
}

// Convert a user-entered number into the international digits wa.me expects.
// wa.me rejects national trunk prefixes, and the platform stores the local
// Egyptian format, so:
//   01098453187      → 201098453187
//   +20 109 845 3187 → 201098453187
//   00201098453187   → 201098453187
//   201098453187     → 201098453187  (already international)
// Returns '' for values that cannot be a phone number (< 8 digits).
export function normalizeWhatsappNumber(input: string | null | undefined): string {
  let digits = digitsOnly(input || '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `20${digits.slice(1)}`
  return digits.length >= 8 ? digits : ''
}

export function buildWhatsappUrl(number: string, text: string): string | null {
  const digits = normalizeWhatsappNumber(number)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export const DEFAULT_UPGRADE_MESSAGE = 'مرحباً، أريد الاستفسار عن الاشتراك في PortfolioHub'

// Canonical upgrade/contact link used by every upgrade touchpoint in the
// builder (banner, locked-section toasts, CTAs). Returns null when no
// platform number is configured so callers can hide the button.
export function getWhatsAppLink(phone: string, message: string = DEFAULT_UPGRADE_MESSAGE): string | null {
  return buildWhatsappUrl(phone, message)
}

export async function getPlatformWhatsapp(): Promise<string> {
  const { getSetting } = await import('@/lib/settings')
  const value = await getSetting('contact.whatsapp').catch(() => '')
  return typeof value === 'string' ? value : ''
}

// "Name <phone> requests PLAN (code ABC123)" style message for the
// subscription-request flow (Phase 3 §27).
export function buildSubscriptionRequestMessage(input: {
  displayName: string
  phone: string
  planName: string
  code: string
}): string {
  return `${input.displayName} (${input.phone}) requests subscription: ${input.planName} — code ${input.code}`
}
