import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { User } from '@prisma/client'
import { normalizeContactUrl } from '@/lib/contact'

export const FREE_PORTFOLIO_ITEM_LIMIT = 999
export const FREE_CONTACT_LINK_LIMIT = 99
export const PRO_PLAN_NAME = 'pro'

export type Lang = 'ar' | 'en'

export const LANGS: Lang[] = ['ar', 'en']

export interface LString {
  ar: string
  en: string
}

/** Migrate a legacy string (or a localized pair) into an LString. */
export function toLString(value?: string | null | Partial<LString>): LString {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ar: String(value.ar ?? ''), en: String(value.en ?? '') }
  }
  return { ar: String(value ?? ''), en: '' }
}

/** Migrate a legacy string[] (or a localized pair) into a localized array. */
export function toLStringArray(value?: string[] | { ar?: string[]; en?: string[] }): { ar: string[]; en: string[] } {
  if (value && !Array.isArray(value) && typeof value === 'object') {
    return { ar: (value.ar ?? []).map(String), en: (value.en ?? []).map(String) }
  }
  return { ar: Array.isArray(value) ? value.map(String) : [], en: [] }
}

/** Fallback picker: prefer `lang`, else Arabic, else whatever is present. */
export function pickLString(lang: Lang, value?: Partial<LString> | null): string {
  if (!value || typeof value !== 'object') return String(value ?? '')
  const en = String(value.en ?? '')
  const ar = String(value.ar ?? '')
  if (lang === 'en' && en) return en
  if (ar) return ar
  return en
}

/** Fallback picker for localized arrays (skills/tags). */
export function pickLStringArray(lang: Lang, value?: { ar?: string[]; en?: string[] } | string[] | null): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'object') {
    const en = (value.en ?? []).map(String).filter(Boolean)
    const ar = (value.ar ?? []).map(String).filter(Boolean)
    if (lang === 'en' && en.length) return en
    return ar.length ? ar : en
  }
  return []
}

export interface ContactLink {
  label: string
  url: string
}

export interface StatItem {
  number: string
  label: string
  icon?: string
}

export interface ExperienceItem {
  title: string
  company: string
  period: string
  description: string
}

export interface ProfileExperience {
  id: string
  jobTitle: Partial<LString>
  company: Partial<LString>
  location: Partial<LString>
  startDate: string
  endDate: string
  current: boolean
  description: Partial<LString>
}

export interface ProfileEducation {
  id: string
  degree: Partial<LString>
  institution: Partial<LString>
  fieldOfStudy: Partial<LString>
  location: Partial<LString>
  startDate: string
  endDate: string
  current: boolean
  description: Partial<LString>
}

export interface ProjectItem {
  id: string
  title: Partial<LString>
  imageUrl: string | null
  description: Partial<LString>
  projectLink: string
  tags: string[]
  relatedContent?: string[]
}

export interface Appearance {
  theme?: 'minimal' | 'dark' | 'warm' | 'bold' | 'soft' | 'glass'
  template?: 'classic-dark' | 'minimal-light' | 'arabic-pro'
  accent?: string
  accentColor?: string
  colorMode?: 'light' | 'dark'
  defaultLanguage?: Lang
  publicTheme?: 'light' | 'dark'
  bgColor?: string
  textColor?: string
  cardColor?: string
  lightPrimary?: string
  lightBg?: string
  lightSurface?: string
  lightCard?: string
  lightText?: string
  lightMuted?: string
  darkPrimary?: string
  darkBg?: string
  darkSurface?: string
  darkCard?: string
  darkText?: string
  darkMuted?: string
  font?: 'inter' | 'playfair' | 'mono' | 'satoshi'
  layout?: 'stack' | 'grid' | 'sidebar'
  hideBadge?: boolean
  stats?: StatItem[]
  experiences?: ExperienceItem[]
}

export interface PortfolioItemView {
  id: string
  contentId: string
  sortOrder: number
  title: string
  caption: string
  mediaUrls: string[]
  platform: string
}

export interface TestimonialView {
  id: string
  author: string
  role: string | null
  body: string
  sortOrder: number
}

