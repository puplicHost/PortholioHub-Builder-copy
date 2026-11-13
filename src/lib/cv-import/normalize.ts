import type { CvDetectedLanguage } from './types'

export const MAX_CV_TEXT_CHARS = 120_000

const ARABIC_LETTER = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u
const LATIN_LETTER = /[A-Za-z\u00C0-\u024F]/u

/**
 * Normalize CV text without changing its meaning. Control characters other
 * than line breaks are removed so parser output and browser rendering cannot
 * be confused by hidden bidi/zero-width/control characters.
 */
export function normalizeCvText(raw: string): { text: string; truncated: boolean } {
  if (!raw) return { text: '', truncated: false }

  let text = raw
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    // NUL, ASCII control characters except tab/newline.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Zero-width and bidi control characters add nothing to a profile.
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')

  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const truncated = text.length > MAX_CV_TEXT_CHARS
  if (truncated) text = text.slice(0, MAX_CV_TEXT_CHARS).trimEnd()
  return { text, truncated }
}

export function countLetters(value: string): { arabic: number; latin: number } {
  let arabic = 0
  let latin = 0
  for (const char of value) {
    if (ARABIC_LETTER.test(char)) arabic += 1
    else if (LATIN_LETTER.test(char)) latin += 1
  }
  return { arabic, latin }
}

export function detectCvLanguage(value: string): CvDetectedLanguage {
  const { arabic, latin } = countLetters(value)
  const total = arabic + latin
  if (total === 0) return 'unknown'
  const arabicRatio = arabic / total
  if (arabicRatio >= 0.6) return 'ar'
  if (arabicRatio <= 0.15) return 'en'
  return 'mixed'
}

export function detectTextLanguage(value: string, fallback: CvDetectedLanguage): 'en' | 'ar' {
  const detected = detectCvLanguage(value)
  if (detected === 'en' || detected === 'ar') return detected
  return fallback === 'ar' ? 'ar' : 'en'
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export const SENSITIVE_LABEL_RE = /^(?:date of birth|dob|birth date|birthday|nationality|gender|sex|marital status|religion|health|disability|تاريخ الميلاد|الجنسية|النوع|الجنس|الحالة الاجتماعية|الديانة|الصحة|الإعاقة)\s*[:\-]/i

/** Drop lines that explicitly carry sensitive attributes we never import. */
export function stripSensitiveText(value: string): string {
  return value
    .split('\n')
    .filter((line) => !SENSITIVE_LABEL_RE.test(line.trim()))
    .join('\n')
    .trim()
}

export function stripBullet(value: string): string {
  return value.replace(/^\s*(?:[-*•·▪◦●○–—]|\d+[.)])\s*/, '').trim()
}
