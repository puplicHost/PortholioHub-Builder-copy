/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getEntitlements } from '@/lib/entitlements'
import { getEffectiveLimits } from '@/lib/subscriptions'
import { validateSections } from '@/lib/portfolio-schema'
import {
  cvApprovedPayloadSchema,
  type CvApprovedEducation,
  type CvApprovedExperience,
  type CvApprovedSkillGroup,
} from '@/lib/cv-import/schema'
import {
  MAX_SKILLS_PER_GROUP,
  MAX_SKILL_GROUPS,
  MAX_TOTAL_SKILLS,
} from '@/lib/cv-import/types'

const MAX_SECTIONS = 30
const MAX_EXPERIENCE = 30
const MAX_EDUCATION = 30

type JsonRecord = Record<string, any>

class VersionConflictError extends Error {
  readonly currentVersion?: number

  constructor(currentVersion?: number) {
    super('VERSION_CONFLICT')
    this.name = 'VersionConflictError'
    this.currentVersion = currentVersion
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {}
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function bilingual(value: unknown, lang: 'en' | 'ar'): string {
  if (typeof value === 'string') return value
  const record = asRecord(value)
  return typeof record[lang] === 'string' ? record[lang] : ''
}

function flatText(value: unknown): string {
  if (typeof value === 'string') return value
  const record = asRecord(value)
  return typeof record.en === 'string' && record.en.trim()
    ? record.en
    : typeof record.ar === 'string'
      ? record.ar
      : ''
}

function mergeBilingual(existing: unknown, lang: 'en' | 'ar', value: string): JsonRecord {
  const base = typeof existing === 'string' ? { en: existing } : asRecord(existing)
  return { ...base, [lang]: value }
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function sectionByType(sections: any[], type: string): any | null {
  return sections.find((section) => section?.sectionType === type) || null
}

function currentScalar(
  localized: JsonRecord,
  sections: any[],
  field: 'displayName' | 'professionalTitle' | 'location' | 'bio',
  lang: 'en' | 'ar',
): string {
  if (field === 'professionalTitle') {
    const direct = bilingual(localized.professionalTitle, lang)
    if (direct.trim()) return direct
    const hero = sectionByType(sections, 'hero')
    return bilingual(asRecord(hero?.content).subtitle, lang)
  }
  if (field === 'bio') {
    const direct = bilingual(localized.bio, lang)
    if (direct.trim()) return direct
    const about = sectionByType(sections, 'about')
    const content = asRecord(about?.content)
    return bilingual(content.biography, lang) || bilingual(content.text, lang)
  }
  return bilingual(localized[field], lang)
}

function skillName(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  const record = asRecord(value)
  return typeof record.name === 'string' ? record.name.trim() : ''
}

function isGeneralSkillGroupName(name: string): boolean {
  const key = normalizeKey(name)
  return key === 'skills'
    || key === 'general'
    || key === 'general skills'
    || key === 'other skills'
    || key === 'مهارات'
    || key === 'المهارات'
    || key === 'مهارات عامة'
    || key === 'المهارات العامة'
    || key === 'مهارات أخرى'
    || key === 'المهارات الأخرى'
}

function appendSkillGroups(
  content: JsonRecord,
  inputGroups: CvApprovedSkillGroup[],
): {
  content: JsonRecord
  added: number
  skipped: number
  limitReached?: 'SKILL_GROUP_LIMIT_REACHED'
} {
  const groups: JsonRecord[] = asArray(content.groups).map((group) => {
    const record = asRecord(group)
    return {
      ...record,
      skills: Array.isArray(record.skills)
        ? record.skills
        : record.skills
          ? [record.skills]
          : [],
    }
  })

  const legacySkills = asArray(content.skills).filter((item): item is string => typeof item === 'string')
  if (groups.length === 0 && legacySkills.length > 0) {
    groups.push({
      name: 'Skills',
      skills: legacySkills.map((name) => ({ name })),
    })
  }

  const seenSkills = new Set<string>()
  let total = 0
  for (const group of groups) {
    for (const skill of asArray(group.skills)) {
      const name = skillName(skill)
      if (name) seenSkills.add(normalizeKey(name))
      total += 1
    }
  }

  let added = 0
  let skipped = 0

  for (const inputGroup of inputGroups) {
    const groupName = String(inputGroup.name || '').trim().slice(0, 60)
    if (!groupName) continue

    const pending: string[] = []
    for (const rawSkill of inputGroup.skills) {
      const skill = String(rawSkill || '').trim().slice(0, 60)
      if (!skill) continue
      const key = normalizeKey(skill)
      if (seenSkills.has(key)) {
        skipped += 1
        continue
      }
      pending.push(skill)
    }
    if (pending.length === 0) continue
    if (total >= MAX_TOTAL_SKILLS) {
      skipped += pending.length
      continue
    }

    let target: JsonRecord | undefined = groups.find((group) => normalizeKey(String(group.name || '')) === normalizeKey(groupName))
    if (!target && isGeneralSkillGroupName(groupName)) {
      target = groups.find((group) => isGeneralSkillGroupName(String(group.name || '')))
    }

    if (!target) {
      if (groups.length >= MAX_SKILL_GROUPS) {
        return { content, added, skipped, limitReached: 'SKILL_GROUP_LIMIT_REACHED' }
      }
      target = { name: groupName, skills: [] }
      groups.push(target)
    }
    const targetGroup: JsonRecord = target

    for (const skill of pending) {
      if (total >= MAX_TOTAL_SKILLS) {
        skipped += 1
        continue
      }
      const targetSkills = asArray(targetGroup.skills)
      if (targetSkills.length >= MAX_SKILLS_PER_GROUP) {
        skipped += 1
        continue
      }
      const key = normalizeKey(skill)
      if (seenSkills.has(key)) {
        skipped += 1
        continue
      }
      seenSkills.add(key)
      targetGroup.skills = [...targetSkills, { name: skill }]
      total += 1
      added += 1
    }
  }

  if (added === 0) {
    return { content, added: 0, skipped }
  }

  return {
    content: {
      ...content,
      displayMode: typeof content.displayMode === 'string' ? content.displayMode : 'chips',
      groups,
    },
    added,
    skipped,
  }
}

function appendExperience(content: JsonRecord, items: CvApprovedExperience[]): { content: JsonRecord; added: number } {
  const existing = asArray(content.items)
  const existingKeys = new Set(
    existing.map((item) => {
      const record = asRecord(item)
      return `${normalizeKey(flatText(record.jobTitle))}|${normalizeKey(flatText(record.companyName || record.company))}|${String(record.startDate || '')}`
    }),
  )

  const additions: any[] = []
  for (const item of items) {
    if (existing.length + additions.length >= MAX_EXPERIENCE) break
    const key = `${normalizeKey(item.jobTitle)}|${normalizeKey(item.companyName)}|${item.startDate}`
    if (existingKeys.has(key)) continue
    existingKeys.add(key)
    additions.push({
      id: randomUUID(),
      jobTitle: item.jobTitle,
      companyName: item.companyName,
      location: item.location,
      startDate: item.startDate,
      endDate: item.isCurrent ? '' : item.endDate,
      isCurrent: item.isCurrent,
      description: item.description,
    })
  }

  if (additions.length === 0) return { content, added: 0 }
  return {
    content: { ...content, items: [...existing, ...additions].slice(0, MAX_EXPERIENCE) },
    added: additions.length,
  }
}

function appendEducation(content: JsonRecord, items: CvApprovedEducation[]): { content: JsonRecord; added: number } {
  const existing = asArray(content.items)
  const existingKeys = new Set(
    existing.map((item) => {
      const record = asRecord(item)
      return `${normalizeKey(flatText(record.title))}|${normalizeKey(flatText(record.institution))}|${normalizeKey(String(record.date || ''))}`
    }),
  )

  const additions: any[] = []
  for (const item of items) {
    if (existing.length + additions.length >= MAX_EDUCATION) break
    const key = `${normalizeKey(item.title)}|${normalizeKey(item.institution)}|${normalizeKey(item.date)}`
    if (existingKeys.has(key)) continue
    existingKeys.add(key)
    additions.push({
      id: randomUUID(),
      title: item.title,
      institution: item.institution,
      date: item.date,
      description: item.description,
    })
  }

  if (additions.length === 0) return { content, added: 0 }
  return {
    content: { ...content, items: [...existing, ...additions].slice(0, MAX_EDUCATION) },
    added: additions.length,
  }
}

function fail(code: string, error: string, fields?: string[]) {
  return { success: false as const, code, error, ...(fields ? { fields } : {}) }
}

export async function applyCvSuggestions(input: unknown) {
  const user = await getCurrentUser()
  if (!user) return fail('UNAUTHORIZED', 'Please log in first')

  try {
    const entitlements = await getEntitlements(user.id)
    if (entitlements.isFree) {
      return fail('SUBSCRIPTION_REQUIRED', 'CV import requires a paid plan')
    }
  } catch {
    return fail('SERVICE_UNAVAILABLE', 'Could not verify your plan. Please try again.')
  }

  const parsed = cvApprovedPayloadSchema.safeParse(input)
  if (!parsed.success) {
    const paths = parsed.error.issues
      .slice(0, 5)
      .map((issue) => issue.path.join('.'))
      .filter(Boolean)
    return fail('VALIDATION_ERROR', 'Invalid CV suggestions', paths)
  }

  const { expectedVersion, approved } = parsed.data

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    include: {
      pages: {
        where: { slug: 'home' },
        include: { sections: { orderBy: { sectionOrder: 'asc' } } },
      },
    },
  })
  if (!profile) return fail('PROFILE_NOT_FOUND', 'Profile not found')
  const home = profile.pages[0]
  if (!home) return fail('PROFILE_NOT_FOUND', 'Profile home page not found')

  const sections = home.sections as any[]
  const localized = asRecord(profile.localized)
  const overwriteRequired: string[] = []

  if (approved.displayName && currentScalar(localized, sections, 'displayName', approved.displayName.lang).trim() && approved.displayName.overwrite !== true) {
    overwriteRequired.push('displayName')
  }
  if (approved.professionalTitle && currentScalar(localized, sections, 'professionalTitle', approved.professionalTitle.lang).trim() && approved.professionalTitle.overwrite !== true) {
    overwriteRequired.push('professionalTitle')
  }
  if (approved.location && currentScalar(localized, sections, 'location', approved.location.lang).trim() && approved.location.overwrite !== true) {
    overwriteRequired.push('location')
  }
  if (approved.bio && currentScalar(localized, sections, 'bio', approved.bio.lang).trim() && approved.bio.overwrite !== true) {
    overwriteRequired.push('bio')
  }

  if (overwriteRequired.length > 0) {
    return {
      ...fail('OVERWRITE_CONFIRMATION_REQUIRED', 'Confirm replacement for fields that already have content', overwriteRequired),
      overwriteFields: overwriteRequired,
    }
  }

  const localizedNext: JsonRecord = { ...localized }
  const sectionUpdates = new Map<string, JsonRecord>()
  const sectionCreates: { sectionType: string; content: JsonRecord }[] = []
  const applied = {
    displayName: false,
    professionalTitle: false,
    location: false,
    bio: false,
    skills: 0,
    experience: 0,
    education: 0,
  }
  let skippedSkills = 0

  if (approved.displayName) {
    localizedNext.displayName = mergeBilingual(localized.displayName, approved.displayName.lang, approved.displayName.value)
    applied.displayName = true
  }
  if (approved.professionalTitle) {
    localizedNext.professionalTitle = mergeBilingual(
      localized.professionalTitle,
      approved.professionalTitle.lang,
      approved.professionalTitle.value,
    )
    const hero = sectionByType(sections, 'hero')
    if (hero) {
      const content = asRecord(hero.content)
      sectionUpdates.set(hero.id, {
        ...content,
        subtitle: mergeBilingual(content.subtitle, approved.professionalTitle.lang, approved.professionalTitle.value),
      })
    }
    applied.professionalTitle = true
  }
  if (approved.location) {
    localizedNext.location = mergeBilingual(localized.location, approved.location.lang, approved.location.value)
    applied.location = true
  }
  if (approved.bio) {
    localizedNext.bio = mergeBilingual(localized.bio, approved.bio.lang, approved.bio.value)
    const about = sectionByType(sections, 'about')
    if (about) {
      const content = asRecord(about.content)
      sectionUpdates.set(about.id, {
        ...content,
        biography: mergeBilingual(content.biography ?? content.text, approved.bio.lang, approved.bio.value),
      })
    }
    applied.bio = true
  }

  if (approved.skillGroups) {
    const skillsSection = sectionByType(sections, 'skills')
    if (skillsSection) {
      const next = appendSkillGroups(asRecord(skillsSection.content), approved.skillGroups.groups)
      if (next.limitReached) {
        return fail('SKILL_GROUP_LIMIT_REACHED', 'Your profile already has the maximum number of skill groups')
      }
      skippedSkills += next.skipped
      if (next.added > 0) {
        sectionUpdates.set(skillsSection.id, next.content)
        applied.skills = next.added
      }
    } else {
      const next = appendSkillGroups({ displayMode: 'chips', groups: [] }, approved.skillGroups.groups)
      if (next.limitReached) {
        return fail('SKILL_GROUP_LIMIT_REACHED', 'Your profile already has the maximum number of skill groups')
      }
      skippedSkills += next.skipped
      if (next.added > 0) {
        sectionCreates.push({ sectionType: 'skills', content: next.content })
        applied.skills = next.added
      }
    }
  }

  if (approved.experience) {
    const experienceSection = sectionByType(sections, 'experience')
    if (experienceSection) {
      const next = appendExperience(asRecord(experienceSection.content), approved.experience.items)
      if (next.added > 0) {
        sectionUpdates.set(experienceSection.id, next.content)
        applied.experience = next.added
      }
    } else {
      const next = appendExperience({}, approved.experience.items)
      if (next.added > 0) {
        sectionCreates.push({
          sectionType: 'experience',
          content: {
            heading: { en: 'Work Experience', ar: 'الخبرات العملية' },
            description: { en: '', ar: '' },
            ...next.content,
          },
        })
        applied.experience = next.added
      }
    }
  }

  if (approved.education) {
    const educationSection = sectionByType(sections, 'education')
    if (educationSection) {
      const next = appendEducation(asRecord(educationSection.content), approved.education.items)
      if (next.added > 0) {
        sectionUpdates.set(educationSection.id, next.content)
        applied.education = next.added
      }
    } else {
      const next = appendEducation({}, approved.education.items)
      if (next.added > 0) {
        sectionCreates.push({
          sectionType: 'education',
          content: {
            title: { en: 'Education', ar: 'التعليم' },
            description: { en: '', ar: '' },
            ...next.content,
          },
        })
        applied.education = next.added
      }
    }
  }

  if (Object.values(applied).every((value) => value === false || value === 0)) {
    return { success: true, version: expectedVersion, applied, skippedSkills, unchanged: true }
  }

  let maxSections = MAX_SECTIONS
  if (sectionCreates.length > 0) {
    try {
      const limits = await getEffectiveLimits(user.id)
      const planLimit = Number(limits.maxSections)
      maxSections = Math.min(
        MAX_SECTIONS,
        Number.isFinite(planLimit) ? Math.max(0, planLimit) : MAX_SECTIONS,
      )
    } catch {
      return fail('SERVICE_UNAVAILABLE', 'Could not verify plan limits. Please try again.')
    }
    if (sections.length + sectionCreates.length > maxSections) {
      return fail('SECTION_LIMIT_REACHED', 'Your plan does not allow another profile section')
    }
  }

  for (const [sectionId, content] of sectionUpdates) {
    const section = sections.find((item) => item.id === sectionId)
    if (!section) return fail('VALIDATION_ERROR', 'Section not found')
    const check = validateSections([{
      id: section.id,
      sectionType: section.sectionType,
      sectionOrder: section.sectionOrder,
      content,
      settings: section.settings ?? {},
    }])
    if (!check.ok) return fail('VALIDATION_ERROR', 'One of the suggestions is not valid')
  }

  const maxOrder = sections.reduce((max, section) => Math.max(max, Number(section.sectionOrder) || 0), 0)
  for (let index = 0; index < sectionCreates.length; index += 1) {
    const section = sectionCreates[index]
    const sectionOrder = maxOrder + index + 1
    if (sectionOrder > 1000) return fail('SECTION_LIMIT_REACHED', 'Section order limit reached')
    const check = validateSections([{
      sectionType: section.sectionType,
      sectionOrder,
      content: section.content,
      settings: { isVisible: true },
    }])
    if (!check.ok) return fail('VALIDATION_ERROR', 'One of the suggestions is not valid')
  }

  let nextVersion = expectedVersion
  try {
    nextVersion = await prisma.$transaction(async (tx) => {
      const fresh = await tx.userProfile.findUnique({
        where: { userId: user.id },
        select: { version: true, username: true },
      })
      if (!fresh) throw new Error('PROFILE_NOT_FOUND')
      if (fresh.version !== expectedVersion) throw new VersionConflictError(fresh.version)

      for (const [sectionId, content] of sectionUpdates) {
        const updated = await tx.pageSection.updateMany({
          where: { id: sectionId, page: { profileId: profile.id } },
          data: { content: content as any },
        })
        if (updated.count !== 1) throw new Error('SECTION_CHANGED')
      }

      for (let index = 0; index < sectionCreates.length; index += 1) {
        const section = sectionCreates[index]
        await tx.pageSection.create({
          data: {
            pageId: home.id,
            sectionType: section.sectionType,
            sectionOrder: maxOrder + index + 1,
            content: section.content as any,
            settings: { isVisible: true } as any,
          },
        })
      }

      const bumped = await tx.userProfile.updateMany({
        where: { userId: user.id, version: expectedVersion },
        data: {
          localized: localizedNext as any,
          version: { increment: 1 },
        },
      })
      if (bumped.count === 0) throw new VersionConflictError(expectedVersion)

      const row = await tx.userProfile.findUnique({
        where: { userId: user.id },
        select: { version: true },
      })
      return row?.version ?? expectedVersion + 1
    }, { maxWait: 10_000, timeout: 20_000 })
  } catch (error) {
    if (error instanceof VersionConflictError) {
      return {
        success: false as const,
        code: 'VERSION_CONFLICT',
        error: 'Someone else saved changes. Reload and try again.',
        currentVersion: error.currentVersion,
      }
    }
    const name = (error as { name?: string })?.name || 'Error'
    console.error('[cv-import] apply failed', { name })
    return fail('INTERNAL_ERROR', 'Could not apply the selected suggestions')
  }

  after(() => {
    try {
      revalidatePath('/profile/builder')
      revalidatePath(`/u/${profile.username}`)
    } catch {
      /* revalidation is best-effort */
    }
  })

  return { success: true as const, version: nextVersion, applied, skippedSkills }
}