export interface ServiceView {
  id: string
  title: string
  description: string | null
  price: string | null
  sortOrder: number
}

export interface LocalizedProfile {
  displayName: Partial<LString>
  professionalTitle: Partial<LString>
  bio: Partial<LString>
  location: Partial<LString>
  skills: { ar: string[]; en: string[] }
}

export interface ProfileView {
  id: string
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
  professionalTitle: string | null
  location: string | null
  skills: string[]
  experience: ProfileExperience[]
  education: ProfileEducation[]
  projects: ProjectItem[]
  contactLinks: ContactLink[]
  appearance: Appearance | null
  localized: LocalizedProfile
  portfolioItems: PortfolioItemView[]
  testimonials: TestimonialView[]
  services: ServiceView[]
}

export interface ProfileInput {
  displayName?: string
  username?: string
  bio?: string
  avatarUrl?: string
  professionalTitle?: string
  location?: string
  skills?: string[]
  experience?: ProfileExperience[]
  education?: ProfileEducation[]
  projects?: ProjectItem[]
  contactLinks?: ContactLink[]
  appearance?: Appearance | null
  localized?: Partial<Record<keyof LocalizedProfile, Partial<LString> | { ar: string[]; en: string[] }>>
  portfolioItemIds?: string[]
  testimonials?: Omit<TestimonialView, 'id' | 'sortOrder'>[]
  services?: Omit<ServiceView, 'id' | 'sortOrder'>[]
}

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  return slug
}

// Plan Phase 5 §24: 3–30 chars, lowercase alphanumerics with interior
// single hyphens only.
export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){1,28}[a-z0-9]$/

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'app', 'u', 'login', 'register',
  'dev', 'uploads', 'upload', 'www', 'support', 'settings', 'help',
  'about', 'terms', 'privacy', 'blog', 'status', 'health', 'sitemap',
  'robots', 'favicon', 'static', 'public', 'cdn', 'mail', 'email',
  'test', 'demo', 'null', 'undefined', 'root', 'system', 'portfolio',
  'portfolios', 'user', 'users', 'account', 'dashboard', 'builder',
  'site', 'web', 'home', 'contact', 'workspace', 'workspaces',
])

// Returns an error message when the username is unusable, else null.
export function validateUsername(username: string): string | null {
  const normalized = username.toLowerCase().trim()
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Username must be 3-30 lowercase letters, digits, or hyphens (not at the ends)'
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return 'This username is reserved'
  }
  return null
}

