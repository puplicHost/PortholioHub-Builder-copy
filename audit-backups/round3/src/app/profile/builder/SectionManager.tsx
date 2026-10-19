/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export function SectionManager({ profile, updateProfile }: { profile: any, updateProfile: any }) {
  const sections = profile.pages?.[0]?.sections || []
  const appearance = profile.appearance || {}
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleVisibility = (sectionId: string) => {
    updateProfile((p: any) => {
      const newPages = [...p.pages]
      const newSections = newPages[0].sections.map((s: any) => {
        if (s.id === sectionId) {
          return { ...s, settings: { ...s.settings, isVisible: !s.settings.isVisible } }
        }
        return s
      })
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
    const langMode = appearance.defaultLanguage || 'en'
    const showEn = langMode === 'en' || langMode === 'both'
    const showAr = langMode === 'ar' || langMode === 'both'
    const c = section.content || {}

    return (
      <div className="mt-3 space-y-4 pt-3 border-t border-[var(--color-border)] text-xs">
        {section.sectionType === 'hero' && (
          <>
            {showEn && <div>
              <label htmlFor={`sec-${section.id}-subtitle-en`} className="text-[var(--color-text-secondary)]">Subtitle (EN)</label>
              <Input id={`sec-${section.id}-subtitle-en`} value={c.subtitle?.en || ''} onChange={e => updateSectionContent(section.id, 'subtitle', 'en', e.target.value)} className="h-8 mt-1" />
            </div>}
            {showAr && <div dir="rtl">
              <label htmlFor={`sec-${section.id}-subtitle-ar`} className="text-[var(--color-text-secondary)]">Subtitle (AR)</label>
              <Input id={`sec-${section.id}-subtitle-ar`} value={c.subtitle?.ar || ''} onChange={e => updateSectionContent(section.id, 'subtitle', 'ar', e.target.value)} className="h-8 mt-1 text-right" />
            </div>}
          </>
        )}
        
        {section.sectionType === 'about' && (
          <>
            {showEn && <div>
              <label htmlFor={`sec-${section.id}-text-en`} className="text-[var(--color-text-secondary)]">About Text (EN)</label>
              <textarea id={`sec-${section.id}-text-en`} value={c.text?.en || ''} onChange={e => updateSectionContent(section.id, 'text', 'en', e.target.value)} className="w-full mt-1 border border-[var(--color-border)] rounded p-2 bg-[var(--color-surface)]" rows={3} />
            </div>}
            {showAr && <div dir="rtl">
              <label htmlFor={`sec-${section.id}-text-ar`} className="text-[var(--color-text-secondary)]">About Text (AR)</label>
              <textarea id={`sec-${section.id}-text-ar`} value={c.text?.ar || ''} onChange={e => updateSectionContent(section.id, 'text', 'ar', e.target.value)} className="w-full mt-1 border border-[var(--color-border)] rounded p-2 bg-[var(--color-surface)] text-right" rows={3} />
            </div>}
          </>
        )}

        {(section.sectionType === 'projects' || section.sectionType === 'contact' || section.sectionType === 'skills' || section.sectionType === 'services' || section.sectionType === 'testimonials' || section.sectionType === 'gallery' || section.sectionType === 'files') && (
          <>
            {showEn && <div>
              <label htmlFor={`sec-${section.id}-title-en`} className="text-[var(--color-text-secondary)]">Section Title (EN)</label>
              <Input id={`sec-${section.id}-title-en`} value={c.title?.en || ''} onChange={e => updateSectionContent(section.id, 'title', 'en', e.target.value)} className="h-8 mt-1" />
            </div>}
            {showAr && <div dir="rtl">
              <label htmlFor={`sec-${section.id}-title-ar`} className="text-[var(--color-text-secondary)]">Section Title (AR)</label>
              <Input id={`sec-${section.id}-title-ar`} value={c.title?.ar || ''} onChange={e => updateSectionContent(section.id, 'title', 'ar', e.target.value)} className="h-8 mt-1 text-right" />
            </div>}
          </>
        )}

        {section.sectionType === 'skills' && (
          <div>
            <label htmlFor={`sec-${section.id}-skills`} className="text-[var(--color-text-secondary)]">Skills (comma separated)</label>
            <Input 
              id={`sec-${section.id}-skills`}
              value={(c.skills || []).join(', ')} 
              onChange={e => updateSectionContentRaw(section.id, 'skills', e.target.value.split(',').map((s:string) => s.trim()).filter(Boolean))} 
              className="h-8 mt-1" 
              placeholder="React, Next.js, CSS"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-3">Portfolio Sections</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Reorder sections, toggle visibility, and edit content.</p>
      
      <div className="space-y-2">
        {sections.map((section: any, idx: number) => (
          <div key={section.id} className="flex flex-col p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 text-[var(--color-text-muted)]">
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} aria-label={`Move ${section.sectionType} section up`} className="min-h-[24px] min-w-[24px] disabled:opacity-30 hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded">▲</button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} aria-label={`Move ${section.sectionType} section down`} className="min-h-[24px] min-w-[24px] disabled:opacity-30 hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded">▼</button>
              </div>
              
              <button 
                className="flex-1 text-left flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
                aria-expanded={expandedSection === section.id}
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              >
                <p className="text-sm font-medium capitalize">{section.sectionType}</p>
                {expandedSection === section.id ? <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />}
              </button>
              
              <button 
                onClick={() => toggleVisibility(section.id)}
                aria-label={section.settings.isVisible ? `Hide ${section.sectionType} section` : `Show ${section.sectionType} section`}
                aria-pressed={section.settings.isVisible}
                className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${section.settings.isVisible ? 'text-[var(--color-text-primary)] bg-[var(--color-surface-secondary)]' : 'text-[var(--color-text-muted)]'}`}
              >
                {section.settings.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            
            {expandedSection === section.id && renderContentFields(section)}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => addSection('gallery')}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] p-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Gallery
        </button>
        <button
          onClick={() => addSection('files')}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] p-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Files
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => addSection('contact')}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] p-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Contact
        </button>
        <button
          onClick={() => addSection('custom')}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] p-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Custom
        </button>
      </div>
    </div>
  )
}
