import { collapseWhitespace } from './normalize'
import { extractExplicitSkillGroups, extractSectionText } from './local-extractor'
import {
  hasEmploymentEvidence,
  isEducationLikeEntry,
  isProjectLikeTitle,
} from './rules'
import {
  GENERAL_SKILL_GROUP_AR,
  GENERAL_SKILL_GROUP_EN,
  MAX_SKILLS_PER_GROUP,
  MAX_SKILL_GROUPS,
  MAX_TOTAL_SKILLS,
} from './types'
import type {
  CvAiFields,
  CvEducationSuggestion,
  CvExperienceSuggestion,
  CvSkillGroupSuggestion,
} from './types'

export interface AiSupportResult {
  fields: CvAiFields
  filtered: boolean
}

/**
 * Evidence scope taken from the CV itself. Every AI item must be stated
 * inside the matching CV section, so a project can never be re-labelled as a
 * job and a technology from a project can never become a skill.
 */
interface AiEvidenceScope {
  header: string
  summary: string
  experience: string
  education: string
}

function mentions(scope: string, value: string): boolean {
  if (!scope.trim() || !value.trim()) return false
  return canonical(scope).toLowerCase().includes(canonical(value).toLowerCase())
}

function buildEvidenceScope(cvText: string): AiEvidenceScope {
  return {
    header: extractSectionText(cvText, 'header'),
    summary: extractSectionText(cvText, 'summary'),
    experience: extractSectionText(cvText, 'experience'),
    education: extractSectionText(cvText, 'education'),
  }
}

function canonical(value: string): string {
  return collapseWhitespace(value)
}

function findSupportedBlock(text: string, value: string): string | null {
  const target = canonical(value).toLowerCase()
  if (!target) return null
  const blocks = new Set<string>()
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed) blocks.add(trimmed)
  }
  for (const block of text.split(/\n\s*\n/)) {
    const trimmed = block.trim()
    if (trimmed) blocks.add(trimmed)
  }
  for (const block of blocks) {
    if (canonical(block).toLowerCase() === target) return block
  }
  return null
}

interface CellOptions {
  splitCommas?: boolean
  splitDates?: boolean
}

function cellsFor(text: string, options: CellOptions = {}): string[] {
  const cells = new Set<string>()
  const add = (value: string) => {
    const trimmed = value.trim()
    if (trimmed) cells.add(trimmed)
  }

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    add(trimmed)

    const colon = trimmed.indexOf(':')
    if (colon > 0) add(trimmed.slice(colon + 1))

    for (const part of trimmed.split(/\s*(?:\||–|—|\t|•|·|;)\s*/)) add(part)
    for (const part of trimmed.split(/\s+(?:at|@)\s+/i)) add(part)
  }

  if (options.splitCommas) {
    for (const cell of [...cells]) {
      for (const part of cell.split(/[,،]/)) add(part)
    }
  }
  if (options.splitDates) {
    for (const cell of [...cells]) {
      for (const part of cell.split(/\s+(?:-|–|—|to|until|through|حتى|إلى)\s+/i)) add(part)
    }
  }

  return [...cells]
}

function findSupportedCell(text: string, value: string | null | undefined, options: CellOptions = {}): string | null {
  if (!value) return null
  const target = canonical(value).toLowerCase()
  if (!target) return null
  for (const cell of cellsFor(text, options)) {
    if (canonical(cell).toLowerCase() === target) return cell
  }
  return null
}

/**
 * The CV lines that belong to one entry: every line mentioning the role plus
 * the line right below it (the usual place for the employer). Scoping the
 * context this way keeps a role and an employer that appear in different
 * parts of the CV from being paired.
 */
function employmentContextFor(text: string, title: string): string {
  const target = canonical(title).toLowerCase()
  if (!target) return ''
  const lines = text.split('\n')
  const picked: string[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = canonical(lines[index])
    if (!line.toLowerCase().includes(target)) continue
    picked.push(line)
    const next = canonical(lines[index + 1] || '')
    if (next) picked.push(next)
  }
  return picked.join('\n')
}

function hasCurrentMarker(text: string): boolean {
  return /(?:\bpresent\b|\bcurrent\b|\bnow\b|حتى الآن|الحالي|الآن)/i.test(text)
}