function randomSuffix(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

async function generateUsername(base: string): Promise<string> {
  let candidate = slugify(base) || 'user'
  if (candidate.length < 3) candidate = (candidate + 'user').slice(0, 30)
  const exists = async (u: string) => !!(await prisma.userProfile.findUnique({ where: { username: u } }))
  if (!(await exists(candidate))) return candidate
  let attempt = 0
  while (attempt < 10) {
    const withSuffix = `${candidate}-${randomSuffix()}`
    if (!(await exists(withSuffix))) return withSuffix
    attempt++
  }
  return `${candidate}-${randomSuffix()}${randomSuffix()}`
}

function parseContactLinks(value: unknown): ContactLink[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((l) => l && typeof l === 'object')
    .map((l) => ({ label: String((l as ContactLink).label ?? ''), url: String((l as ContactLink).url ?? '') }))
}

function parseAppearance(value: unknown): Appearance | null {
  if (!value || typeof value !== 'object') return null
  return value as Appearance
}

function parseProfileExperience(value: unknown): ProfileExperience[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((e) => e && typeof e === 'object')
    .map((e) => {
      const item = e as Record<string, unknown>
      return {
        id: String(item.id ?? crypto.randomUUID()),
        jobTitle: toLString(item.jobTitle as string | null),
        company: toLString(item.company as string | null),
        location: toLString(item.location as string | null),
        startDate: String(item.startDate ?? ''),
        endDate: String(item.endDate ?? ''),
        current: Boolean(item.current ?? false),
        description: toLString(item.description as string | null),
      }
    })
}

function parseProfileEducation(value: unknown): ProfileEducation[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((e) => e && typeof e === 'object')
    .map((e) => {
      const item = e as Record<string, unknown>
      return {
        id: String(item.id ?? crypto.randomUUID()),
        degree: toLString(item.degree as string | null),
        institution: toLString(item.institution as string | null),
        fieldOfStudy: toLString(item.fieldOfStudy as string | null),
        location: toLString(item.location as string | null),
        startDate: String(item.startDate ?? ''),
        endDate: String(item.endDate ?? ''),
        current: Boolean(item.current ?? false),
        description: toLString(item.description as string | null),
      }
    })
}

function parseProjects(value: unknown): ProjectItem[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((p) => p && typeof p === 'object')
    .map((p) => {
      const item = p as Record<string, unknown>
      const tags = Array.isArray(item.tags) ? (item.tags as unknown[]).map((t) => String(t)) : []
      const relatedContent = Array.isArray(item.relatedContent)
        ? (item.relatedContent as unknown[]).map((c) => String(c))
        : undefined
      return {
        id: String(item.id ?? crypto.randomUUID()),
        title: toLString(item.title as string | null),
        imageUrl: item.imageUrl ? String(item.imageUrl) : null,
        description: toLString(item.description as string | null),
        projectLink: String(item.projectLink ?? ''),
        tags,
        relatedContent,
      }
    })
}

type UserProfileWithRelations = Prisma.UserProfileGetPayload<{
  include: { testimonials: true; services: true }
}>

function parseLocalized(row: UserProfileWithRelations): LocalizedProfile {
  const raw = (row.localized ?? {}) as Record<string, unknown>
  return {
    displayName: toLString(raw.displayName as string | null) || toLString(row.displayName),
    professionalTitle: toLString(raw.professionalTitle as string | null) || toLString(row.professionalTitle),
    bio: toLString(raw.bio as string | null) || toLString(row.bio),
    location: toLString(raw.location as string | null) || toLString(row.location),
    skills: toLStringArray((raw.skills as { ar: string[]; en: string[] } | undefined) ?? row.skills),
  }
}

function mapProfile(row: UserProfileWithRelations): ProfileView {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    professionalTitle: row.professionalTitle ?? null,
    location: row.location ?? null,
    skills: row.skills ?? [],
    experience: parseProfileExperience(row.experience),
    education: parseProfileEducation(row.education),
    projects: parseProjects(row.projects),
    contactLinks: parseContactLinks(row.contactLinks),
    appearance: parseAppearance(row.appearance),
    localized: parseLocalized(row),
    portfolioItems: [],
    testimonials: row.testimonials
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t) => ({ id: t.id, author: t.author, role: t.role, body: t.body, sortOrder: t.sortOrder })),
    services: row.services
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ id: s.id, title: s.title, description: s.description, price: s.price, sortOrder: s.sortOrder })),
  }
}

async function getProfileRow(userId: string) {
  return prisma.userProfile.findUnique({
    where: { userId },
    include: {
      testimonials: true,
      services: true,
    },
  })
}

export async function getOrCreateProfile(user: User): Promise<ProfileView> {
  const existing = await getProfileRow(user.id)
  if (existing) return mapProfile(existing)

  const username = await generateUsername(user.displayName || user.email?.split('@')[0] || 'user')
  const created = await prisma.userProfile.create({
    data: {
      userId: user.id,
      username,
      displayName: user.displayName ?? null,
      avatarUrl: user.avatarUrl ?? null,
    },
    include: {
      testimonials: true,
      services: true,
    },
  })
  return mapProfile(created)
}

export async function getProfileByUserId(userId: string): Promise<ProfileView | null> {
  const row = await getProfileRow(userId)
  if (!row) return null
  return mapProfile(row)
}

