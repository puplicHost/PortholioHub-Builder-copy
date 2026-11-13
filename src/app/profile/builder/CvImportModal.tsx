/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { AlertTriangle, FileText, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { FileButton } from './ui/FileButton'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { applyCvSuggestions } from '@/lib/actions/cv-import'
import { MAX_SKILL_GROUPS, MAX_TOTAL_SKILLS } from '@/lib/cv-import/types'
import type {
  CvEducationSuggestion,
  CvExperienceSuggestion,
  CvLanguage,
  CvSuggestions,
  CvWarningCode,
} from '@/lib/cv-import/types'

const MAX_CLIENT_FILE_BYTES = 4 * 1024 * 1024
const SCALAR_KEYS = ['displayName', 'professionalTitle', 'location', 'bio'] as const
type ScalarKey = (typeof SCALAR_KEYS)[number]

interface ScalarState {
  selected: boolean
  value: string
  lang: CvLanguage
  overwrite: boolean
}

type ScalarStateMap = Record<ScalarKey, ScalarState | null>

interface ExperienceState extends CvExperienceSuggestion {
  selected: boolean
}

interface EducationState extends CvEducationSuggestion {
  selected: boolean
}

interface SkillItemState {
  value: string
  selected: boolean
}

interface SkillGroupState {
  name: string
  skills: SkillItemState[]
}

export interface CvImportModalProps {
  open: boolean
  onClose: () => void
  profile: any
  externalProcessing: boolean
  isDirty: boolean
  saving: boolean
  onApplied: () => Promise<void>
}

function emptyScalars(): ScalarStateMap {
  return {
    displayName: null,
    professionalTitle: null,
    location: null,
    bio: null,
  }
}

function asRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {}
}

function bilingual(value: unknown, lang: CvLanguage): string {
  if (typeof value === 'string') return value
  const record = asRecord(value)
  return typeof record[lang] === 'string' ? record[lang] : ''
}

function sectionByType(profile: any, type: string): any | null {
  const sections = profile?.pages?.[0]?.sections
  return Array.isArray(sections) ? sections.find((section: any) => section?.sectionType === type) || null : null
}

function currentScalar(profile: any, key: ScalarKey, lang: CvLanguage): string {
  const localized = asRecord(profile?.localized)
  if (key === 'professionalTitle') {
    const direct = bilingual(localized.professionalTitle, lang)
    if (direct.trim()) return direct
    return bilingual(asRecord(sectionByType(profile, 'hero')?.content).subtitle, lang)
  }
  if (key === 'bio') {
    const direct = bilingual(localized.bio, lang)
    if (direct.trim()) return direct
    const content = asRecord(sectionByType(profile, 'about')?.content)
    return bilingual(content.biography, lang) || bilingual(content.text, lang)
  }
  return bilingual(localized[key], lang)
}

function currentListCount(profile: any, type: 'skills' | 'experience' | 'education'): number {
  return currentListItems(profile, type).length
}

function currentListItems(profile: any, type: 'skills' | 'experience' | 'education'): string[] {
  const content = asRecord(sectionByType(profile, type)?.content)
  if (type === 'skills') {
    const groups = Array.isArray(content.groups) ? content.groups : []
    const grouped = groups.flatMap((group: any) => {
      return Array.isArray(group?.skills)
        ? group.skills
            .map((skill: any) => (typeof skill === 'string' ? skill : skill?.name))
            .filter((value: unknown): value is string => typeof value === 'string' && value.trim() !== '')
        : []
    })
    if (grouped.length > 0) return grouped
    return Array.isArray(content.skills)
      ? content.skills.filter((value: unknown): value is string => typeof value === 'string' && value.trim() !== '')
      : []
  }
  const items = Array.isArray(content.items) ? content.items : []
  return items.map((item: any) => {
    const record = asRecord(item)
    if (type === 'experience') {
      const title = typeof record.jobTitle === 'string' ? record.jobTitle : (bilingual(record.jobTitle, 'en') || bilingual(record.jobTitle, 'ar'))
      const company = typeof record.companyName === 'string' ? record.companyName : (bilingual(record.companyName, 'en') || bilingual(record.companyName, 'ar'))
      return [title, company].filter(Boolean).join(' · ')
    }
    const title = typeof record.title === 'string' ? record.title : (bilingual(record.title, 'en') || bilingual(record.title, 'ar'))
    const institution = typeof record.institution === 'string' ? record.institution : (bilingual(record.institution, 'en') || bilingual(record.institution, 'ar'))
    return [title, institution].filter(Boolean).join(' · ')
  }).filter(Boolean)
}

