export interface ContactType {
  key: string
  label: string
  placeholder: string
}

export const EMAIL_LABEL = 'Email'

export const CONTACT_TYPES: ContactType[] = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'website', label: 'الموقع الإلكتروني', placeholder: 'https://...' },
  { key: 'email', label: 'Email', placeholder: 'name@example.com' },
]

export const SOCIAL_TYPES: ContactType[] = CONTACT_TYPES.filter((t) => t.key !== 'email')

export function contactPlaceholder(label: string): string {
  const l = (label || '').trim().toLowerCase()
  const hit = CONTACT_TYPES.find((t) => t.label.toLowerCase() === l)
  return hit?.placeholder ?? 'https://...'
}

export function normalizeContactUrl(link: { label?: string; url?: string }): string {
  const raw = (link.url ?? '').trim()
  if (!raw) return ''
  if (/^\s*(javascript|data|vbscript):/i.test(raw)) return ''
  const label = (link.label ?? '').trim()
  if (label.toLowerCase() === EMAIL_LABEL.toLowerCase()) {
    return /^mailto:/i.test(raw) ? raw : `mailto:${raw}`
  }
  if (/^(mailto|tel|https?):/i.test(raw)) return raw
  return `https://${raw}`
}