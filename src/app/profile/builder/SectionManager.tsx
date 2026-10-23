/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Eye, EyeOff, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { isSectionVisible, withSectionVisibility } from '@/lib/section-visibility'
import { getPortfolioLang } from '@/lib/portfolio-language'
import { useBuilderI18n } from './i18n/BuilderI18nContext'

export function SectionManager({ profile, updateProfile }: { profile: any, updateProfile: any }) {
  const { t } = useBuilderI18n()
  const sections = profile.pages?.[0]?.sections || []
  const appearance = profile.appearance || {}
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const sectionLabel = (type: string) => t(`section.${type}`)

  const toggleVisibility = (sectionId: string) => {
    updateProfile((p: any) => {
      const newPages = [...p.pages]
      const newSections = newPages[0].sections.map((s: any) =>
        s.id === sectionId ? withSectionVisibility(s, !isSectionVisible(s)) : s,
      )
      newPages[0].sections = newSections
      return { ...p, pages: newPages }
    })
  }

  const addSection = (sectionType: 'gallery' | 'files' | 'contact' | 'custom') => {
    updateProfile((p: any) => {
      const newPages = [...p.pages]
      const sections = [...(newPages[0]?.sections || [])]
      const maxOrder = sections.reduce((max: number, s: any) => Math.max(max, s.sectionOrder || 0), 0)
      // Content shape matches its Zod schema (strict objects reject extras).
      const content =
        sectionType === 'custom'
          ? { title: { en: '', ar: '' }, paragraphs: [] }
          : sectionType === 'contact'
            ? { title: { en: '', ar: '' }, links: [] }
            : { title: { en: '', ar: '' }, items: [] };
      sections.push({
        id: `new-${Date.now()}`,
        sectionType,
        sectionOrder: maxOrder + 1,
        content,
        settings: { isVisible: true },
      })
      newPages[0] = { ...newPages[0], sections }
      return { ...p, pages: newPages }
    })
  }

  const moveSection = (index: number, direction: -1 | 1) => {    if (index + direction < 0 || index + direction >= sections.length) return
    updateProfile((p: any) => {
      const newPages = [...p.pages]
      const newSections = [...newPages[0].sections]
      const temp = newSections[index]
      newSections[index] = newSections[index + direction]
      newSections[index + direction] = temp
      
      newSections.forEach((s, i) => s.sectionOrder = i + 1)
      
      newPages[0].sections = newSections
      return { ...p, pages: newPages }
    })
  }

  const updateSectionContent = (sectionId: string, field: string, lang: 'en'|'ar', value: any) => {
    updateProfile((p: any) => {
      const newPages = [...p.pages]
      const newSections = newPages[0].sections.map((s: any) => {
        if (s.id === sectionId) {
          const content = s.content || {}
          return {
            ...s,
            content: {
              ...content,
              [field]: { ...(content[field] || {}), [lang]: value }
            }
          }
        }
        return s
      })
      newPages[0].sections = newSections
      return { ...p, pages: newPages }
    })
  }

  const updateSectionContentRaw = (sectionId: string, field: string, value: any) => {
    updateProfile((p: any) => {
      const newPages = [...p.pages]
      const newSections = newPages[0].sections.map((s: any) => {
        if (s.id === sectionId) {
          return { ...s, content: { ...(s.content || {}), [field]: value } }
        }
        return s
      })
      newPages[0].sections = newSections
      return { ...p, pages: newPages }
    })
  }

  const renderContentFields = (section: any) => {
    const langMode = getPortfolioLang(appearance)
    const showEn = langMode === 'en' || langMode === 'both'
    const showAr = langMode === 'ar' || langMode === 'both'
    const c = section.content || {}

    return (
      <div className="mt-3 space-y-4 border-t border-[var(--color-border)] pt-3 text-xs">
        {section.sectionType === 'hero' && (
          <>
            {showEn && <div>
              <label htmlFor={`sec-${section.id}-subtitle-en`} className="text-[var(--color-text-secondary)]">{t('field.subtitleEn')}</label>
              <Input id={`sec-${section.id}-subtitle-en`} dir="ltr" value={c.subtitle?.en || ''} onChange={e => updateSectionContent(section.id, 'subtitle', 'en', e.target.value)} className="mt-1 h-8" />
            </div>}
            {showAr && <div dir="rtl">
              <label htmlFor={`sec-${section.id}-subtitle-ar`} className="text-[var(--color-text-secondary)]">{t('field.subtitleAr')}</label>
              <Input id={`sec-${section.id}-subtitle-ar`} value={c.subtitle?.ar || ''} onChange={e => updateSectionContent(section.id, 'subtitle', 'ar', e.target.value)} className="mt-1 h-8 text-right" />
            </div>}
          </>
        )}
        
        {section.sectionType === 'about' && (
          <>
            {showEn && <div>
              <label htmlFor={`sec-${section.id}-text-en`} className="text-[var(--color-text-secondary)]">{t('field.aboutTextEn')}</label>
              <textarea id={`sec-${section.id}-text-en`} dir="ltr" value={c.text?.en || ''} onChange={e => updateSectionContent(section.id, 'text', 'en', e.target.value)} className="mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2" rows={3} />
            </div>}
            {showAr && <div dir="rtl">
              <label htmlFor={`sec-${section.id}-text-ar`} className="text-[var(--color-text-secondary)]">{t('field.aboutTextAr')}</label>
              <textarea id={`sec-${section.id}-text-ar`} value={c.text?.ar || ''} onChange={e => updateSectionContent(section.id, 'text', 'ar', e.target.value)} className="mt-1 w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-right" rows={3} />
            </div>}
          </>
        )}

        {(section.sectionType === 'projects' || section.sectionType === 'contact' || section.sectionType === 'skills' || section.sectionType === 'services' || section.sectionType === 'testimonials' || section.sectionType === 'gallery' || section.sectionType === 'files' || section.sectionType === 'custom') && (
          <>
            {showEn && <div>
              <label htmlFor={`sec-${section.id}-title-en`} className="text-[var(--color-text-secondary)]">{t('field.sectionTitleEn')}</label>
              <Input id={`sec-${section.id}-title-en`} dir="ltr" value={c.title?.en || ''} onChange={e => updateSectionContent(section.id, 'title', 'en', e.target.value)} className="mt-1 h-8" />
            </div>}
            {showAr && <div dir="rtl">
              <label htmlFor={`sec-${section.id}-title-ar`} className="text-[var(--color-text-secondary)]">{t('field.sectionTitleAr')}</label>
              <Input id={`sec-${section.id}-title-ar`} value={c.title?.ar || ''} onChange={e => updateSectionContent(section.id, 'title', 'ar', e.target.value)} className="mt-1 h-8 text-right" />
            </div>}
          </>
        )}

        {section.sectionType === 'skills' && (
          <div>
            <label htmlFor={`sec-${section.id}-skills`} className="text-[var(--color-text-secondary)]">{t('field.skillsComma')}</label>
            <Input 
              id={`sec-${section.id}-skills`}
              value={(c.skills || []).join(', ')} 
              onChange={e => updateSectionContentRaw(section.id, 'skills', e.target.value.split(',').map((s:string) => s.trim()).filter(Boolean))} 
              className="mt-1 h-8" 
              placeholder={t('placeholder.skills')}
            />
          </div>
        )}

        {/* Optional short description — available on every section type
            (experience/services have their own richer description field in the
            right-hand editor). Rendered under the heading when non-empty. */}
        {section.sectionType !== 'experience' && section.sectionType !== 'services' && (
          <div className="space-y-2">
            <label htmlFor={`sec-${section.id}-description-${showEn ? 'en' : 'ar'}`} className="text-[var(--color-text-secondary)]">
              {t('field.sectionDescriptionOptional')}
            </label>
            {showEn && (
              <Input
                id={`sec-${section.id}-description-en`}
                aria-label={t('field.sectionDescriptionEnAria')}
                dir="ltr"
                maxLength={300}
                value={c.description?.en || ''}
                onChange={e => updateSectionContent(section.id, 'description', 'en', e.target.value)}
                className="h-8"
                placeholder={t('placeholder.sectionDescriptionEn')}
              />
            )}
            {showAr && (
              <Input
                id={`sec-${section.id}-description-ar`}
                aria-label={t('field.sectionDescriptionArAria')}
                dir="rtl"
                maxLength={300}
                value={c.description?.ar || ''}
                onChange={e => updateSectionContent(section.id, 'description', 'ar', e.target.value)}
                className="h-8 text-right"
                placeholder={t('placeholder.sectionDescriptionAr')}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="mb-3 text-sm font-semibold">{t('sections.portfolioSections')}</h3>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">{t('sections.reorderHint')}</p>
      
      <div className="space-y-2">
        {sections.map((section: any, idx: number) => {
          const visible = isSectionVisible(section)
          const name = sectionLabel(section.sectionType)
          return (
          <div key={section.id} className="flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 text-[var(--color-text-muted)]">
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} aria-label={t('sections.moveUpAria', { name })} className="min-h-[24px] min-w-[24px] rounded hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-30">▲</button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} aria-label={t('sections.moveDownAria', { name })} className="min-h-[24px] min-w-[24px] rounded hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-30">▼</button>
              </div>
              
              <button 
                className="flex flex-1 items-center justify-between rounded text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                aria-expanded={expandedSection === section.id}
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              >
                <p className="text-sm font-medium">{name}</p>
                {expandedSection === section.id ? <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] rtl:rotate-180" />}
              </button>
              
              <button 
                onClick={() => toggleVisibility(section.id)}
                aria-label={visible ? t('sections.hideAria', { name }) : t('sections.showAria', { name })}
                aria-pressed={visible}
                title={visible ? t('sections.hideTitle') : t('sections.showTitle')}
                className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${visible ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}
              >
                {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            
            {expandedSection === section.id && renderContentFields(section)}
          </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => addSection('gallery')}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] p-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Plus className="h-3.5 w-3.5" /> {t('section.gallery')}
        </button>
        <button
          onClick={() => addSection('files')}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] p-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Plus className="h-3.5 w-3.5" /> {t('section.files')}
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => addSection('contact')}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] p-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Plus className="h-3.5 w-3.5" /> {t('section.contact')}
        </button>
        <button
          onClick={() => addSection('custom')}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] p-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <Plus className="h-3.5 w-3.5" /> {t('section.custom')}
        </button>
      </div>
    </div>
  )
}
