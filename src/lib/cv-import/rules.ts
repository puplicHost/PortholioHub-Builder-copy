/**
 * Shared classification rules for CV import.
 *
 * PortfolioHub's profile schema (see `src/lib/portfolio-schema.ts`):
 * - Skills      → `skills` section content: groups of skill names.
 * - Experience  → `experience` section content: items with jobTitle / companyName /
 *                 location / startDate / endDate / description.
 * - Education   → `education` section content: items with title / institution /
 *                 date / description.
 * - Bio/summary → `localized.bio` + `about` section biography (prose only).
 * - Projects    → `ProjectPage` rows (title / description / items / tags) plus
 *                 `projects` section groups. The CV importer does not create
 *                 project pages, so project entries are never mapped onto
 *                 experience or skills.
 *
 * These rules are used by BOTH the local fallback extractor and the server-side
 * guard applied to AI output, so the two paths classify identically.
 */

import { collapseWhitespace } from './normalize'

/** Entry titles that describe a project rather than a work engagement. */
const PROJECT_TITLE_PATTERNS: RegExp[] = [
  /^(?:project|projects)\s*[:\-–—]/i,
  /^(?:side|personal|portfolio|capstone|thesis|final year|academic|research)\s+projects?\b/i,
  /\bprojects?$/i,
  /^(?:مشروع|مشاريع)\s*[:\-–—]/u,
  /^(?:مشروع|مشاريع)(?:\s|$)/u,
]

/** Words that show a line describes employment, a contract, or a freelance engagement. */
const EMPLOYMENT_CUE_PATTERNS: RegExp[] = [
  /\b(?:at|@)\s+\S+/i,
  /\b(?:company|client|employer|contractor|agency|freelance|internship|intern)\s*[:\-–—]/i,
  /\bfreelance\b/i,
  /\bworked for\b/i,
  /\bemployed by\b/i,
  /\bcontract(?:or)?\b/i,
  /\bworked with\b/i,
  /(?:شركة|عميل|جهة|عمل حر|مستقل)\s*[:\-–—]/u,
  /\s+لدى\s+/u,
]

/** Words that identify an education entry in either language. */
const EDUCATION_KEYWORD_PATTERNS: RegExp[] = [
  /\b(?:bachelor|master|mba|ph\.?d|doctorate|b\.?sc|m\.?sc|b\.?a|m\.?a|b\.?com|diploma|certificate|degree|licen[cs]e|university|college|school|academy|polytechnic|faculty|studies)\b/i,
  /(?:بكالوريوس|ماجستير|دكتوراه|بكالوريوس|دبلوم|شهادة|جامعة|كلية|معهد|مدرسة|أكاديمية|دراسات)/u,
]

export function isProjectLikeTitle(title: string): boolean {
  const value = (title || '').trim()
  if (!value) return false
  return PROJECT_TITLE_PATTERNS.some((pattern) => pattern.test(value))
}

export function hasEmploymentCue(text: string): boolean {
  const value = (text || '')
  if (!value.trim()) return false
  return EMPLOYMENT_CUE_PATTERNS.some((pattern) => pattern.test(value))
}

export interface EmploymentContext {
  /** Role/title as written in the CV. */
  title: string
  /** Employer/client as written in the CV (may be empty). */
  employer?: string | null
  /** The CV lines that belong to this entry. */
  text: string
}

/**
 * A work engagement needs explicit evidence: a stated period, an explicit
 * employer/client cue, or an employer named inside the entry itself.
 * Entries without any of those are ambiguous (they are often projects) and
 * are omitted instead of being guessed.
 */
export function hasEmploymentEvidence(
  dates: { startDate?: string | null; endDate?: string | null },
  context: EmploymentContext,
): boolean {
  if ((dates.startDate || '').trim() || (dates.endDate || '').trim()) return true

  const title = collapseWhitespace(context.title || '').toLowerCase()
  const employer = collapseWhitespace(context.employer || '').toLowerCase()
  const lines = (context.text || '')
    .split('\n')
    .map((line) => collapseWhitespace(line).toLowerCase())
    .filter(Boolean)

  for (const line of lines) {
    if (hasEmploymentCue(line)) return true
  }

  if (!title || !employer) return false
  const hasTitle = lines.some((line) => line.includes(title))
  const hasEmployer = lines.some((line) => line.includes(employer))
  return hasTitle && hasEmployer
}

export function isEducationLikeEntry(title: string, institution: string): boolean {
  const values = `${title || ''} ${institution || ''}`
  if (!values.trim()) return false
  return EDUCATION_KEYWORD_PATTERNS.some((pattern) => pattern.test(values))
}

/**
 * A skill token is a short name (not a sentence). Anything that reads as a
 * duty, achievement, description or project statement is rejected.
 */
export function isSkillLikeToken(value: string): boolean {
  const token = (value || '').trim()
  if (!token || token.length > 60) return false
  const words = token.split(/\s+/).filter(Boolean)
  if (words.length > 6) return false
  if (words.length > 2 && /[.!?،؛]$/.test(token)) return false
  if (/\b(?:developed|managed|led|built|designed|responsible|worked|delivered|improved|increased|created|owned|drove|achieved|launched|maintained|supported|analyzed|coordinated)\b/i.test(token)) {
    return false
  }
  return true
}