function currentSkillGroupNames(profile: any): string[] {
  const content = asRecord(sectionByType(profile, 'skills')?.content)
  const groups = Array.isArray(content.groups) ? content.groups : []
  return groups
    .map((group: any) => (typeof group?.name === 'string' ? group.name.trim() : ''))
    .filter(Boolean)
}

function scalarLabelKey(key: ScalarKey): string {
  return `cv.field.${key}`
}

function warningKey(code: CvWarningCode): string {
  return `cv.warning.${code}`
}

export function CvImportModal({
  open,
  onClose,
  profile,
  externalProcessing,
  isDirty,
  saving,
  onApplied,
}: CvImportModalProps) {
  const { t, dir } = useBuilderI18n()
  const { toast } = useToast()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const uid = useId()

  const [acknowledged, setAcknowledged] = useState(false)
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<CvSuggestions | null>(null)
  const [scalars, setScalars] = useState<ScalarStateMap>(emptyScalars)
  const [skillGroups, setSkillGroups] = useState<SkillGroupState[]>([])
  const [experience, setExperience] = useState<ExperienceState[]>([])
  const [education, setEducation] = useState<EducationState[]>([])

  const resetState = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setAcknowledged(false)
    setStep('upload')
    setLoading(false)
    setApplying(false)
    setErrorCode(null)
    setSuggestions(null)
    setScalars(emptyScalars())
    setSkillGroups([])
    setExperience([])
    setEducation([])
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [onClose, resetState])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      const list = Array.from(nodes).filter((element) => element.offsetParent !== null)
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (event.shiftKey) {
        if (!active || active === first || !dialogRef.current.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (!active || active === last || !dialogRef.current.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open, handleClose])

  const initReview = (next: CvSuggestions) => {
    setSuggestions(next)
    setScalars({
      displayName: next.displayName
        ? { selected: false, value: next.displayName.value, lang: next.displayName.language, overwrite: false }
        : null,
      professionalTitle: next.professionalTitle
        ? { selected: false, value: next.professionalTitle.value, lang: next.professionalTitle.language, overwrite: false }
        : null,
      location: next.location
        ? { selected: false, value: next.location.value, lang: next.location.language, overwrite: false }
        : null,
      bio: next.bio
        ? { selected: false, value: next.bio.value, lang: next.bio.language, overwrite: false }
        : null,
    })
    setSkillGroups(Array.isArray(next.skillGroups)
      ? next.skillGroups
          .map((group) => ({
            name: typeof group?.name === 'string' ? group.name : '',
            skills: Array.isArray(group?.skills)
              ? group.skills.map((value) => ({ value, selected: false }))
              : [],
          }))
          .filter((group) => group.skills.length > 0)
      : [])
    setExperience(Array.isArray(next.experience) ? next.experience.map((item) => ({ ...item, selected: false })) : [])
    setEducation(Array.isArray(next.education) ? next.education.map((item) => ({ ...item, selected: false })) : [])
    setStep('review')
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setErrorCode(null)
    const name = file.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setErrorCode('UNSUPPORTED_FILE_TYPE')
      return
    }
    if (file.size > MAX_CLIENT_FILE_BYTES) {
      setErrorCode('FILE_TOO_LARGE')
      return
    }
    if (file.size === 0) {
      setErrorCode('FILE_EMPTY')
      return
    }

    setLoading(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('acknowledged', 'true')
      const response = await fetch('/api/cv-import/extract', {
        method: 'POST',
        body: form,
        signal: controller.signal,
        cache: 'no-store',
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        setErrorCode(typeof data?.code === 'string' ? data.code : 'INTERNAL_ERROR')
        return
      }
      if (!data?.suggestions || typeof data.suggestions !== 'object') {
        setErrorCode('NO_TEXT_FOUND')
        return
      }
      initReview(data.suggestions as CvSuggestions)
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return
      setErrorCode('INTERNAL_ERROR')
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setLoading(false)
    }
  }

  const scalarSelected = useMemo(
    () => SCALAR_KEYS.some((key) => scalars[key]?.selected),
    [scalars],
  )
  const listSelected = skillGroups.some((group) => group.skills.some((item) => item.selected))
    || experience.some((item) => item.selected)
    || education.some((item) => item.selected)
  const hasSelection = scalarSelected || listSelected

  const overwriteBlocked = useMemo(
    () => SCALAR_KEYS.some((key) => {
      const state = scalars[key]
      if (!state?.selected) return false
      return Boolean(currentScalar(profile, key, state.lang).trim()) && !state.overwrite
    }),
    [profile, scalars],
  )

  const updateScalar = (key: ScalarKey, patch: Partial<ScalarState>) => {
    setScalars((previous) => {
      const current = previous[key]
      if (!current) return previous
      return { ...previous, [key]: { ...current, ...patch } }
    })
  }

  const updateExperience = (index: number, patch: Partial<ExperienceState>) => {
    setExperience((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  const updateEducation = (index: number, patch: Partial<EducationState>) => {
    setEducation((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  const toggleAllSkills = (checked: boolean) => {
    setSkillGroups((previous) => previous.map((group) => ({
      ...group,
      skills: group.skills.map((item) => ({ ...item, selected: checked })),
    })))
  }

  const updateSkillGroupName = (groupIndex: number, name: string) => {
    setSkillGroups((previous) => previous.map((group, index) => index === groupIndex ? { ...group, name } : group))
  }

  const toggleSkillGroup = (groupIndex: number, checked: boolean) => {
    setSkillGroups((previous) => previous.map((group, index) => index === groupIndex
      ? { ...group, skills: group.skills.map((item) => ({ ...item, selected: checked })) }
      : group))
  }

  const updateSkillItem = (groupIndex: number, skillIndex: number, patch: Partial<SkillItemState>) => {
    setSkillGroups((previous) => previous.map((group, index) => index === groupIndex
      ? {
          ...group,
          skills: group.skills.map((item, itemIndex) => itemIndex === skillIndex ? { ...item, ...patch } : item),
        }
      : group))
  }

  const handleApply = async () => {
    if (applying || loading || isDirty || saving) return
    setErrorCode(null)

    const approved: Record<string, unknown> = {}
    for (const key of SCALAR_KEYS) {
      const state = scalars[key]
      if (!state?.selected) continue
      const value = state.value.trim()
      if (!value) {
        setErrorCode('VALIDATION_ERROR')
        return
      }
      const current = currentScalar(profile, key, state.lang)
      if (current.trim() && !state.overwrite) {
        setErrorCode('OVERWRITE_CONFIRMATION_REQUIRED')
        return
      }
      approved[key] = {
        lang: state.lang,
        value,
        ...(current.trim() ? { overwrite: true } : {}),
      }
    }

    const selectedSkillGroups = skillGroups
      .map((group) => ({
        name: group.name.trim(),
        skills: group.skills
          .filter((item) => item.selected)
          .map((item) => item.value.trim()),
      }))
      .filter((group) => group.skills.length > 0)
    if (selectedSkillGroups.some((group) => !group.name)) {
      setErrorCode('VALIDATION_ERROR')
      return
    }
    if (selectedSkillGroups.some((group) => group.skills.some((value) => !value))) {
      setErrorCode('VALIDATION_ERROR')
      return
    }
    if (selectedSkillGroups.length > 0) {
      const totalSkills = selectedSkillGroups.reduce((total, group) => total + group.skills.length, 0)
      if (selectedSkillGroups.length > MAX_SKILL_GROUPS || totalSkills > MAX_TOTAL_SKILLS) {
        setErrorCode('VALIDATION_ERROR')
        return
      }
      approved.skillGroups = { groups: selectedSkillGroups }
    }

    const selectedExperienceRaw = experience.filter((item) => item.selected)
    if (selectedExperienceRaw.some((item) => !item.jobTitle.trim())) {
      setErrorCode('VALIDATION_ERROR')
      return
    }
    const selectedExperience = selectedExperienceRaw
      .map((item) => ({
        jobTitle: item.jobTitle.trim(),
        companyName: item.companyName.trim(),
        location: item.location.trim(),
        startDate: item.startDate.trim(),
        endDate: item.endDate.trim(),
        isCurrent: item.isCurrent,
        description: item.description.trim(),
      }))
      .slice(0, 30)
    if (selectedExperience.length > 0) approved.experience = { items: selectedExperience }

    const selectedEducationRaw = education.filter((item) => item.selected)
    if (selectedEducationRaw.some((item) => !item.title.trim())) {
      setErrorCode('VALIDATION_ERROR')
      return
    }
    const selectedEducation = selectedEducationRaw
      .map((item) => ({
        title: item.title.trim(),
        institution: item.institution.trim(),
        date: item.date.trim(),
        description: item.description.trim(),
      }))
      .slice(0, 30)
    if (selectedEducation.length > 0) approved.education = { items: selectedEducation }

    if (Object.keys(approved).length === 0) {
      setErrorCode('VALIDATION_ERROR')
      return
    }

    setApplying(true)
    try {
      const result = await applyCvSuggestions({
        expectedVersion: profile?.version,
        approved,
      })
      if (!result.success) {
        setErrorCode(result.code || 'INTERNAL_ERROR')
        return
      }
      if (typeof result.skippedSkills === 'number' && result.skippedSkills > 0) {
        toast('warning', t('cv.skillsLimitReached'))
      }
      toast('success', t('cv.toastApplied'))
      try {
        await onApplied()
      } catch {
        // The server already committed the selected fields. Closing is safer
        // than leaving the modal open and inviting a duplicate apply; the
        // Builder can be reloaded to refresh its snapshot.
      }
      handleClose()
    } catch {
      setErrorCode('INTERNAL_ERROR')
    } finally {
      setApplying(false)
    }
  }

  if (!open) return null

  const titleId = `${uid}-title`
  const descriptionId = `${uid}-description`
  const blocked = isDirty || saving
  const errorText = errorCode ? friendlyError(t, errorCode) : ''

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-3 sm:p-4" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        dir={dir}
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
              <FileText className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
              {t('cv.title')}
            </h2>
            <p id={descriptionId} className="mt-1 text-xs text-[var(--color-text-muted)]">
              {t('cv.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            aria-label={t('cv.close')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {step === 'upload' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3 sm:p-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t('cv.noticeTitle')}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {externalProcessing ? t('cv.noticeExternal') : t('cv.noticeLocal')}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-[var(--color-primary)]">
                    {t('cv.terms')}
                  </a>
                  {' · '}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-[var(--color-primary)]">
                    {t('cv.privacy')}
                  </a>
                </p>
                <label className="mt-3 flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                  />
                  <span>{t('cv.acknowledge')}</span>
                </label>
              </div>

              {blocked && (
                <p role="alert" className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  {t('cv.saveFirst')}
                </p>
              )}

              <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-center">
                <Upload className="mx-auto h-7 w-7 text-[var(--color-primary)]" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  {loading ? t('cv.reading') : t('cv.uploadTitle')}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t('cv.uploadHint')}</p>
                <div className="mt-3 flex justify-center">
                  <FileButton
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={!acknowledged || loading || blocked}
                    onFiles={(files) => void handleFile(files?.[0])}
                    className="min-h-[44px] px-4"
                    aria-label={t('cv.chooseFile')}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                    {loading ? t('cv.reading') : t('cv.chooseFile')}
                  </FileButton>
                </div>
              </div>

              {errorText && (
                <p role="alert" className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  {errorText}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {blocked && (
                <p role="alert" className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  {t('cv.saveFirst')}
                </p>
              )}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">{t('cv.reviewHint')}</p>
                {suggestions?.warnings?.length ? (
                  <ul className="mt-2 space-y-1 text-[11px] text-[var(--color-text-muted)]">
                    {suggestions.warnings.map((warning) => (
                      <li key={warning} className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{t(warningKey(warning))}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {SCALAR_KEYS.map((key) => {
                const state = scalars[key]
                if (!state) return null
                const current = currentScalar(profile, key, state.lang)
                const isLong = key === 'bio'
                return (
                  <section key={key} className="rounded-xl border border-[var(--color-border)] p-3 sm:p-4" aria-labelledby={`${uid}-${key}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={`${uid}-${key}-value`} id={`${uid}-${key}`} className="text-sm font-bold text-[var(--color-text-primary)]">
                        {t(scalarLabelKey(key))}
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                        <input
                          type="checkbox"
                          checked={state.selected}
                          onChange={(event) => updateScalar(key, { selected: event.target.checked })}
                          className="h-4 w-4 accent-[var(--color-primary)]"
                        />
                        {t('cv.useSuggestion')}
                      </label>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-[var(--color-surface-secondary)] p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t('cv.current')}</p>
                        <p className="mt-1 whitespace-pre-line text-xs text-[var(--color-text-secondary)]">
                          {current.trim() || t('cv.empty')}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t('cv.suggested')}</p>
                        {isLong ? (
                          <textarea
                            id={`${uid}-${key}-value`}
                            value={state.value}
                            maxLength={2000}
                            onChange={(event) => updateScalar(key, { value: event.target.value })}
                            rows={4}
                            dir={state.lang === 'ar' ? 'rtl' : 'ltr'}
                            className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          />
                        ) : (
                          <Input
                            id={`${uid}-${key}-value`}
                            value={state.value}
                            maxLength={120}
                            onChange={(event) => updateScalar(key, { value: event.target.value })}
                            dir={state.lang === 'ar' ? 'rtl' : 'ltr'}
                            className="h-[44px] min-h-[44px] w-full px-3 text-sm"
                          />
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <label className="text-[11px] text-[var(--color-text-muted)]" htmlFor={`${uid}-${key}-lang`}>{t('cv.language')}</label>
                          <select
                            id={`${uid}-${key}-lang`}
                            value={state.lang}
                            onChange={(event) => updateScalar(key, { lang: event.target.value as CvLanguage, overwrite: false })}
                            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <option value="en">English</option>
                            <option value="ar">العربية</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {state.selected && current.trim() ? (
                      <label className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-2 text-xs font-semibold text-[var(--color-text-primary)]">
                        <input
                          type="checkbox"
                          checked={state.overwrite}
                          onChange={(event) => updateScalar(key, { overwrite: event.target.checked })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-warning)]"
                        />
                        <span>{t('cv.replaceExisting')}</span>
                      </label>
                    ) : null}
                  </section>
                )
              })}

              {skillGroups.length > 0 && (
                <section className="rounded-xl border border-[var(--color-border)] p-3 sm:p-4" aria-labelledby={`${uid}-skills`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id={`${uid}-skills`} className="text-sm font-bold text-[var(--color-text-primary)]">{t('cv.field.skills')}</h3>
                    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={skillGroups.every((group) => group.skills.length > 0 && group.skills.every((item) => item.selected))}
                        onChange={(event) => toggleAllSkills(event.target.checked)}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      {t('cv.selectAll')}
                    </label>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {t('cv.currentCount', { count: currentListCount(profile, 'skills') })}
                  </p>
                  {currentListItems(profile, 'skills').length > 0 ? (
                    <p className="mt-1 text-[11px] text-[var(--color-text-secondary)] break-words">
                      {currentListItems(profile, 'skills').slice(0, 12).join(' · ')}
                    </p>
                  ) : null}
                  {currentSkillGroupNames(profile).length > 0 ? (
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)] break-words">
                      {t('cv.currentGroups', { groups: currentSkillGroupNames(profile).join(' · ') })}
                    </p>
                  ) : null}
                  <div className="mt-2 space-y-3">
                    {skillGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="rounded-lg border border-[var(--color-border)] p-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                            <input
                              type="checkbox"
                              checked={group.skills.length > 0 && group.skills.every((item) => item.selected)}
                              onChange={(event) => toggleSkillGroup(groupIndex, event.target.checked)}
                              className="h-4 w-4 accent-[var(--color-primary)]"
                              aria-label={`${t('cv.selectAll')}: ${group.name}`}
                            />
                            {t('cv.selectAll')}
                          </label>
                          <Input
                            value={group.name}
                            maxLength={60}
                            onChange={(event) => updateSkillGroupName(groupIndex, event.target.value)}
                            aria-label={t('field.groupName')}
                            className="h-[40px] min-h-[40px] min-w-[180px] flex-1 px-2 text-sm font-semibold"
                          />
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {group.skills.map((skill, skillIndex) => (
                            <div key={skillIndex} className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] p-2">
                              <input
                                type="checkbox"
                                checked={skill.selected}
                                onChange={(event) => updateSkillItem(groupIndex, skillIndex, { selected: event.target.checked })}
                                className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                                aria-label={`${t('cv.useSuggestion')}: ${skill.value}`}
                              />
                              <Input
                                value={skill.value}
                                maxLength={60}
                                onChange={(event) => updateSkillItem(groupIndex, skillIndex, { value: event.target.value })}
                                className="h-[40px] min-h-[40px] w-full px-2 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {experience.length > 0 && (
                <section className="rounded-xl border border-[var(--color-border)] p-3 sm:p-4" aria-labelledby={`${uid}-experience`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id={`${uid}-experience`} className="text-sm font-bold text-[var(--color-text-primary)]">{t('cv.field.experience')}</h3>
                    <button
                      type="button"
                      onClick={() => setExperience((previous) => previous.map((item) => ({ ...item, selected: !previous.every((entry) => entry.selected) })))}
                      className="text-xs font-semibold text-[var(--color-primary)] underline"
                    >
                      {t('cv.selectAll')}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {t('cv.currentCount', { count: currentListCount(profile, 'experience') })}
                  </p>
                  {currentListItems(profile, 'experience').length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      {currentListItems(profile, 'experience').slice(0, 8).map((item, index) => (
                        <li key={index} className="break-words">• {item}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-2 space-y-3">
                    {experience.map((item, index) => (
                      <div key={index} className="rounded-lg border border-[var(--color-border)] p-2.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(event) => updateExperience(index, { selected: event.target.checked })}
                            className="h-4 w-4 accent-[var(--color-primary)]"
                          />
                          {t('cv.useSuggestion')}
                        </label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {([
                            ['jobTitle', t('cv.experience.jobTitle'), 120],
                            ['companyName', t('cv.experience.company'), 120],
                            ['location', t('cv.experience.location'), 120],
                            ['startDate', t('cv.experience.startDate'), 30],
                            ['endDate', t('cv.experience.endDate'), 30],
                          ] as const).map(([field, label, maxLength]) => (
                            <label key={field} className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                              {label}
                              <Input
                                value={String(item[field] || '')}
                                maxLength={maxLength}
                                disabled={field === 'endDate' && item.isCurrent}
                                onChange={(event) => updateExperience(index, { [field]: event.target.value } as Partial<ExperienceState>)}
                                className="mt-1 h-[40px] min-h-[40px] w-full px-2 text-sm"
                              />
                            </label>
                          ))}
                        </div>
                        <label className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                          <input
                            type="checkbox"
                            checked={item.isCurrent}
                            onChange={(event) => updateExperience(index, { isCurrent: event.target.checked })}
                            className="h-4 w-4 accent-[var(--color-primary)]"
                          />
                          {t('cv.experience.current')}
                        </label>
                        <label className="mt-2 block text-[11px] font-semibold text-[var(--color-text-muted)]">
                          {t('cv.experience.description')}
                          <textarea
                            value={item.description}
                            maxLength={1000}
                            rows={2}
                            onChange={(event) => updateExperience(index, { description: event.target.value })}
                            className="mt-1 w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {education.length > 0 && (
                <section className="rounded-xl border border-[var(--color-border)] p-3 sm:p-4" aria-labelledby={`${uid}-education`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id={`${uid}-education`} className="text-sm font-bold text-[var(--color-text-primary)]">{t('cv.field.education')}</h3>
                    <button
                      type="button"
                      onClick={() => setEducation((previous) => previous.map((item) => ({ ...item, selected: !previous.every((entry) => entry.selected) })))}
                      className="text-xs font-semibold text-[var(--color-primary)] underline"
                    >
                      {t('cv.selectAll')}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                    {t('cv.currentCount', { count: currentListCount(profile, 'education') })}
                  </p>
                  {currentListItems(profile, 'education').length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      {currentListItems(profile, 'education').slice(0, 8).map((item, index) => (
                        <li key={index} className="break-words">• {item}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-2 space-y-3">
                    {education.map((item, index) => (
                      <div key={index} className="rounded-lg border border-[var(--color-border)] p-2.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(event) => updateEducation(index, { selected: event.target.checked })}
                            className="h-4 w-4 accent-[var(--color-primary)]"
                          />
                          {t('cv.useSuggestion')}
                        </label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {([
                            ['title', t('cv.education.title'), 120],
                            ['institution', t('cv.education.institution'), 120],
                            ['date', t('cv.education.date'), 60],
                          ] as const).map(([field, label, maxLength]) => (
                            <label key={field} className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                              {label}
                              <Input
                                value={String(item[field] || '')}
                                maxLength={maxLength}
                                onChange={(event) => updateEducation(index, { [field]: event.target.value } as Partial<EducationState>)}
                                className="mt-1 h-[40px] min-h-[40px] w-full px-2 text-sm"
                              />
                            </label>
                          ))}
                        </div>
                        <label className="mt-2 block text-[11px] font-semibold text-[var(--color-text-muted)]">
                          {t('cv.education.description')}
                          <textarea
                            value={item.description}
                            maxLength={1000}
                            rows={2}
                            onChange={(event) => updateEducation(index, { description: event.target.value })}
                            className="mt-1 w-full resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {errorText && (
                <p role="alert" className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-xs font-semibold text-[var(--color-text-primary)]">
                  {errorText}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3 sm:px-5">
          <p className="text-[11px] text-[var(--color-text-muted)]">{t('cv.footerNote')}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleClose} disabled={applying}>
              {t('cv.cancel')}
            </Button>
            {step === 'review' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleApply()}
                disabled={!hasSelection || overwriteBlocked || applying || loading || blocked}
              >
                {applying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {applying ? t('cv.applying') : t('cv.apply')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function friendlyError(t: (key: string, vars?: Record<string, string | number>) => string, code: string): string {
  const key = `cv.error.${code}`
  const value = t(key)
  return value === key ? t('cv.error.INTERNAL_ERROR') : value
}
