// Portfolio language resolution (Round 3, item 8).
//
// History: older builder saves wrote the portfolio language under
// `appearance.defaultLanguage`; newer code writes/reads `appearance.n`.
// Both keys can exist in stored JSON (appearance is a loose catch-all), so
// every reader must agree on one resolution order to avoid the two keys
// drifting apart (e.g. a language switch that only updates one of them).
//
// Canonical key: `n`. Legacy fallback: `defaultLanguage`. No migration is
// performed — absent/unknown values resolve to `'en'` (the previous default).

export type PortfolioLang = 'ar' | 'en' | 'both'

/** Reads the portfolio language from an `appearance` object, tolerating both keys. */
export function getPortfolioLang(appearance: unknown): PortfolioLang {
  const a = (appearance ?? {}) as Record<string, unknown>
  const value = a['n'] ?? a['defaultLanguage']
  return value === 'ar' || value === 'en' || value === 'both' ? value : 'en'
}

/** A user-content value that may be `{ar,en}`, a single string, or empty. */
export type LocalizedValue =
  | { ar?: string | null; en?: string | null }
  | string
  | null
  | undefined

/**
 * Resolves a `{ar,en}` (or flat string) user-content value for the visitor's
 * language, falling back to the OTHER language when the requested one is empty
 * (Round 3, item 8). Empty when both are empty — callers then render their
 * built-in placeholder/default.
 */
export function pickLang(value: LocalizedValue, lang: 'ar' | 'en'): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  const other: 'ar' | 'en' = lang === 'ar' ? 'en' : 'ar'
  return (value[lang] || value[other] || '').toString()
}

