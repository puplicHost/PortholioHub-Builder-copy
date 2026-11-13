import {
  collapseWhitespace,
  detectCvLanguage,
  detectTextLanguage,
  SENSITIVE_LABEL_RE,
  stripBullet,
  stripSensitiveText,
} from './normalize'
import {
  hasEmploymentEvidence,
  isEducationLikeEntry,
  isProjectLikeTitle,
  isSkillLikeToken,
} from './rules'
import {
  GENERAL_SKILL_GROUP_AR,
  GENERAL_SKILL_GROUP_EN,
  MAX_SKILL_GROUPS,
  MAX_SKILLS_PER_GROUP,
  MAX_TOTAL_SKILLS,
} from './types'
import type {
  CvDetectedLanguage,
  CvEducationSuggestion,
  CvExperienceSuggestion,
  CvScalarSuggestion,
  CvSkillGroupSuggestion,
  CvSuggestions,
  CvWarningCode,
} from './types'

export type SectionType = 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'other'

/**
 * Sections that hold real CV content. A heading-looking line inside one of
 * them is content (for example "Tools: React, Node" inside a project), never
 * a new section — otherwise content leaks between sections.
 */
const SECTION_CONTENT_TYPES: SectionType[] = ['summary', 'experience', 'education', 'projects']

interface SectionBlock {
  type: SectionType
  lines: string[]
  groupLabel?: string
}

const MONTHS = [
  'jan(?:uary)?',
  'feb(?:ruary)?',
  'mar(?:ch)?',
  'apr(?:il)?',
  'may',
  'jun(?:e)?',
  'jul(?:y)?',
  'aug(?:ust)?',
  'sep(?:t(?:ember)?)?',
  'oct(?:ober)?',
  'nov(?:ember)?',
  'dec(?:ember)?',
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'ابريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'اغسطس',
  'سبتمبر',
  'أكتوبر',
  'اكتوبر',
  'نوفمبر',
  'ديسمبر',
].join('|')