export async function upsertProfileData(userId: string, input: ProfileInput): Promise<ProfileView> {
  const data: Prisma.UserProfileUncheckedUpdateInput = {}

  // Sync the legacy scalar Arabic columns (kept for backward compatibility / external consumers)
  // whenever localized values are provided.
  if (input.localized) {
    const loc = input.localized
    if (loc && typeof loc === 'object') {
      const ar = (field: keyof typeof loc) => {
        const v = loc[field]
        if (v && typeof v === 'object' && !Array.isArray(v)) return String((v as Partial<LString>).ar ?? '')
        return String(v ?? '')
      }
      if (loc.displayName !== undefined) data.displayName = ar('displayName')
      if (loc.bio !== undefined) data.bio = ar('bio').slice(0, 2000)
      if (loc.professionalTitle !== undefined) data.professionalTitle = ar('professionalTitle').slice(0, 120)
      if (loc.location !== undefined) data.location = ar('location').slice(0, 120)
      const localizedSkills = loc.skills
      if (localizedSkills && typeof localizedSkills === 'object' && Array.isArray(localizedSkills.ar)) {
        data.skills = localizedSkills.ar.map(String).slice(0, 50)
      }
      data.localized = loc as Prisma.InputJsonValue
    }
  }

  if (typeof input.displayName === 'string') data.displayName = input.displayName
  if (typeof input.bio === 'string') data.bio = input.bio.slice(0, 2000)
  if (typeof input.avatarUrl === 'string') data.avatarUrl = input.avatarUrl
  if (typeof input.professionalTitle === 'string') data.professionalTitle = input.professionalTitle.slice(0, 120)
  if (typeof input.location === 'string') data.location = input.location.slice(0, 120)
  if (Array.isArray(input.skills)) data.skills = input.skills.map((s) => String(s)).slice(0, 50)


  if (Array.isArray(input.experience)) {
    data.experience = input.experience.map((e) => ({
      id: e.id || crypto.randomUUID(),
      jobTitle: e.jobTitle,
      company: e.company,
      location: e.location ?? '',
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.description,
    })) as Prisma.InputJsonValue
  }

  if (Array.isArray(input.education)) {
    data.education = input.education.map((e) => ({
      id: e.id || crypto.randomUUID(),
      degree: e.degree,
      institution: e.institution,
      fieldOfStudy: e.fieldOfStudy ?? '',
      location: e.location ?? '',
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.description,
    })) as Prisma.InputJsonValue
  }

  if (Array.isArray(input.contactLinks)) {
    data.contactLinks = input.contactLinks
      .map((c) => ({
        label: String(c?.label ?? '').trim(),
        url: normalizeContactUrl(c),
      }))
      .filter((c) => c.url) as Prisma.InputJsonValue
  }

  if (Array.isArray(input.projects)) {
    data.projects = input.projects.map((p) => ({
      id: p.id || crypto.randomUUID(),
      title: p.title,
      imageUrl: p.imageUrl,
      description: p.description,
      projectLink: p.projectLink,
      tags: Array.isArray(p.tags) ? p.tags.map((t) => String(t)) : [],
      relatedContent: p.relatedContent,
    })) as Prisma.InputJsonValue
  }

  if (typeof input.username === 'string') {
    const slug = slugify(input.username)
    if (slug.length >= 3 && slug.length <= 30) {
      const clash = await prisma.userProfile.findFirst({ where: { username: slug, NOT: { userId } } })
      if (!clash) data.username = slug
    }
  }

  if (input.appearance !== undefined) {
    data.appearance = input.appearance ? (input.appearance as Prisma.InputJsonValue) : Prisma.JsonNull
  }

  if (Array.isArray(input.testimonials)) {
    data.testimonials = {
      deleteMany: { profileId: { equals: userId } },
      create: input.testimonials.map((t, i) => ({ author: t.author, role: t.role ?? null, body: t.body, sortOrder: i })),
    }
  }

  if (Array.isArray(input.services)) {
    data.services = {
      deleteMany: { profileId: { equals: userId } },
      create: input.services.map((s, i) => ({ title: s.title, description: s.description ?? null, price: s.price ?? null, sortOrder: i })),
    }
  }

  const updated = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      username: await generateUsername('user'),
      ...(data as Omit<Prisma.UserProfileUncheckedCreateInput, 'userId' | 'username'>),
    },
    update: data,
    include: {
      testimonials: true,
      services: true,
    },
  })
  return mapProfile(updated)
}
