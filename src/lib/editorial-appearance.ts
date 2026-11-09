import type { CSSProperties } from 'react'

/** Classic seed values. Matching values are treated as “not customized” so an
 * existing profile does not turn the Editorial palette into Classic blue. */
const CLASSIC_DEFAULTS: Record<string, string> = {
  primaryColor: '#38BDF8',
  accentColor: '#818CF8',
  outlineColor: '#38BDF8',
  bgColorLight: '#F0F9FF',
  cardBackground: '#FFFFFF',
  textColorLight: '#0F172A',
  mutedText: '#54647A',
  borderColor: '#BAE6FD',
  bgColorDark: '#111827',
  cardBackgroundDark: '#374151',
  textColorDark: '#E5E7EB',
  mutedTextDark: '#858688',
  borderColorDark: '#4B5563',
}

function colorOverride(appearance: Record<string, unknown>, key: string, fallback: string): string {
  const value = appearance[key]
  if (typeof value !== 'string' || !value.trim()) return fallback
  return value === CLASSIC_DEFAULTS[key] ? fallback : value
}

function safeFontName(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9 +-]+$/.test(value.trim())) return ''
  const name = value.trim()
  return /^(inter|cairo)$/i.test(name) ? '' : name
}

/** Resolve saved customer appearance into Editorial CSS custom properties.
 * Used by both the portfolio homepage and the project-detail page. */
export function resolveEditorialAppearanceVars(appearance: Record<string, unknown>): CSSProperties {
  const mode = String(appearance.defaultColorMode || appearance.colorMode || '')
  const darkCustom =
    mode.startsWith('dark') &&
    ['bgColorDark', 'cardBackgroundDark', 'textColorDark', 'mutedTextDark', 'borderColorDark']
      .some((key) => typeof appearance[key] === 'string' && appearance[key] !== CLASSIC_DEFAULTS[key])
  const accent = colorOverride(appearance, 'primaryColor', '#6e1e35')
  const accent2 = colorOverride(appearance, 'accentColor', '#6e1e35')
  const bg = darkCustom
    ? colorOverride(appearance, 'bgColorDark', '#221b17')
    : colorOverride(appearance, 'bgColorLight', '#fbf7ee')
  const card = darkCustom
    ? colorOverride(appearance, 'cardBackgroundDark', '#2a2622')
    : colorOverride(appearance, 'cardBackground', '#ffffff')
  const ink = darkCustom
    ? colorOverride(appearance, 'textColorDark', '#fbf7ee')
    : colorOverride(appearance, 'textColorLight', '#2a2622')
  const muted = darkCustom
    ? colorOverride(appearance, 'mutedTextDark', '#c9bfae')
    : colorOverride(appearance, 'mutedText', '#6f6759')
  const line = darkCustom
    ? colorOverride(appearance, 'borderColorDark', '#4a4038')
    : colorOverride(appearance, 'borderColor', '#e7ddc9')
  const customFont = safeFontName(appearance.font)
  return {
    '--emk-accent': accent,
    '--emk-accent-deep': accent2,
    '--emk-accent-soft': `color-mix(in srgb, ${accent} 12%, transparent)`,
    '--emk-bg': bg,
    '--emk-bg-alt': darkCustom ? card : colorOverride(appearance, 'cardBackground', '#f4eddf'),
    '--emk-card': card,
    '--emk-ink': ink,
    '--emk-ink-soft': ink,
    '--emk-ink-muted': muted,
    '--emk-line': line,
    '--emk-line-strong': line,
    '--emk-display': customFont
      ? `"${customFont}", var(--font-playfair), Georgia, "Noto Naskh Arabic", serif`
      : 'var(--font-playfair), Georgia, "Noto Naskh Arabic", serif',
    '--emk-body': customFont
      ? `"${customFont}", var(--font-sans), system-ui, sans-serif`
      : 'var(--font-sans), Inter, system-ui, sans-serif',
  } as CSSProperties
}