const DATE_TOKEN = `(?:(?:${MONTHS})\\.?\\s+\\d{4}|\\d{4}[-/.](?:0?[1-9]|1[0-2])|(?:0?[1-9]|1[0-2])[/.-]\\d{4}|\\d{4})`
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:-|–|—|to|until|through|حتى|إلى)\\s*(present|current|now|(?:${MONTHS})\\.?\\s+\\d{4}|\\d{4}[-/.](?:0?[1-9]|1[0-2])|(?:0?[1-9]|1[0-2])[/.-]\\d{4}|\\d{4}|حتى الآن|الحالي|الآن)`,
  'i',
)
const SINGLE_DATE_RE = new RegExp(DATE_TOKEN, 'i')
const CURRENT_WORDS = /^(?:present|current|now|حتى الآن|الحالي|الآن)$/i
const MAX_EXPERIENCE = 30
const MAX_EDUCATION = 30

const HEADINGS: Record<SectionType, RegExp[]> = {
  header: [],
  summary: [
    /^(?:professional\s+)?summary$/,
    /^(?:career\s+)?(?:profile|objective)$/,
    /^professional profile$/,
    /^about(?:\s+me)?$/,
    /^(?:الملخص|الملف الشخصي|نبذة عني|الهدف الوظيفي|الهدف المهني)$/,
  ],
  experience: [
    /^(?:work|professional|employment|career)?\s*(?:experience|history)$/,
    /^employment$/,
    /^(?:الخبرة|الخبرات|الخبرة العملية|السجل الوظيفي)$/,
  ],
  education: [
    /^(?:education|academic background|education and training|qualifications|academic qualifications)$/,
    /^(?:التعليم|المؤهلات|المؤهلات العلمية|التحصيل الدراسي)$/,
  ],
  skills: [
    /^(?:technical|professional|core|key|soft)\s*skills$/,
    /^(?:core\s+)?(?:skills|competencies)$/,
    /^(?:technical|professional)\s+expertise$/,
    /^(?:expertise|areas of expertise)$/,
    /^(?:skills|expertise)(?:\s*(?:&|and)\s*(?:expertise|skills))?$/,
    /^(?:المهارات|المهارات التقنية|المهارات الشخصية|المهارات المهنية|المهارات والكفاءات|الكفاءات|مجالات الخبرة)$/,
  ],
  projects: [
    /^(?:selected\s+|personal\s+|academic\s+|key\s+)?projects?$/,
    /^portfolio projects?$/,
    /^(?:المشاريع|مشاريع مختارة)$/,
  ],
  other: [
    /^(?:certifications?|licenses?|courses?|training|awards?|honors?|volunteer|activities|interests?|references?|publications?|portfolio)$/,
    /^(?:الشهادات|الدورات|التدريب|الجوائز|التطوع|الأنشطة|الاهتمامات|المراجع|المنشورات|أعمال)$/,
  ],
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_RE = /(?:\+\d[\d\s().-]{7,}\d|\b0\d{8,14}\b|\b\d{3}[-.]\d{3}[-.]\d{4}\b)/
const URL_RE = /(?:https?:\/\/|www\.)\S+/i
const CONTACT_LABEL_RE = /^(?:e-?mail|phone|mobile|tel|whatsapp|linkedin|github|website|portfolio|address|email|الهاتف|الجوال|البريد|بريد|هاتف|موبايل|العنوان)\s*[:\-]/i

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Suggestions are plain text. Strip tag-shaped content and angle brackets so
 * a malicious CV cannot put markup into a suggestion that is later rendered or
 * persisted. Newlines are preserved only for the bio field.
 */
function cleanPlain(value: string, keepNewlines = false): string {
  const cleaned = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, ' ')
  if (!keepNewlines) return collapseWhitespace(cleaned)
  return cleaned
    .split('\n')
    .map((line) => collapseWhitespace(line))
    .filter(Boolean)
    .join('\n')
    .trim()
}

function fitText(
  value: string,
  max: number,
  keepNewlines = false,
): { text: string; omitted: boolean } {
  const text = cleanPlain(value, keepNewlines)
  return text.length > max ? { text: '', omitted: true } : { text, omitted: false }
}

function cleanHeadingLine(line: string): string {
  return line
    .replace(/^\s*#{1,6}\s*/, '')
    .replace(/^\s*(?:[-*•·▪◦●○])\s*/, '')
    .trim()
    .replace(/[:\s]+$/, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

const GENERIC_SKILL_HEADING_RE = /^(?:skills?|expertise|areas of expertise|general|general skills|other|other skills|skills?\s*(?:&|and)\s*(?:skills?|expertise)|competencies|المهارات|المهارات والخبرات|المهارات والكفاءات|الكفاءات|مهارات عامة|المهارات العامة|مهارات أخرى|المهارات الأخرى)$/i

const SKILL_GROUP_HEADING_RES: RegExp[] = [
  /^(?:technical|professional|core|soft|marketing|design|business|data|analytics|development|programming|cloud|devops|creative|general|other)\s+(?:skills|expertise|competencies)$/i,
  /^(?:technical|core|soft|tools?|technologies|frameworks?|platforms?|software|languages?|methodologies)$/i,
  /^(?:tools?|technologies|frameworks?|platforms?|software|languages?|methodologies)(?:\s*(?:&|and)\s*(?:tools?|technologies|frameworks?|platforms?|software|languages?))?$/i,
  /^(?:tools?|technologies|frameworks?|platforms?|software|languages?|methodologies)\s+(?:skills|tools|technologies)$/i,
  /^(?:programming|technical|spoken|foreign|human)\s+languages?$/i,
  /^(?:المهارات|المهارات التقنية|المهارات الشخصية|المهارات المهنية|المهارات والكفاءات|المهارات والخبرات|الكفاءات|مهارات عامة|المهارات العامة|مهارات أخرى|المهارات الأخرى|أدوات|الأدوات|التقنيات|اللغات|لغات البرمجة|إطارات العمل|المنصات)$/i,
]

function isSkillGroupHeading(value: string): boolean {
  const cleaned = cleanHeadingLine(value)
  return SKILL_GROUP_HEADING_RES.some((pattern) => pattern.test(cleaned))
}

function isGenericSkillHeading(value: string): boolean {
  return GENERIC_SKILL_HEADING_RE.test(cleanHeadingLine(value))
}

/** Section-level skill headings (Skills, Technical Skills, Core Competencies…). */
function isSkillSectionHeading(value: string): boolean {
  const cleaned = cleanHeadingLine(value)
  if (HEADINGS.skills.some((pattern) => pattern.test(cleaned))) return true
  return isGenericSkillHeading(cleaned)
}

/**
 * Labels that introduce a list of skills (Tools, Languages, Marketing Skills…).
 * These are category labels, never sections on their own, so a "Tools:" line
 * inside a project or a job description can never turn into Skills.
 */
function isSkillCategoryLabel(value: string): boolean {
  return isSkillGroupHeading(value)
}

/** Section labels that must never become skill groups (Projects, Awards, …). */
function isNonSkillSectionLabel(value: string): boolean {
  return /^(?:projects?|certifications?|licenses?|courses?|training|awards?|honors?|volunteer|activities|interests?|references?|publications?|portfolio|experience|education|summary|profile|contact)\b/i.test(
    cleanHeadingLine(value),
  ) || /^(?:المشاريع|الشهادات|الدورات|التدريب|الجوائز|التطوع|الأنشطة|الاهتمامات|المراجع|المنشورات|الخبرة|التعليم|الملخص)$/u.test(cleanHeadingLine(value))
}

function displayHeadingLabel(value: string): string {
  const label = collapseWhitespace(stripBullet(value).replace(/[:]\s*$/, ''))
  return label.length > 60 ? '' : label
}

interface HeadingMatch {
  type: SectionType
  inline: string
  label?: string
}

function headingType(line: string, currentType: SectionType): HeadingMatch | null {
  const raw = line.replace(/^\s*#{1,6}\s*/, '').trim()
  if (!raw || raw.length > 80) return null
  if (EMAIL_RE.test(raw) || PHONE_RE.test(raw) || URL_RE.test(raw)) return null

  const colon = raw.indexOf(':')
  const hasInlineContent = colon > 0 && raw.slice(colon + 1).trim().length > 0
  const canOpenSection = currentType === 'header' || currentType === 'other' || currentType === 'skills'

  if (hasInlineContent) {
    const leftRaw = raw.slice(0, colon)
    const left = cleanHeadingLine(leftRaw)
    const right = raw.slice(colon + 1).trim()

    // Category labels (Tools, Languages, …) and skill-section labels only
    // open a skills section outside real content sections. Inside a project or
    // a job description the line stays content, so a technology stack can
    // never be promoted to Skills.
    if (isSkillCategoryLabel(left) || isSkillSectionHeading(left)) {
      if (!canOpenSection) return null
      return { type: 'skills', inline: right, label: displayHeadingLabel(leftRaw) }
    }

    for (const [type, patterns] of Object.entries(HEADINGS) as [SectionType, RegExp[]][]) {
      if (type === 'header') continue
      if (patterns.some((pattern) => pattern.test(left))) {
        if (!canOpenSection) return null
        return { type, inline: right }
      }
    }
    return null
  }

  const cleaned = cleanHeadingLine(raw)
  if (isSkillSectionHeading(cleaned)) {
    return {
      type: 'skills',
      inline: '',
      label: isGenericSkillHeading(cleaned) ? '' : displayHeadingLabel(raw),
    }
  }
  if (isSkillCategoryLabel(cleaned)) {
    if (!canOpenSection) return null
    return { type: 'skills', inline: '', label: displayHeadingLabel(raw) }
  }
  for (const [type, patterns] of Object.entries(HEADINGS) as [SectionType, RegExp[]][]) {
    if (type === 'header') continue
    if (patterns.some((pattern) => pattern.test(cleaned))) return { type, inline: '' }
  }
  return null
}

/** True when a line looks like a section heading that we refused to split on. */
function looksLikeHeadingLine(line: string): boolean {
  const colon = line.indexOf(':')
  if (colon <= 0) return false
  const left = cleanHeadingLine(line.slice(0, colon))
  if (!left) return false
  if (isSkillCategoryLabel(left) || isSkillSectionHeading(left)) return true
  return (Object.entries(HEADINGS) as [SectionType, RegExp[]][]).some(
    ([type, patterns]) => type !== 'header' && patterns.some((pattern) => pattern.test(left)),
  )
}

function splitSections(lines: string[]): { blocks: SectionBlock[]; ambiguous: boolean } {
  const blocks: SectionBlock[] = []
  let current: SectionBlock = { type: 'header', lines: [] }
  let ambiguous = false

  const push = () => {
    if (current.lines.some((line) => line.trim())) blocks.push(current)
  }

  for (const line of lines) {
    const heading = headingType(line, current.type)
    if (heading) {
      push()
      current = {
        type: heading.type,
        lines: heading.inline ? [heading.inline] : [],
        ...(heading.label ? { groupLabel: heading.label } : {}),
      }
    } else {
      if (SECTION_CONTENT_TYPES.includes(current.type) && looksLikeHeadingLine(line)) ambiguous = true
      current.lines.push(line)
    }
  }
  push()

  if (!blocks.some((block) => block.type !== 'header')) {
    return { blocks: [{ type: 'header', lines }], ambiguous }
  }
  return { blocks, ambiguous }
}

function getBlock(blocks: SectionBlock[], type: SectionType): SectionBlock | null {
  return blocks.find((block) => block.type === type) || null
}

function nonEmptyLines(lines: string[]): string[] {
  return lines.map((line) => line.trim()).filter(Boolean)
}

function findLabeled(lines: string[], labels: string[]): string | null {
  if (labels.length === 0) return null
  const pattern = new RegExp(`^(?:${labels.map(escapeRegex).join('|')})\\s*[:\\-–—]\\s*(.+)$`, 'i')
  for (const line of lines) {
    const match = line.trim().match(pattern)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  return null
}

function isContactLine(line: string): boolean {
  return EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line) || /linkedin\.com|github\.com/i.test(line)
}

function looksLikeName(line: string): boolean {
  const value = stripBullet(line).replace(/\s+/g, ' ').trim()
  if (value.length < 2 || value.length > 60) return false
  if (isContactLine(value) || CONTACT_LABEL_RE.test(value)) return false
  if (/\d/.test(value) || value.includes(',')) return false
  if (!/^[\p{L}\p{M}.'’\- ]+$/u.test(value)) return false
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 6) return false
  if (headingType(value, 'header')) return false
  if (/(?:engineer|developer|designer|manager|consultant|analyst|architect|specialist|مطور|مهندس|مصمم|مدير|استشاري|محلل)/i.test(value)) {
    return false
  }
  return true
}

function looksLikeTitle(line: string): boolean {
  const value = stripBullet(line).replace(/\s+/g, ' ').trim()
  if (value.length < 2 || value.length > 90) return false
  if (isContactLine(value) || CONTACT_LABEL_RE.test(value)) return false
  if (headingType(value, 'header')) return false
  if (/[<>]/.test(value)) return false
  const words = value.split(/\s+/).filter(Boolean)
  if (words.length > 12) return false
  if (words.length > 8 && /[.!?]$/.test(value)) return false
  return true
}

function looksLikeLocation(line: string): boolean {
  const value = stripBullet(line).replace(/\s+/g, ' ').trim()
  if (value.length < 3 || value.length > 80) return false
  if (isContactLine(value) || /\d{3,}/.test(value)) return false
  if (headingType(value, 'header')) return false
  return /^[\p{L}\p{M} .'’\-]+(?:,|،)\s*[\p{L}\p{M} .'’\-]+$/u.test(value)
}

function extractName(header: string[], allLines: string[]): string {
  const labeled = findLabeled([...header, ...allLines.slice(0, 10)], [
    'name', 'full name', 'الاسم', 'الاسم الكامل',
  ])
  if (labeled && looksLikeName(labeled)) return collapseWhitespace(labeled)

  for (const line of header) {
    if (/^(?:curriculum vitae|resume|سيرة ذاتية|السيرة الذاتية)$/i.test(line.trim())) continue
    if (looksLikeName(line)) return collapseWhitespace(stripBullet(line))
  }

  for (const line of allLines.slice(0, 8)) {
    if (looksLikeName(line)) return collapseWhitespace(stripBullet(line))
  }
  return ''
}

function extractTitle(header: string[], name: string): string {
  const labeled = findLabeled(header, [
    'title', 'job title', 'professional title', 'position', 'current role', 'headline',
    'المسمى الوظيفي', 'الوظيفة', 'المهنة', 'العنوان الوظيفي',
  ])
  if (labeled && looksLikeTitle(labeled)) return collapseWhitespace(labeled)

  const nameIndex = header.findIndex((line) => collapseWhitespace(stripBullet(line)) === name)
  const start = nameIndex >= 0 ? nameIndex + 1 : 0
  for (let index = start; index < header.length; index += 1) {
    const line = header[index]
    if (!line.trim()) continue
    if (looksLikeName(line) && collapseWhitespace(stripBullet(line)) !== name) continue
    if (looksLikeLocation(line)) continue
    if (looksLikeTitle(line)) return collapseWhitespace(stripBullet(line))
  }
  return ''
}

function extractLocation(header: string[], name: string, title: string): string {
  const labeled = findLabeled(header, [
    'location', 'address', 'city', 'based in', 'الموقع', 'العنوان', 'المدينة', 'مكان الإقامة',
  ])
  if (labeled) {
    const cleaned = collapseWhitespace(labeled)
    if (cleaned.length <= 120) return cleaned
  }

  for (const line of header) {
    const value = collapseWhitespace(stripBullet(line))
    if (!value || value === name || value === title) continue
    if (looksLikeLocation(value)) return value
  }
  return ''
}

function extractBio(summaryLines: string[]): string {
  const lines = summaryLines
    .map((line) => stripBullet(line))
    .filter((line) => (
      line
      && !CONTACT_LABEL_RE.test(line)
      && !SENSITIVE_LABEL_RE.test(line)
      && !(isContactLine(line) && line.length < 120)
    ))
  const bio = cleanPlain(stripSensitiveText(lines.join('\n')), true)
  return bio.length > 2000 ? '' : bio
}

function parseSkillTokens(rawLine: string): string[] {
  const tokens: string[] = []
  for (const part of stripBullet(rawLine).split(/[,;|•·،؛]/)) {
    const value = cleanPlain(part)
      .trim()
      .replace(/^[-–—:]+|[-–—:]+$/g, '')
      .trim()
    // Only real skill/competency names are accepted. Duties, achievements and
    // sentences are not skills.
    if (!isSkillLikeToken(value)) continue
    tokens.push(value)
  }
  return tokens
}

function skillCategoryFromLine(rawLine: string): { name: string; content: string } | null {
  const line = stripBullet(rawLine)
  if (!line) return null
  const colon = line.indexOf(':')
  if (colon > 0 && colon < 60) {
    const left = cleanPlain(line.slice(0, colon))
    const right = line.slice(colon + 1).trim()
    if (left && right && left.split(/\s+/).length <= 5 && !EMAIL_RE.test(left) && !PHONE_RE.test(left) && !URL_RE.test(left)) {
      return { name: isGenericSkillHeading(left) ? '' : left, content: right }
    }
  }
  if (!line.includes(':') && isSkillGroupHeading(line)) {
    return { name: isGenericSkillHeading(line) ? '' : displayHeadingLabel(line), content: '' }
  }
  return null
}

/** Label of a line that introduces a non-skill section (Projects, Awards…). */
function nonSkillSectionLabelOf(line: string): string | null {
  const colon = line.indexOf(':')
  if (colon <= 0) return null
  const left = cleanHeadingLine(line.slice(0, colon))
  if (!left) return null
  return isNonSkillSectionLabel(left) ? left : null
}

function parseSkillGroups(
  blocks: SectionBlock[],
  header: string[],
  language: CvDetectedLanguage,
): { groups: CvSkillGroupSuggestion[]; truncated: boolean; ambiguous: boolean } {
  const generalName = language === 'ar' ? GENERAL_SKILL_GROUP_AR : GENERAL_SKILL_GROUP_EN
  const groups: CvSkillGroupSuggestion[] = []
  const byKey = new Map<string, CvSkillGroupSuggestion>()
  const seenSkills = new Set<string>()
  let total = 0
  let truncated = false
  let ambiguous = false

  const groupKey = (name: string) => collapseWhitespace(name).toLowerCase()

  const ensureGroup = (label: string | undefined): CvSkillGroupSuggestion => {
    const raw = cleanPlain(label || '')
    const cleaned = raw.length > 60 ? '' : raw
    if (raw.length > 60) truncated = true
    const name = !cleaned || isGenericSkillHeading(cleaned) ? generalName : cleaned
    const key = groupKey(name)
    const existing = byKey.get(key)
    if (existing) return existing

    const generalKey = groupKey(generalName)
    const existingGeneral = byKey.get(generalKey)
    if (existingGeneral && key !== generalKey) {
      if (groups.length >= MAX_SKILL_GROUPS - 1) {
        truncated = true
        return existingGeneral
      }
    }

    if (key !== generalKey && groups.length >= MAX_SKILL_GROUPS - 1) {
      // Reserve the last slot for a clearly labeled general group rather than
      // mislabeling overflow skills under an unrelated category.
      if (groups.length < MAX_SKILL_GROUPS) {
        const general: CvSkillGroupSuggestion = { name: generalName, skills: [] }
        groups.push(general)
        byKey.set(generalKey, general)
        truncated = true
        return general
      }
      const general = byKey.get(generalKey)
      if (general) {
        truncated = true
        return general
      }
      truncated = true
      return groups[0]
    }

    if (groups.length >= MAX_SKILL_GROUPS) {
      const general = byKey.get(generalKey)
      if (general) {
        truncated = true
        return general
      }
      truncated = true
      return groups[0]
    }

    const group: CvSkillGroupSuggestion = { name, skills: [] }
    groups.push(group)
    byKey.set(key, group)
    return group
  }

  const addSkill = (skill: string, label: string | undefined) => {
    if (total >= MAX_TOTAL_SKILLS) {
      truncated = true
      return
    }
    const cleaned = cleanPlain(skill)
    if (!cleaned) return
    if (cleaned.length > 60) {
      truncated = true
      return
    }
    const key = groupKey(cleaned)
    if (seenSkills.has(key)) return
    const group = ensureGroup(label)
    if (group.skills.length >= MAX_SKILLS_PER_GROUP) {
      truncated = true
      return
    }
    seenSkills.add(key)
    group.skills.push(cleaned)
    total += 1
  }

  for (const block of blocks) {
    const baseLabel = block.groupLabel && !isGenericSkillHeading(block.groupLabel)
      ? block.groupLabel
      : ''
    let currentLabel = baseLabel

    for (const rawLine of block.lines) {
      const line = stripBullet(rawLine)
      if (!line) continue
      // A line that introduces a different CV section (Projects, Awards, …)
      // inside a skills list is not a skill category and its content is not a
      // skill list.
      if (nonSkillSectionLabelOf(line)) {
        truncated = true
        ambiguous = true
        continue
      }
      const category = skillCategoryFromLine(line)
      if (category) {
        currentLabel = category.name
        for (const token of parseSkillTokens(category.content)) addSkill(token, currentLabel)
        continue
      }
      for (const token of parseSkillTokens(line)) addSkill(token, currentLabel)
    }
  }

  // Explicit one-line skill labels in the header are still useful when the CV
  // has no dedicated skills section.
  if (blocks.length === 0) {
    for (const line of header) {
      const match = line.match(/^(?:technical\s+|professional\s+|core\s+)?skills\s*[:\-]\s*(.+)$/i)
      if (!match?.[1]) continue
      for (const token of parseSkillTokens(match[1])) addSkill(token, '')
    }
  }

  return {
    groups: groups.filter((group) => group.skills.length > 0).slice(0, MAX_SKILL_GROUPS),
    truncated,
    ambiguous,
  }
}

function parseDateToken(token: string): { value: string; current: boolean } {
  const raw = collapseWhitespace(token)
  if (!raw) return { value: '', current: false }
  if (CURRENT_WORDS.test(raw)) return { value: raw.slice(0, 30), current: true }
  // Dates are returned exactly as written in the CV. Formatting is not
  // normalized to YYYY-MM because that would change the source wording.
  return { value: raw.slice(0, 30), current: false }
}

function removeDate(text: string, dateText: string): string {
  return text
    .replace(dateText, ' ')
    .replace(/\(\s*\)/g, ' ')
    .replace(/\[\s*\]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s|,;–—-]+|[\s|,;–—-]+$/g, '')
    .trim()
}

function splitRoleLine(line: string): { title: string; company: string; location: string } {
  const value = collapseWhitespace(stripBullet(line))
  if (!value) return { title: '', company: '', location: '' }

  let parts: string[] = []
  if (value.includes('|')) parts = value.split(/\s*\|\s*/)
  else if (/\s+(?:at|@)\s+/i.test(value)) parts = value.split(/\s+(?:at|@)\s+/i)
  else if (/\s+[–—]\s+/.test(value)) parts = value.split(/\s+[–—]\s+/)
  else if (/\s+-\s+/.test(value)) parts = value.split(/\s+-\s+/)

  if (parts.length === 0) {
    const comma = value.search(/[,،]/)
    if (comma > 0 && comma < value.length - 1) {
      const left = value.slice(0, comma).trim()
      const right = value.slice(comma + 1).trim()
      if (left.split(/\s+/).length <= 8 && right.split(/\s+/).length <= 6 && !/^(inc|llc|ltd|corp|co)\.?$/i.test(right)) {
        parts = [left, right]
      }
    }
  }

  const cleaned = parts.map((part) => collapseWhitespace(part).replace(/^[,;|–—-]+|[,;|–—-]+$/g, '').trim())
  return {
    title: cleaned[0] || '',
    company: cleaned[1] || '',
    location: cleaned[2] || '',
  }
}

function normalizeKey(value: string): string {
  return collapseWhitespace(value).toLowerCase()
}

function looksLikeProse(value: string): boolean {
  const cleaned = collapseWhitespace(value)
  if (!cleaned) return false
  if (cleaned.length >= 45) return true
  if (/[.!?]$/.test(cleaned)) return true
  return /^[-*•·]/.test(value.trim())
}

const ACTION_START_RE = /^(?:built|led|developed|managed|created|designed|worked|implemented|improved|responsible|spearheaded|collaborated|delivered|launched|maintained|supported|analy[sz]ed|coordinated|architected|migrated|optimi[sz]ed|reduced|increased|achieved|trained|mentored|owned|drove|established|streamlined|automated|deployed|tested|reviewed|presented|partnered|provided|performed|conducted|طورت|قدت|أدرت|أنشأت|صممت|عملت|نفذت|حسنت|ساهمت|أشرفت|دربت|حللت|نسقت|أعدت|أطلقت|حافظت|دعمت|سلمت|خططت)/i

function looksLikeDescription(value: string): boolean {
  return looksLikeProse(value) || ACTION_START_RE.test(collapseWhitespace(value))
}

function looksLikeRoleStart(value: string): boolean {
  const cleaned = collapseWhitespace(stripBullet(value))
  if (!cleaned || cleaned.length > 70) return false
  if (/[.!?]$/.test(cleaned)) return false
  if (looksLikeDescription(cleaned)) return false
  return cleaned.split(/\s+/).length <= 8
}

function experienceKey(item: CvExperienceSuggestion): string {
  return `${normalizeKey(item.jobTitle)}|${normalizeKey(item.companyName)}|${item.startDate}`
}

function educationKey(item: CvEducationSuggestion): string {
  return `${normalizeKey(item.title)}|${normalizeKey(item.institution)}|${normalizeKey(item.date)}`
}

function splitIntoBlocks(lines: string[]): string[][] {
  const blocks: string[][] = []
  let current: string[] = []
  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) blocks.push(current)
      current = []
    } else {
      current.push(line)
    }
  }
  if (current.length) blocks.push(current)

  if (blocks.length === 1 && blocks[0].length > 3) {
    const split: string[][] = []
    let part: string[] = []
    for (const line of blocks[0]) {
      const range = line.match(DATE_RANGE_RE)
      const withoutDate = range ? removeDate(line, range[0]) : line
      const startsRole = Boolean(range && withoutDate.trim().length >= 2)
      if (startsRole && part.length >= 2) {
        split.push(part)
        part = []
      }
      part.push(line)
    }
    if (part.length) split.push(part)
    if (split.length > 1) return split
  }
  return blocks
}

function parseExperienceFlow(lines: string[]): {
  items: CvExperienceSuggestion[]
  sawDates: boolean
  omitted: boolean
  ambiguous: boolean
  sawProject: boolean
} {
  const items: CvExperienceSuggestion[] = []
  const seen = new Set<string>()
  let sawDates = false
  let omitted = false
  let ambiguous = false
  let sawProject = false
  let current: CvExperienceSuggestion = {
    jobTitle: '',
    companyName: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  }
  let currentRaw: string[] = []

  const reset = () => {
    current = {
      jobTitle: '',
      companyName: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    }
    currentRaw = []
  }

  const finish = () => {
    const titleFit = fitText(current.jobTitle, 120)
    if (titleFit.text) {
      // A project entry is not a work engagement.
      if (isProjectLikeTitle(titleFit.text)) {
        sawProject = true
        reset()
        return
      }
      const startDate = current.startDate.length > 30 ? '' : current.startDate
      const endDate = current.endDate.length > 30 ? '' : current.endDate
      if (current.startDate.length > 30 || current.endDate.length > 30) omitted = true

      // Employment evidence: a stated period, an employer/client cue, or an
      // employer named inside the entry itself.
      if (!hasEmploymentEvidence({ startDate, endDate }, {
        title: current.jobTitle,
        employer: current.companyName,
        text: currentRaw.join('\n'),
      })) {
        ambiguous = true
        reset()
        return
      }

      const companyFit = fitText(current.companyName, 120)
      const locationFit = fitText(current.location, 120)
      const descriptionFit = fitText(stripSensitiveText(current.description), 1000, true)
      if (companyFit.omitted || locationFit.omitted || descriptionFit.omitted) omitted = true

      const item: CvExperienceSuggestion = {
        jobTitle: titleFit.text,
        companyName: companyFit.text,
        location: locationFit.text,
        startDate,
        endDate,
        isCurrent: current.isCurrent,
        description: descriptionFit.text,
      }
      const key = experienceKey(item)
      if (!seen.has(key)) {
        seen.add(key)
        items.push(item)
      }
    } else if (current.jobTitle) {
      omitted = true
    }
    reset()
  }

  const setDates = (startToken: string, endToken: string) => {
    const start = parseDateToken(startToken)
    const end = parseDateToken(endToken)
    current.startDate = start.value
    current.endDate = end.value
    current.isCurrent = end.current
  }

  const setRole = (line: string) => {
    const role = splitRoleLine(line)
    current.jobTitle = role.title || collapseWhitespace(line)
    current.companyName = role.company
    current.location = role.location
  }

  for (const rawLine of nonEmptyLines(lines)) {
    const line = stripBullet(rawLine)
    if (!line) continue

    const range = line.match(DATE_RANGE_RE)
    if (range) {
      sawDates = true
      const remaining = removeDate(line, range[0])
      if (!remaining) {
        setDates(range[1], range[2])
        currentRaw.push(rawLine)
        continue
      }

      const role = splitRoleLine(remaining)
      if (!current.jobTitle) {
        setRole(remaining)
        setDates(range[1], range[2])
        currentRaw.push(rawLine)
        continue
      }
      if (current.startDate || current.companyName) {
        finish()
        setRole(remaining)
        setDates(range[1], range[2])
        currentRaw.push(rawLine)
        continue
      }
      if (remaining.includes('|')) {
        finish()
        setRole(remaining)
        setDates(range[1], range[2])
        currentRaw.push(rawLine)
        continue
      }
      current.companyName = role.title || collapseWhitespace(remaining)
      if (role.company) current.location = role.company
      setDates(range[1], range[2])
      currentRaw.push(rawLine)
      continue
    }

    if (current.startDate && looksLikeDescription(line)) {
      current.description = [current.description, line].filter(Boolean).join('\n')
      currentRaw.push(rawLine)
      continue
    }

    if (current.jobTitle && current.companyName) {
      if (looksLikeLocation(line) && !current.location) {
        current.location = line
        currentRaw.push(rawLine)
        continue
      }
      if (looksLikeRoleStart(line)) {
        finish()
        current.jobTitle = line
        currentRaw.push(rawLine)
        continue
      }
      current.description = [current.description, line].filter(Boolean).join('\n')
      currentRaw.push(rawLine)
      continue
    }

    if (current.jobTitle && !current.companyName) {
      if (looksLikeLocation(line) && !current.location) {
        current.location = line
        currentRaw.push(rawLine)
      } else if (looksLikeDescription(line)) {
        current.description = [current.description, line].filter(Boolean).join('\n')
        currentRaw.push(rawLine)
      } else {
        current.companyName = line
        currentRaw.push(rawLine)
      }
      continue
    }

    current.jobTitle = line
    currentRaw.push(rawLine)
    if (items.length >= MAX_EXPERIENCE) break
  }

  finish()
  return { items: items.slice(0, MAX_EXPERIENCE), sawDates, omitted, ambiguous, sawProject }
}

function extractExperience(block: SectionBlock | null): {
  items: CvExperienceSuggestion[]
  sawDates: boolean
  omitted: boolean
  ambiguous: boolean
  sawProject: boolean
} {
  if (!block) return { items: [], sawDates: false, omitted: false, ambiguous: false, sawProject: false }
  const blocks = splitIntoBlocks(block.lines)
  const singleLineBlocks = blocks.filter((lines) => nonEmptyLines(lines).length === 1).length
  if (blocks.length >= 3 && singleLineBlocks / blocks.length >= 0.6) {
    return parseExperienceFlow(block.lines)
  }

  const items: CvExperienceSuggestion[] = []
  const seen = new Set<string>()
  let sawDates = false
  let omitted = false
  let ambiguous = false
  let sawProject = false

  for (const rawBlock of blocks) {
    const lines = nonEmptyLines(rawBlock)
    if (lines.length === 0) continue

    let startDate = ''
    let endDate = ''
    let isCurrent = false
    let hadRange = false
    const contentLines: string[] = []

    for (const line of lines) {
      if (hadRange) {
        contentLines.push(line)
        continue
      }
      const range = line.match(DATE_RANGE_RE)
      if (range) {
        hadRange = true
        sawDates = true
        const start = parseDateToken(range[1])
        const end = parseDateToken(range[2])
        startDate = start.value
        endDate = end.value
        isCurrent = end.current
        const remaining = removeDate(line, range[0])
        if (remaining) contentLines.push(remaining)
      } else {
        contentLines.push(line)
      }
    }

    /* A lone year/month in prose is not a reliable employment range. Only an
     * explicit range sets dates; otherwise the item is kept with blank dates
     * so the user can review it rather than receiving an invented date. */

    const candidates = nonEmptyLines(contentLines)
    if (candidates.length === 0) continue

    // DOCX extraction commonly emits a blank paragraph between every line.
    // Attach a plain prose block to the previous role instead of creating a
    // fake role from a description sentence.
    if (
      !hadRange
      && candidates.length === 1
      && items.length > 0
      && !candidates[0].includes('|')
      && looksLikeProse(candidates[0])
    ) {
      const last = items[items.length - 1]
      const addition = cleanPlain(candidates[0], true)
      if (addition) {
        last.description = [last.description, addition].filter(Boolean).join('\n').slice(0, 1000)
      }
      continue
    }

    let title = ''
    let company = ''
    let location = ''
    let description = ''

    if (candidates.length === 1) {
      const role = splitRoleLine(candidates[0])
      title = role.title
      company = role.company
      location = role.location
    } else {
      const first = splitRoleLine(candidates[0])
      if (first.company || first.location) {
        title = first.title
        company = first.company
        location = first.location
        description = candidates.slice(1).join('\n')
      } else {
        title = first.title || candidates[0]
        const second = candidates[1] || ''
        // The second line is the employer only when it reads like a name.
        // A duty sentence is a description, so the entry stays ambiguous
        // instead of gaining an employer the CV never stated.
        if (second && !looksLikeDescription(second)) {
          company = second
          const third = candidates[2] || ''
          if (third && looksLikeLocation(third)) {
            location = third
            description = candidates.slice(3).join('\n')
          } else {
            description = candidates.slice(2).join('\n')
          }
        } else {
          company = ''
          description = candidates.slice(1).join('\n')
        }
      }
    }

    const titleFit = fitText(title, 120)
    if (!titleFit.text) {
      if (title) omitted = true
      continue
    }

    // A project entry is not a work engagement.
    if (isProjectLikeTitle(titleFit.text)) {
      sawProject = true
      continue
    }

    const startDateFinal = startDate.length > 30 ? '' : startDate
    const endDateFinal = endDate.length > 30 ? '' : endDate
    if (startDate.length > 30 || endDate.length > 30) omitted = true

    // Employment evidence: a stated period, an employer/client cue, or an
    // employer named inside the entry itself.
    if (!hasEmploymentEvidence({ startDate: startDateFinal, endDate: endDateFinal }, {
      title: titleFit.text,
      employer: company,
      text: rawBlock.join('\n'),
    })) {
      ambiguous = true
      continue
    }

    const companyFit = fitText(company, 120)
    const locationFit = fitText(location, 120)
    const descriptionFit = fitText(
      stripSensitiveText(description.split('\n').map((line) => stripBullet(line)).filter(Boolean).join('\n')),
      1000,
      true,
    )
    if (companyFit.omitted || locationFit.omitted || descriptionFit.omitted) omitted = true

    if (headingType(titleFit.text, 'header')) continue
    if (EMAIL_RE.test(titleFit.text) || PHONE_RE.test(titleFit.text) || URL_RE.test(titleFit.text)) continue

    const item: CvExperienceSuggestion = {
      jobTitle: titleFit.text,
      companyName: companyFit.text,
      location: locationFit.text,
      startDate: startDateFinal,
      endDate: endDateFinal,
      isCurrent,
      description: descriptionFit.text,
    }
    const key = experienceKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    items.push(item)
    if (items.length >= MAX_EXPERIENCE) break
  }

  return { items, sawDates, omitted, ambiguous, sawProject }
}

function looksLikeInstitution(value: string): boolean {
  return /(?:university|college|institute|school|academy|جامعة|كلية|معهد|مدرسة|أكاديمية)/i.test(value)
}

function parseEducationFlow(lines: string[]): {
  items: CvEducationSuggestion[]
  sawDates: boolean
  omitted: boolean
  ambiguous: boolean
} {
  const items: CvEducationSuggestion[] = []
  const seen = new Set<string>()
  let sawDates = false
  let omitted = false
  let ambiguous = false
  let current: CvEducationSuggestion = {
    title: '',
    institution: '',
    date: '',
    description: '',
  }

  const reset = () => {
    current = { title: '', institution: '', date: '', description: '' }
  }

  const finish = () => {
    const titleFit = fitText(current.title, 120)
    if (titleFit.text) {
      const institutionFit = fitText(current.institution, 120)
      const descriptionFit = fitText(stripSensitiveText(current.description), 1000, true)
      const date = current.date.length > 60 ? '' : current.date
      if (current.date.length > 60) omitted = true

      // Only real education entries (degree, study program, school).
      if (!isEducationLikeEntry(titleFit.text, institutionFit.text)) {
        ambiguous = true
        reset()
        return
      }
      if (institutionFit.omitted || descriptionFit.omitted) omitted = true

      const item: CvEducationSuggestion = {
        title: titleFit.text,
        institution: institutionFit.text,
        date,
        description: descriptionFit.text,
      }
      const key = educationKey(item)
      if (!seen.has(key)) {
        seen.add(key)
        items.push(item)
      }
    } else if (current.title) {
      omitted = true
    }
    reset()
  }

  for (const rawLine of nonEmptyLines(lines)) {
    const line = stripBullet(rawLine)
    if (!line) continue

    const range = line.match(DATE_RANGE_RE)
    const single = range ? null : line.match(SINGLE_DATE_RE)
    const match = range || single
    if (match) {
      sawDates = true
      const remaining = removeDate(line, match[0])
      if (remaining && !current.title) {
        const role = splitRoleLine(remaining)
        current.title = role.title || remaining
        current.institution = role.company
      }
      current.date = match[0]
      continue
    }

    if (!current.title) {
      const role = splitRoleLine(line)
      current.title = role.title || line
      current.institution = role.company
      continue
    }

    if (!current.institution) {
      current.institution = line
      continue
    }

    if (looksLikeDescription(line)) {
      current.description = [current.description, line].filter(Boolean).join('\n')
      continue
    }

    finish()
    current.title = line
    if (items.length >= MAX_EDUCATION) break
  }

  finish()
  return { items: items.slice(0, MAX_EDUCATION), sawDates, omitted, ambiguous }
}

function extractEducation(block: SectionBlock | null): {
  items: CvEducationSuggestion[]
  sawDates: boolean
  omitted: boolean
  ambiguous: boolean
} {
  if (!block) return { items: [], sawDates: false, omitted: false, ambiguous: false }
  const blocks = splitIntoBlocks(block.lines)
  const singleLineBlocks = blocks.filter((lines) => nonEmptyLines(lines).length === 1).length
  if (blocks.length >= 3 && singleLineBlocks / blocks.length >= 0.6) {
    return parseEducationFlow(block.lines)
  }

  const items: CvEducationSuggestion[] = []
  const seen = new Set<string>()
  let sawDates = false
  let omitted = false
  let ambiguous = false

  for (const rawBlock of blocks) {
    const lines = nonEmptyLines(rawBlock)
    if (lines.length === 0) continue

    let date = ''
    for (let index = 0; index < lines.length; index += 1) {
      const range = lines[index].match(DATE_RANGE_RE)
      const single = range ? null : lines[index].match(SINGLE_DATE_RE)
      const match = range || single
      if (!match) continue
      date = match[0]
      sawDates = true
      const remaining = removeDate(lines[index], match[0])
      if (remaining) lines[index] = remaining
      else lines.splice(index, 1)
      break
    }

    const candidates = nonEmptyLines(lines)
    if (candidates.length === 0) continue

    let title = ''
    let institution = ''
    let description = ''

    if (candidates.length === 1) {
      const role = splitRoleLine(candidates[0])
      title = role.title
      institution = role.company
      description = role.location
    } else {
      const first = candidates[0]
      const second = candidates[1]
      if (looksLikeInstitution(first) && !looksLikeInstitution(second)) {
        institution = first
        title = second
      } else {
        const role = splitRoleLine(first)
        title = role.title || first
        institution = role.company || second
      }
      description = candidates.slice(2).join('\n')
    }

    const titleFit = fitText(title, 120)
    if (!titleFit.text) {
      if (title) omitted = true
      continue
    }
    const institutionFit = fitText(institution, 120)
    const descriptionFit = fitText(
      stripSensitiveText(description.split('\n').map((line) => stripBullet(line)).filter(Boolean).join('\n')),
      1000,
      true,
    )
    if (institutionFit.omitted || descriptionFit.omitted) omitted = true
    const dateFinal = date.length > 60 ? '' : date
    if (date.length > 60) omitted = true

    // Only real education entries (degree, study program, school).
    if (!isEducationLikeEntry(titleFit.text, institutionFit.text)) {
      ambiguous = true
      continue
    }

    if (headingType(titleFit.text, 'header')) continue
    if (EMAIL_RE.test(titleFit.text) || PHONE_RE.test(titleFit.text) || URL_RE.test(titleFit.text)) continue

    const item: CvEducationSuggestion = {
      title: titleFit.text,
      institution: institutionFit.text,
      date: dateFinal,
      description: descriptionFit.text,
    }
    const key = educationKey(item)
    if (seen.has(key)) continue
    seen.add(key)
    items.push(item)
    if (items.length >= MAX_EDUCATION) break
  }

  return { items, sawDates, omitted, ambiguous }
}

function scalar(value: string, language: CvDetectedLanguage): CvScalarSuggestion | null {
  const cleaned = cleanPlain(value)
  if (!cleaned) return null
  return { value: cleaned, language: detectTextLanguage(cleaned, language) }
}

/**
 * Raw text of one CV section. It is the evidence scope used when validating
 * AI output: an experience item must be stated inside the CV's experience
 * section, an education item inside its education section, and so on.
 */
export function extractSectionText(text: string, type: SectionType): string {
  const lines = text.split('\n').map((line) => line.trim())
  const { blocks } = splitSections(lines)
  const block = getBlock(blocks, type)
  return block ? block.lines.join('\n') : ''
}

export function extractExplicitSkillGroups(text: string): CvSkillGroupSuggestion[] {
  const lines = text.split('\n').map((line) => line.trim())
  const { blocks } = splitSections(lines)
  const headerBlock = getBlock(blocks, 'header')
  const header = headerBlock?.lines || lines.slice(0, 10)
  const skillBlocks = blocks.filter((block) => block.type === 'skills')
  return parseSkillGroups(skillBlocks, header, detectCvLanguage(text)).groups
}

export function extractLocalCvSuggestions(
  text: string,
  options: { truncated?: boolean } = {},
): CvSuggestions {
  const language = detectCvLanguage(text)
  const lines = text.split('\n').map((line) => line.trim())
  const { blocks, ambiguous } = splitSections(lines)
  const headerBlock = getBlock(blocks, 'header')
  const header = headerBlock?.lines || lines.slice(0, 10)
  const summary = getBlock(blocks, 'summary')
  const experienceBlock = getBlock(blocks, 'experience')
  const educationBlock = getBlock(blocks, 'education')
  const projectsBlock = getBlock(blocks, 'projects')
  const skillBlocks = blocks.filter((block) => block.type === 'skills')

  const experienceResult = extractExperience(experienceBlock)
  const educationResult = extractEducation(educationBlock)

  const name = extractName(header, lines)
  const title = extractTitle(header, name)
  const location = extractLocation(header, name, title)
  const bio = summary ? extractBio(summary.lines) : ''
  const skillResult = parseSkillGroups(skillBlocks, header, language)

  const warnings = new Set<CvWarningCode>()
  if (options.truncated) warnings.add('TEXT_TRUNCATED')
  if (experienceResult.items.some((item) => !item.startDate)) warnings.add('DATES_NEED_REVIEW')
  if (experienceResult.omitted) warnings.add('PARTIAL_EXTRACTION')
  if (educationResult.omitted) warnings.add('PARTIAL_EXTRACTION')
  if (experienceResult.ambiguous) warnings.add('AMBIGUOUS_CONTENT_OMITTED')
  if (educationResult.ambiguous) warnings.add('AMBIGUOUS_CONTENT_OMITTED')
  if (ambiguous) warnings.add('AMBIGUOUS_CONTENT_OMITTED')
  if (experienceBlock && experienceResult.items.length === 0) warnings.add('PARTIAL_EXTRACTION')
  if (educationBlock && educationResult.items.length === 0) warnings.add('PARTIAL_EXTRACTION')
  if (skillBlocks.length > 0 && skillResult.groups.length === 0) warnings.add('PARTIAL_EXTRACTION')
  if (skillResult.truncated) warnings.add('PARTIAL_EXTRACTION')
  if (projectsBlock && projectsBlock.lines.some((line) => line.trim())) {
    // PortfolioHub projects are `ProjectPage` rows; CV import does not create
    // them yet, so project entries are left unapplied instead of being
    // forced into Experience or Skills.
    warnings.add('PROJECTS_NOT_SUPPORTED')
  }
  if (experienceResult.sawProject) warnings.add('PROJECTS_NOT_SUPPORTED')
  if (summary && !bio) warnings.add('PARTIAL_EXTRACTION')

  return {
    displayName: scalar(name, language),
    professionalTitle: scalar(title, language),
    location: scalar(location, language),
    bio: bio ? { value: bio, language: detectTextLanguage(bio, language) } : null,
    skillGroups: skillResult.groups,
    experience: experienceResult.items,
    education: educationResult.items,
    language,
    warnings: [...warnings],
  }
}