function hasCurrentMarkerForItem(
  text: string,
  item: CvExperienceSuggestion,
): boolean {
  if (item.endDate && hasCurrentMarker(item.endDate)) return true
  const title = canonical(item.jobTitle).toLowerCase()
  const company = canonical(item.companyName).toLowerCase()
  return text.split('\n').some((line) => {
    const normalized = canonical(line).toLowerCase()
    if (!hasCurrentMarker(normalized)) return false
    return (title.length > 0 && normalized.includes(title))
      || (company.length > 0 && normalized.includes(company))
  })
}

function filterScalar(
  value: string | undefined,
  text: string,
  mode: 'cell' | 'block',
  scope?: string,
): { value?: string; changed: boolean } {
  if (!value) return { value: undefined, changed: false }
  const supported = mode === 'cell' ? findSupportedCell(text, value) : findSupportedBlock(text, value)
  if (!supported) return { value: undefined, changed: true }
  // A bio is only the CV's own profile/summary text.
  if (scope !== undefined && !mentions(scope, supported)) {
    return { value: undefined, changed: true }
  }
  return { value: supported, changed: false }
}

function filterExperience(
  item: CvExperienceSuggestion,
  text: string,
  scope: AiEvidenceScope,
): { item: CvExperienceSuggestion | null; changed: boolean } {
  let changed = false
  const jobTitle = findSupportedCell(text, item.jobTitle)
  if (!jobTitle) return { item: null, changed: true }

  // A project is not a work engagement: it never becomes an experience item.
  if (isProjectLikeTitle(jobTitle)) return { item: null, changed: true }

  // The role must be stated in the CV's experience section.
  if (!mentions(scope.experience, jobTitle)) return { item: null, changed: true }

  const companyName = findSupportedCell(text, item.companyName) || ''
  if (item.companyName && !companyName) changed = true
  const location = findSupportedCell(text, item.location) || ''
  if (item.location && !location) changed = true
  const startDate = item.startDate ? findSupportedCell(text, item.startDate, { splitDates: true }) || '' : ''
  if (item.startDate && !startDate) changed = true
  const endDate = item.endDate ? findSupportedCell(text, item.endDate, { splitDates: true }) || '' : ''
  if (item.endDate && !endDate) changed = true
  const description = item.description ? findSupportedBlock(text, item.description) || '' : ''
  if (item.description && !description) changed = true

  let isCurrent = item.isCurrent
  if (isCurrent && !hasCurrentMarkerForItem(text, item)) {
    isCurrent = false
    changed = true
  }

  // Employment evidence: a stated period, an employer/client cue, or an
  // employer named in the entry itself. Same rule as the local extractor.
  if (!hasEmploymentEvidence({ startDate, endDate }, {
    title: jobTitle,
    employer: companyName,
    text: employmentContextFor(text, jobTitle),
  })) {
    return { item: null, changed: true }
  }

  return {
    item: {
      jobTitle,
      companyName,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
    },
    changed,
  }
}

function filterEducation(
  item: CvEducationSuggestion,
  text: string,
  scope: AiEvidenceScope,
): { item: CvEducationSuggestion | null; changed: boolean } {
  let changed = false
  const title = findSupportedCell(text, item.title, { splitCommas: true })
  if (!title) return { item: null, changed: true }

  // The entry must be stated in the CV's education section.
  if (!mentions(scope.education, title)) return { item: null, changed: true }

  const institution = findSupportedCell(text, item.institution, { splitCommas: true }) || ''
  if (item.institution && !institution) changed = true
  const date = item.date ? findSupportedCell(text, item.date, { splitDates: true }) || '' : ''
  if (item.date && !date) changed = true
  const description = item.description ? findSupportedBlock(text, item.description) || '' : ''
  if (item.description && !description) changed = true

  // Only real education entries (degree, study program, school).
  if (!isEducationLikeEntry(title, institution)) return { item: null, changed: true }

  return {
    item: { title, institution, date, description },
    changed,
  }
}

