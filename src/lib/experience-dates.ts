// Shared experience-date helpers used by both the builder and the public
// template. Stored values are `YYYY-MM`; legacy rows may contain free text
// (e.g. "Jan 2020", "2020", "01/2020"). Legacy text is never rewritten until
// the owner explicitly edits the field.

export type ExperienceLang = 'ar' | 'en'

export const EXPERIENCE_MONTHS: Record<ExperienceLang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
}

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
  يناير: 1,
  فبراير: 2,
  مارس: 3,
  أبريل: 4,
  ابريل: 4,
  مايو: 5,
  يونيو: 6,
  يوليو: 7,
  أغسطس: 8,
  اغسطس: 8,
  سبتمبر: 9,
  أكتوبر: 10,
  اكتوبر: 10,
  نوفمبر: 11,
  ديسمبر: 12,
}

/** True when the value is the canonical stored shape `YYYY-MM`. */
export function isStoredMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

/** True when a non-empty legacy value should keep rendering as-is. */
export function isLegacyExperienceDate(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && !isStoredMonth(value)
}

/** Best-effort conversion of a legacy date string to `YYYY-MM`. */
export function parseLegacyExperienceDate(value: unknown): string {
  if (typeof value !== 'string') return ''
  const raw = value.trim()
  if (!raw) return ''
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return raw

  // 2020-01 / 2020-1
  let match = raw.match(/^(\d{4})[-/.](\d{1,2})$/)
  if (match) {
    const month = Number(match[2])
    if (month >= 1 && month <= 12) return `${match[1]}-${String(month).padStart(2, '0')}`
  }

  // 01/2020
  match = raw.match(/^(\d{1,2})[-/.](\d{4})$/)
  if (match) {
    const month = Number(match[1])
    if (month >= 1 && month <= 12) return `${match[2]}-${String(month).padStart(2, '0')}`
  }

  // January 2020 / Jan 2020 / يناير 2020
  match = raw.match(/^([A-Za-z\u0600-\u06FF]+)\s+(\d{4})$/)
  if (match) {
    const month = MONTH_INDEX[match[1].toLowerCase()]
    if (month) return `${match[2]}-${String(month).padStart(2, '0')}`
  }

  // 2020
  match = raw.match(/^(\d{4})$/)
  if (match) return `${match[1]}-01`

  return ''
}

/** Localized label for a stored month value; legacy text passes through. */
export function formatExperienceDate(value: unknown, lang: ExperienceLang): string {
  if (typeof value !== 'string' || value.trim() === '') return ''
  if (!isStoredMonth(value)) return value
  const [year, month] = value.split('-')
  const index = Number(month) - 1
  const label = EXPERIENCE_MONTHS[lang][index]
  return label ? `${label} ${year}` : value
}

/** Localized "Present" label. */
export function presentLabel(lang: ExperienceLang): string {
  return lang === 'ar' ? 'حتى الآن' : 'Present'
}

/** Full range label: `Jan 2023 – Present` / `يناير 2023 – حتى الآن`. */
export function formatExperienceRange(
  start: unknown,
  end: unknown,
  isCurrent: boolean,
  lang: ExperienceLang,
): string {
  const startLabel = formatExperienceDate(start, lang)
  if (!startLabel) return ''
  const endLabel = isCurrent ? presentLabel(lang) : formatExperienceDate(end, lang)
  return endLabel ? `${startLabel} – ${endLabel}` : startLabel
}

/** Compares two canonical stored months. Returns null when not comparable. */
export function compareStoredMonths(start: unknown, end: unknown): number | null {
  if (!isStoredMonth(start) || !isStoredMonth(end)) return null
  return start.localeCompare(end)
}

/** Localized inline validation message, or null when the range is valid. */
export function experienceDateError(
  item: { startDate?: unknown; endDate?: unknown; isCurrent?: unknown; current?: unknown },
  lang: ExperienceLang,
): string | null {
  const isCurrent = Boolean(item?.isCurrent ?? item?.current)
  if (isCurrent) return null
  const compared = compareStoredMonths(item?.startDate, item?.endDate)
  if (compared !== null && compared > 0) {
    return lang === 'ar' ? 'تاريخ النهاية لا يمكن أن يسبق تاريخ البداية.' : 'End date cannot be before start date.'
  }
  return null
}

/** Month options for the builder selects. */
export function monthOptions(lang: ExperienceLang): { value: string; label: string }[] {
  return EXPERIENCE_MONTHS[lang].map((label, index) => ({
    value: String(index + 1).padStart(2, '0'),
    label,
  }))
}

/** Formats a duration in months into localized human-readable text. */
export function formatDuration(months: number, lang: ExperienceLang): string {
  if (months <= 0) {
    return lang === 'ar' ? 'أقل من شهر' : 'Less than a month'
  }

  const yrs = Math.floor(months / 12)
  const mos = months % 12

  if (lang === 'ar') {
    let yearText = ''
    if (yrs === 1) yearText = 'سنة'
    else if (yrs === 2) yearText = 'سنتان'
    else if (yrs >= 3 && yrs <= 10) yearText = `${yrs} سنوات`
    else if (yrs >= 11) yearText = `${yrs} سنة`

    let monthText = ''
    if (mos === 1) monthText = 'شهر'
    else if (mos === 2) monthText = 'شهران'
    else if (mos >= 3 && mos <= 10) monthText = `${mos} أشهر`
    else if (mos >= 11) monthText = `${mos} شهراً`

    if (yearText && monthText) return `${yearText} و${monthText}`
    if (yearText) return yearText
    return monthText || 'أقل من شهر'
  }

  const yearText = yrs > 0 ? (yrs === 1 ? '1 yr' : `${yrs} yrs`) : ''
  const monthText = mos > 0 ? (mos === 1 ? '1 mo' : `${mos} mos`) : ''

  if (yearText && monthText) return `${yearText} ${monthText}`
  if (yearText) return yearText
  return monthText || 'Less than a month'
}

/** Calculates and formats experience duration from start/end stored months. */
export function calcExperienceDuration(
  start: unknown,
  end: unknown,
  isCurrent: boolean,
  lang: ExperienceLang,
): string {
  if (!isStoredMonth(start)) return ''
  const startDate = new Date(start + '-01')
  const endDate = isCurrent ? new Date() : isStoredMonth(end) ? new Date(end + '-01') : null
  if (!endDate) return ''
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())
  return formatDuration(months, lang)
}

/** Current year down to 1980, newest first. */
export function experienceYearOptions(currentYear = new Date().getFullYear()): string[] {
  const years: string[] = []
  for (let year = Math.max(1980, currentYear); year >= 1980; year--) {
    years.push(String(year))
  }
  return years
}
