const PRODUCTION_URL = 'https://portfolio-hub.online'

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_URL
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_URL
}

export function getSafeRedirect(target: string | null | undefined, fallback: string): string {
  if (!target) return fallback
  if (!target.startsWith('/')) return fallback
  if (target.startsWith('//')) return fallback
  return target
}

// Sanitizes a user-supplied URL for use in href/src.
// - Allows http/https/mailto/tel and site-relative paths (`/…`) and anchors (`#…`).
// - Rejects dangerous schemes (javascript:, data:, vbscript:, file:, …) with ''.
// - Normalizes legacy bare domains (`example.com` → `https://example.com`).
// Returns '' when there is nothing safe to render.
export function sanitizeUrl(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const s = raw.trim()
  if (!s) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    return /^(https?:|mailto:|tel:)/i.test(s) ? s : ''
  }
  if (s.startsWith('/') || s.startsWith('#')) return s
  return `https://${s}`
}