function filterSkillGroups(
  groups: CvSkillGroupSuggestion[],
  text: string,
  explicitGroups: CvSkillGroupSuggestion[] = extractExplicitSkillGroups(text),
): { groups: CvSkillGroupSuggestion[]; changed: boolean } {
  let changed = false
  const seenSkills = new Set<string>()
  const result: CvSkillGroupSuggestion[] = []
  const byName = new Map<string, CvSkillGroupSuggestion>()
  const neutralName = /[\u0600-\u06FF]/.test(text) ? GENERAL_SKILL_GROUP_AR : GENERAL_SKILL_GROUP_EN

  const explicitBySkill = new Map<string, string>()
  const explicitSkillText = new Map<string, string>()
  for (const group of explicitGroups) {
    for (const skill of group.skills) {
      const key = canonical(skill).toLowerCase()
      if (!explicitBySkill.has(key)) {
        explicitBySkill.set(key, group.name)
        explicitSkillText.set(key, skill)
      }
    }
  }

  for (const group of groups) {
    const aiGroupName = canonical(group.name)
    for (const skill of group.skills) {
      // Only skills the CV itself lists as skills are accepted. A technology
      // that only appears inside a project or a job description is not a skill.
      const key = canonical(skill).toLowerCase()
      const supported = explicitSkillText.get(key)
      if (!supported) {
        changed = true
        continue
      }
      if (seenSkills.has(key)) continue

      // Categories come only from the CV's explicit skill-group evidence.
      // AI group names are never trusted on their own.
      const targetName = explicitBySkill.get(key) || neutralName
      if (canonical(targetName).toLowerCase() !== aiGroupName.toLowerCase()) changed = true

      const nameKey = canonical(targetName).toLowerCase()
      let target = byName.get(nameKey)
      if (!target) {
        target = { name: targetName, skills: [] }
        byName.set(nameKey, target)
        result.push(target)
      }
      if (target.skills.length >= MAX_SKILLS_PER_GROUP) {
        changed = true
        continue
      }
      seenSkills.add(key)
      target.skills.push(supported)
    }
  }

  const nonEmpty = result.filter((group) => group.skills.length > 0)
  if (nonEmpty.length !== result.length) changed = true
  let total = 0
  const capped: CvSkillGroupSuggestion[] = []
  for (const group of nonEmpty) {
    if (capped.length >= MAX_SKILL_GROUPS || total >= MAX_TOTAL_SKILLS) {
      changed = true
      break
    }
    const skills = group.skills.slice(0, Math.min(MAX_SKILLS_PER_GROUP, MAX_TOTAL_SKILLS - total))
    if (skills.length !== group.skills.length) changed = true
    if (skills.length > 0) {
      capped.push({ name: group.name, skills })
      total += skills.length
    }
  }
  return { groups: capped, changed }
}

/**
 * Server-side guard for AI suggestions. Every returned string must be copied
 * from the CV (case/whitespace are mapped back to the CV's original text).
 * Unsupported values are dropped or moved to the neutral skill group; they are
 * never repaired, paraphrased, translated, or guessed.
 */
export function filterAiFieldsToCv(
  fields: CvAiFields,
  cvText: string,
  explicitSkillGroups?: CvSkillGroupSuggestion[],
): AiSupportResult {
  const filtered: CvAiFields = {}
  const scope = buildEvidenceScope(cvText)
  let changed = false

  // Name, professional title and location are personal header fields: they
  // must come from the CV header, never from a job, a project or a school.
  const displayName = filterScalar(fields.displayName, cvText, 'cell', scope.header)
  if (displayName.changed) changed = true
  if (displayName.value) filtered.displayName = displayName.value

  const professionalTitle = filterScalar(fields.professionalTitle, cvText, 'cell', scope.header)
  if (professionalTitle.changed) changed = true
  if (professionalTitle.value) filtered.professionalTitle = professionalTitle.value

  const location = filterScalar(fields.location, cvText, 'cell', scope.header)
  if (location.changed) changed = true
  if (location.value) filtered.location = location.value

  const bio = filterScalar(fields.bio, cvText, 'block', scope.summary)
  if (bio.changed) changed = true
  if (bio.value) filtered.bio = bio.value

  if (fields.skillGroups) {
    const skillGroups = filterSkillGroups(fields.skillGroups, cvText, explicitSkillGroups)
    if (skillGroups.changed) changed = true
    if (skillGroups.groups.length > 0) filtered.skillGroups = skillGroups.groups
  }

  if (fields.experience) {
    const experience: CvExperienceSuggestion[] = []
    for (const item of fields.experience) {
      const result = filterExperience(item, cvText, scope)
      if (result.changed) changed = true
      if (result.item) experience.push(result.item)
    }
    if (experience.length > 0) filtered.experience = experience
  }

  if (fields.education) {
    const education: CvEducationSuggestion[] = []
    for (const item of fields.education) {
      const result = filterEducation(item, cvText, scope)
      if (result.changed) changed = true
      if (result.item) education.push(result.item)
    }
    if (education.length > 0) filtered.education = education
  }

  return { fields: filtered, filtered: changed }
}
