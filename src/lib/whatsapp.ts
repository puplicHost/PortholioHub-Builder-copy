import { getSetting } from '@/lib/settings'

// WhatsApp deep-links (plan Phase 2/3). Numbers are digits-only;
// message text is encodeURIComponent-encoded. Empty platform number
// disables the buttons (callers hide them on null).
export function digitsOnly(input: string): string {
  return (input || '').replace(/[^0-9]/g, '')
}

export function buildWhatsappUrl(number: string, text: string): string | null {
  const digits = digitsOnly(number)
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
