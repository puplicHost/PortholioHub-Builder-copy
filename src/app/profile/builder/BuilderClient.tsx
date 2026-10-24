/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useCallback, useMemo, useEffect, useRef, useDeferredValue } from 'react'
import {
  ArrowLeft, Monitor, Smartphone, ExternalLink, Globe,
  Undo2, Redo2, CheckCircle, Check, Loader2, AlertCircle,
  GripVertical, Eye, EyeOff, ChevronRight, LayoutGrid,
  Palette, Layout, FileText, Menu, X, Sliders, Plus, Trash2,
  Trophy, Star, Users, Briefcase, Heart, Zap, Target, Award,
  Clock, TrendingUp, Code, Layers, Rocket, PenTool, Sun, Moon,
  ArrowUp, BarChart3, LogOut, Languages, User, AlertTriangle, Lock, Save
} from 'lucide-react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { useConfirm } from './ui/ConfirmModal'
import { Select } from './ui/Select'
import { FileButton } from './ui/FileButton'
import { getFriendlyErrorMessage } from '@/lib/validations/error-messages'
import { isSectionLockedForFree, stripLockedSectionsForFree } from '@/lib/free-sections'
import { isSectionVisible, withSectionVisibility } from '@/lib/section-visibility'
import { getWhatsAppLink, digitsOnly } from '@/lib/whatsapp'
import { getPortfolioLang, pickLang } from '@/lib/portfolio-language'
import { useRouter } from 'next/navigation'
import { updatePortfolio, createProjectPage, deleteProjectPage, publishProfile, unpublishProfile, getOrCreateProfile } from '@/lib/actions/portfolio'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { LivePreview } from './LivePreview'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ThemeSettings } from './ThemeSettings'
import { ProjectManager } from './ProjectManager'
import { TestimonialsEditor } from './TestimonialsEditor'
import { GalleryEditor } from './GalleryEditor'
import { FilesEditor } from './FilesEditor'
import { ContactEditor } from './ContactEditor'
import { CustomEditor } from './CustomEditor'

const ICON_OPTIONS = [
  { key: 'trophy', icon: Trophy },
  { key: 'star', icon: Star },
  { key: 'users', icon: Users },
  { key: 'briefcase', icon: Briefcase },
  { key: 'heart', icon: Heart },
  { key: 'zap', icon: Zap },
  { key: 'target', icon: Target },
  { key: 'award', icon: Award },
  { key: 'clock', icon: Clock },
  { key: 'trendingup', icon: TrendingUp },
  { key: 'globe', icon: Globe },
  { key: 'code', icon: Code },
  { key: 'layers', icon: Layers },
  { key: 'checkcircle', icon: CheckCircle },
  { key: 'rocket', icon: Rocket },
  { key: 'layout', icon: Layout },
  { key: 'palette', icon: Palette },
  { key: 'pen', icon: PenTool },
] as const

function IconPicker({ value, onChange }: { value?: string; onChange: (key: string | undefined) => void }) {
  const { t } = useBuilderI18n()
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ICON_OPTIONS.map(({ key, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(value === key ? undefined : key)}
          aria-label={t('misc.useIcon', { key })}
          aria-pressed={value === key}
          className={`p-1.5 rounded-md border transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
            value === key
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-text-primary)]'
          }`}
          title={key}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label={t('misc.clearIcon')}
          className="p-1.5 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          title={t('misc.clearIcon')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function ProjectPagePreview({ profile, projectPage }: { profile: any; projectPage: any }) {
  const appearance = profile.appearance || {}
  const defaultLangMode = getPortfolioLang(appearance)
  const defaultColorMode = appearance.colorMode || 'light'
  const [lang, setLang] = useState<'ar' | 'en'>(defaultLangMode === 'ar' ? 'ar' : 'en')
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultColorMode)
  // Sync when the incoming defaults change (render-phase adjustment instead
  // of setState-in-effect: same end state, no cascading render pass).
  const [prevDefaults, setPrevDefaults] = useState({ lang: defaultLangMode, theme: defaultColorMode })
  if (prevDefaults.lang !== defaultLangMode || prevDefaults.theme !== defaultColorMode) {
    setPrevDefaults({ lang: defaultLangMode, theme: defaultColorMode })
    setLang(defaultLangMode === 'ar' ? 'ar' : 'en')
    setTheme(defaultColorMode)
  }

  const primary = appearance.primaryColor || '#60a5fa'
  const primaryLight = adjustColor(primary, 40)
  const bgLight = appearance.bgColorLight || '#f9fafb'
  const bgDark = appearance.bgColorDark || '#111827'
  const currentBg = theme === 'dark' ? bgDark : bgLight
  const currentText = theme === 'dark' ? '#f3f4f6' : '#1f2937'
  const currentCard = theme === 'dark' ? adjustColor(bgDark, 15) : adjustColor(bgLight, -5)
  const currentBorder = theme === 'dark' ? '#374151' : '#e5e7eb'
  const fontFam = appearance.font || 'Inter'
  const localized = profile.localized || {}
  const displayName = localized.displayName?.[lang] || profile.displayName || profile.username
  const initial = displayName.substring(0, 2).toUpperCase()
  const projects = projectPage.items || []
  const displayMode = projectPage.displayMode || 'grid'

  const style = {
    '--color-primary': primary,
    '--color-primary-light': primaryLight,
    '--color-bg': currentBg,
    '--color-text': currentText,
    '--color-card': currentCard,
    '--color-border': currentBorder,
    fontFamily: `"${fontFam}", system-ui, sans-serif`,
  } as React.CSSProperties

  return (
    <div className="relative w-full h-full overflow-y-auto" style={style}>
      <div className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Navbar */}
        <nav className="sticky top-0 z-40 py-3" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 85%, transparent)', backdropFilter: 'blur(10px)' }}>
          <div className="max-w-[1200px] mx-auto px-6 sm:px-12 flex items-center justify-between">
            <a href="#" className="flex items-center">
              {appearance.logoUrl ? (
                <img src={appearance.logoUrl} alt="Logo" className="h-9 w-auto object-contain" />
              ) : (
                <span className="text-2xl font-black text-[var(--color-primary)] tracking-tight">{initial}</span>
              )}
            </a>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm text-[var(--color-text)] cursor-pointer"
              >
                {theme === 'dark' ? '☀' : '☾'}
              </button>
            </div>
          </div>
        </nav>

        {/* Back Button */}
        {projectPage.showBackButton !== false && (
          <div className="max-w-[1200px] mx-auto px-6 sm:px-12 pt-6">
            <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text)] opacity-70 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">
              <ArrowUp className="h-4 w-4 rotate-[-90deg]" />
              {projectPage.backButtonLabel || 'Back to Portfolio'}
            </a>
          </div>
        )}

        {/* Page Title */}
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 py-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] break-words">{projectPage.title}</h1>
          {projectPage.description && (
            <p className="mt-3 text-[var(--color-text-muted)] text-lg break-words">{projectPage.description}</p>
          )}
        </div>

        {/* Projects Grid/List */}
        <div className="max-w-[1200px] mx-auto px-6 sm:px-12 pb-16">
          {displayMode === 'list' ? (
            <div className="flex flex-col gap-6">
              {projects.map((item: any) => (
                <div key={item.id} className="flex flex-col sm:flex-row rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm">
                  <div className="w-full sm:w-[300px] h-[200px] sm:h-auto shrink-0 bg-[var(--color-bg)] flex items-center justify-center border-b sm:border-b-0 sm:border-e border-[var(--color-border)] overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title || 'Project'} className="w-full h-full object-cover" />
                    ) : (
                      <Code className="h-12 w-12 text-[var(--color-border)]" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1 min-w-0">
                    <h3 className="text-xl font-bold tracking-tight break-words text-[var(--color-text)] mb-3">{item.title || 'Project Item'}</h3>
                    {item.textContent && <p className="text-[var(--color-text-muted)] text-[15px] leading-relaxed break-words mb-4">{item.textContent}</p>}
                    {(() => {
                      const itemLinkType = item.linkType || (item.type === 'page_link' ? 'page' : 'none')
                      const itemSlug = item.linkedPageSlug || (item.type === 'page_link' ? item.externalUrl : null)
                      if (itemLinkType === 'page' && itemSlug) {
                        return (
                          <a href={`/u/${profile.username}/projects/${itemSlug}`} className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity mt-auto">
                            <ExternalLink className="h-4 w-4" /> {item.linkLabel || item.title || 'View'}
                          </a>
                        )
                      }
                      if (itemLinkType === 'external' && item.externalUrl) {
                        return (
                          <a href={item.externalUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity mt-auto">
                            <ExternalLink className="h-4 w-4" /> {item.linkLabel || item.title || 'View'}
                          </a>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-[var(--color-text)] opacity-70 text-center py-8">No projects on this page yet.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {projects.map((item: any) => (
                <div key={item.id} className="group rounded-[15px] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                  <div className="h-[200px] w-full bg-[var(--color-bg)] flex items-center justify-center border-b border-[var(--color-border)] overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title || 'Project'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Code className="h-12 w-12 text-[var(--color-border)]" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1 min-w-0">
                    <h3 className="text-xl font-bold tracking-tight break-words text-[var(--color-text)] mb-3">{item.title || 'Project Item'}</h3>
                    {item.textContent && <p className="text-[var(--color-text-muted)] text-[15px] leading-relaxed break-words mb-4 line-clamp-3">{item.textContent}</p>}
                    {(() => {
                      const itemLinkType = item.linkType || (item.type === 'page_link' ? 'page' : 'none')
                      const itemSlug = item.linkedPageSlug || (item.type === 'page_link' ? item.externalUrl : null)
                      if (itemLinkType === 'page' && itemSlug) {
                        return (
                          <a href={`/u/${profile.username}/projects/${itemSlug}`} className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity mt-auto">
                            <ExternalLink className="h-4 w-4" /> {item.linkLabel || item.title || 'View'}
                          </a>
                        )
                      }
                      if (itemLinkType === 'external' && item.externalUrl) {
                        return (
                          <a href={item.externalUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold flex items-center gap-1 text-[var(--color-primary)] hover:opacity-80 transition-opacity mt-auto">
                            <ExternalLink className="h-4 w-4" /> {item.linkLabel || item.title || 'View'}
                          </a>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-[var(--color-text)] opacity-70 text-center py-8 col-span-full">No projects on this page yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer — matches the public project page: primary-colour band with
            background-toned ink (owner request); owner overrides win. */}
        <footer
          className="py-16"
          style={{ backgroundColor: appearance.footerBg || 'var(--color-primary)', color: appearance.footerText || 'var(--color-bg)' }}
        >
          <div className="max-w-[1200px] mx-auto px-6 sm:px-12">
            <div className="text-center text-sm opacity-60">
              © 2026 · Developed with PortfolioHub
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2))
}

// The preview is inline (no iframe). ClassicTemplate uses container-query
// breakpoints, so its layout follows the preview box width rather than the
// browser window: the phone frame shows a real mobile layout and the desktop
// canvas shows the desktop layout even on a phone. Both are draft-driven.
// Item 8: one labelled text field that, in bilingual mode, renders a second
// `{en,ar}` input — stored in the existing shape item fields already validate
// (lstringOrText). Flat legacy strings show in the EN box and upgrade to
// `{en}` on first edit; the renderer falls back to the other language.
function BiField({ idBase, label, value, showEn, showAr, onChange, multiline, placeholderEn, placeholderAr }: {
  idBase: string
  label: string
  value: any
  showEn: boolean
  showAr: boolean
  onChange: (lang: 'ar' | 'en', val: string) => void
  multiline?: boolean
  placeholderEn?: string
  placeholderAr?: string
}) {
  const obj = value && typeof value === 'object' ? value : {}
  // Legacy flat strings must never be hidden: a single-language portfolio
  // (showAr only, say) would otherwise render the stored value in the hidden
  // EN box. Fall the flat value into whichever box is visible.
  const flat = typeof value === 'string' ? value : ''
  const en = obj.en || flat
  const ar = obj.ar || flat
  const base = 'w-full rounded-lg border border-[var(--color-border)] bg-transparent text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]'
  return (
    <div className="space-y-3">
      {showEn && (
        <div>
          <label htmlFor={`${idBase}-en`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{showAr ? `${label} (English)` : label}</label>
          {multiline ? (
            <textarea id={`${idBase}-en`} value={en} onChange={e => onChange('en', e.target.value)} placeholder={placeholderEn} className={`${base} min-h-[100px] resize-y p-3`} />
          ) : (
            <Input id={`${idBase}-en`} value={en} onChange={e => onChange('en', e.target.value)} placeholder={placeholderEn} className={`${base} min-h-[44px] h-[44px] px-[12px] py-[10px]`} />
          )}
        </div>
      )}
      {showAr && (
        <div dir="rtl">
          <label htmlFor={`${idBase}-ar`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{showEn ? `${label} (عربي)` : label}</label>
          {multiline ? (
            <textarea id={`${idBase}-ar`} value={ar} onChange={e => onChange('ar', e.target.value)} placeholder={placeholderAr} className={`${base} min-h-[100px] resize-y p-3 text-right`} />
          ) : (
            <Input id={`${idBase}-ar`} value={ar} onChange={e => onChange('ar', e.target.value)} placeholder={placeholderAr} className={`${base} min-h-[44px] h-[44px] px-[12px] py-[10px] text-right`} />
          )}
        </div>
      )}
    </div>
  )
}

function FormCard({ children, title, subtitle, action }: { children: React.ReactNode, title?: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm space-y-4">
      {(title || action) && (
        <div className="flex items-center justify-between mb-1">
          <div>
            {title && <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">{title}</h3>}
            {subtitle && <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function AddActionCard({ onClick, label, icon: Icon = Plus }: { onClick: () => void, label: string, icon?: any }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-4 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all cursor-pointer font-medium text-[13px]"
      type="button"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function ItemCard({ children, title, subtitle, onRemove, onEdit }: { children: React.ReactNode, title?: string, subtitle?: string, onRemove?: () => void, onEdit?: () => void }) {
  const { t } = useBuilderI18n()
  const confirm = useConfirm()

  const handleRemove = async () => {
    const ok = await confirm({
      title: t('confirm.removeItemTitle'),
      message: t('confirm.removeItemMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (ok) onRemove?.()
  }

  return (
    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] space-y-3 relative group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {title && <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{title}</h4>}
          {subtitle && <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
          {onEdit && (
            <button aria-label={t('common.editItem')} onClick={onEdit} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              <PenTool className="w-3.5 h-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              aria-label={t('common.removeItem')}
              onClick={() => void handleRemove()}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

function SortableSectionItem({
  sec,
  isSelected,
  isVisible,
  locked,
  onSelect,
  onToggleVisibility,
}: {
  sec: any
  isSelected: boolean
  isVisible: boolean
  locked?: boolean
  onSelect: () => void
  onToggleVisibility: (e: React.MouseEvent) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sec.id })
  const { t } = useBuilderI18n()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      aria-disabled={locked || undefined}
      title={locked ? t('sections.lockedTitle') : undefined}
      className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all ${
        locked
          ? 'opacity-50 cursor-not-allowed border-transparent bg-white/40 dark:bg-white/[0.03]'
          : 'cursor-pointer'
      } ${
        isSelected && !locked
          ? 'bg-[var(--color-surface)] border-[var(--color-primary)] shadow-sm text-[var(--color-primary)] font-semibold'
          : locked
            ? 'text-[var(--color-text-muted)]'
            : 'border-transparent bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-[var(--color-border)] text-[var(--color-text-primary)]'
      } ${isDragging ? 'z-50 shadow-md' : ''}`}
    >
      <div className="flex items-center gap-2 truncate">
        {locked ? (
          <span className="p-1 rounded flex items-center justify-center shrink-0 -ms-1" aria-hidden="true">
            <Lock className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
          </span>
        ) : (
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label={t('sections.dragReorder')}
            className="cursor-grab active:cursor-grabbing p-1 -ms-1 rounded hover:bg-black/5 dark:hover:bg-white/10 touch-none flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            title={t('sections.dragReorder')}
          >
            <GripVertical className="h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-60 group-hover:opacity-100 shrink-0" />
          </div>
        )}
        <span className="text-xs capitalize truncate">{t(`section.${sec.sectionType}`)}</span>
        {locked && (
          <span className="rounded-full bg-[#D4A017]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#8a6d0b] dark:text-[#e8c547] shrink-0">
            {t('sections.pro')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {locked ? (
          <Lock className="h-3.5 w-3.5 text-[var(--color-text-muted)]" aria-hidden="true" />
        ) : (
          <>
            {/* Eye visibility toggle */}
            <button
              onClick={onToggleVisibility}
              aria-label={isVisible ? t('sections.hideAria', { name: t(`section.${sec.sectionType}`) }) : t('sections.showAria', { name: t(`section.${sec.sectionType}`) })}
              aria-pressed={isVisible}
              className={`p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isVisible ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)] opacity-50'
              }`}
              title={isVisible ? t('sections.hideTitle') : t('sections.showTitle')}
            >
              {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>

            {/* Chevron */}
            <ChevronRight
              className={`h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform ${
                isSelected ? 'rotate-90 text-[var(--color-primary)]' : 'rtl:rotate-180'
              }`}
            />
          </>
        )}
      </div>
    </div>
  )
}

const VALID_PROJECT_ITEM_TYPES = [
  'workspace_strategy',
  'workspace_content',
  'workspace_media',
  'external_link',
  'external_text',
  'external_image',
]

// Sections locked behind a paid subscription (FREE plan). Free users can
// view/edit: hero, about, projects (section), footer (+ contact/gallery/files/custom).
// Locked: experience, skills, services, testimonials (+ project pages & analytics).
// Single source of truth lives in @/lib/free-sections (also used to strip
// locked sections from preview + public output).
// Builder chrome strings live in ./i18n/dictionaries. Only the builder's
// surrounding chrome (nav / tabs / status / publish) follows the builder UI
// language; the portfolio canvas keeps its own language and direction.

const BUILDER_DARK_KEY = 'portfoliohub-builder-dark'

// Local-only draft autosave (Phase 2): protects against losing unsaved work
// on refresh/close. Per-profile, stored in localStorage, never sent to server.
const BUILDER_DRAFT_PREFIX = 'portfoliohub-builder-draft:'

// Shown when the mobile "Go Live" button is tapped before publishing.
function ensureValidProjectItemTypes(projectPages: any[]) {
  if (!projectPages) return []
  return projectPages.map((proj: any) => ({
    ...proj,
    items: (proj.items || []).map((item: any) => ({
      ...item,
      type: item.type && VALID_PROJECT_ITEM_TYPES.includes(item.type) ? item.type : 'external_link',
    })),
  }))
}

/** Minimal shape shared by cards and content pages in `profile.projectPages`. */
type BuilderProjectPageRow = {
  id: string
  title?: string | null
  slug?: string | null
  showInProjects?: boolean
  linkedPageSlug?: string | null
  content?: unknown
}

/** Cards are home-page entries; pages are the detail pages that hold content. */
function isProjectCard(row: BuilderProjectPageRow): boolean {
  return row.showInProjects !== false
}

/** Page slug a card points at (top-level field or legacy `content` mirror). */
function linkedPageSlugOf(row: BuilderProjectPageRow): string {
  if (typeof row.linkedPageSlug === 'string' && row.linkedPageSlug.trim() !== '') {
    return row.linkedPageSlug.trim()
  }
  if (row.content && typeof row.content === 'object' && !Array.isArray(row.content)) {
    const slug = (row.content as Record<string, unknown>).linkedPageSlug
    if (typeof slug === 'string') return slug.trim()
  }
  return ''
}

function getProfileSnapshot(p: any): string {
  if (!p) return ''
  return JSON.stringify({
    id: p.id,
    username: p.username,
    avatarUrl: p.avatarUrl,
    appearance: p.appearance,
    localized: p.localized,
    contactLinks: p.contactLinks,
    sections: p.pages?.[0]?.sections,
    projectPages: p.projectPages,
  })
}

function ProfileMenu({
  displayName,
  onToggleLocale,
  dark,
  onToggleDark,
  onLogout,
}: {
  displayName: string
  onToggleLocale: () => void
  dark: boolean
  onToggleDark: () => void
  onLogout: () => void
}) {
  const { locale, t } = useBuilderI18n()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const rowClass =
    'w-full flex items-center gap-2.5 px-3 py-2 min-h-[44px] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer text-start'

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        className="flex h-11 min-h-[44px] w-11 min-w-[44px] rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-secondary)] items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
        title={displayName}
        aria-label={t('menu.profileMenu')}
        aria-expanded={open}
      >
        <User className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-12 z-50 w-52 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden"
        >
          <div className="px-3 py-2.5 border-b border-[var(--color-border)]">
            <p className="text-xs font-bold truncate">{displayName}</p>
          </div>
          <button
            onClick={() => {
              onToggleLocale()
              setOpen(false)
            }}
            className={rowClass}
          >
            <Languages className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="flex-1">
              {locale === 'ar' ? t('menu.switchToEnglish') : t('menu.switchToArabic')}
            </span>
            <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
              {locale === 'ar' ? 'EN' : 'عربي'}
            </span>
          </button>
          <button
            onClick={() => {
              onToggleDark()
              setOpen(false)
            }}
            className={rowClass}
          >
            {dark ? (
              <Sun className="h-4 w-4 text-[var(--color-text-muted)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--color-text-muted)]" />
            )}
            <span className="flex-1">{dark ? t('menu.lightMode') : t('menu.darkMode')}</span>
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className={`${rowClass} border-t border-[var(--color-border)]`}
          >
            <LogOut className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="flex-1">{t('menu.logout')}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function BuilderClient({
  initialProfile,
  initialSubscriptionState = 'NONE',
  whatsappNumber = '',
}: {
  initialProfile: any
  initialSubscriptionState?: string
  whatsappNumber?: string
}) {
  const { toast } = useToast()
  const { locale, dir, t, toggleLocale } = useBuilderI18n()
  const confirm = useConfirm()
  // Chrome labels used across the header/tabs. Kept as an object so the
  // existing JSX stays readable; all values come from the builder dictionary.
  const L = {
    builderTitle: t('labels.builderTitle'),
    saveSaving: t('labels.saveSaving'),
    unsaved: t('labels.unsaved'),
    saved: t('labels.saved'),
    saveFailed: t('labels.saveFailed'),
    publish: t('labels.publish'),
    unpublish: t('labels.unpublish'),
    publishing: t('labels.publishing'),
    unpublishing: t('labels.unpublishing'),
    published: t('labels.published'),
    unpublished: t('labels.unpublished'),
    sections: t('labels.sections'),
    pages: t('labels.pages'),
    edit: t('labels.edit'),
    preview: t('labels.preview'),
    saveChanges: t('labels.saveChanges'),
    savedChanges: t('labels.savedChanges'),
    navigation: t('labels.navigation'),
    openSections: t('labels.openSections'),
    openEditor: t('labels.openEditor'),
    viewPreview: t('labels.viewPreview'),
    goLive: t('labels.goLive'),
    publishAria: t('labels.publishAria'),
    unpublishAria: t('labels.unpublishAria'),
  }
  const router = useRouter()

  // FREE plan = anything that is not an active/paid state. Locked features
  // (experience/skills/services/testimonials/project pages/analytics) show a
  // lock + upgrade toast instead of opening.
  const isFreePlan = initialSubscriptionState !== 'ACTIVE' && initialSubscriptionState !== 'GRACE'
  // Every upgrade touchpoint (banner, locked-section toasts, CTAs) funnels
  // to WhatsApp using the platform number from settings.
  const upgradeHref = getWhatsAppLink(whatsappNumber) ?? '/profile/subscription'
  const hasWhatsapp = digitsOnly(whatsappNumber).length > 0
  const lockedToastAction = useMemo(
    () =>
      hasWhatsapp
        ? {
            label: t('locked.whatsappAction'),
            onClick: () => window.open(upgradeHref, '_blank', 'noopener,noreferrer'),
          }
        : undefined,
    [hasWhatsapp, upgradeHref, t],
  )
  const showLockedToast = useCallback(() => {
    toast('warning', t('locked.feature'), lockedToastAction)
  }, [toast, lockedToastAction, t])

  const handleLogout = async () => {
    // Privacy on shared devices: never leave this user's unsaved draft behind.
    try {
      if (profile?.id) window.localStorage.removeItem(`${BUILDER_DRAFT_PREFIX}${profile.id}`)
    } catch {
      /* storage unavailable — ignore */
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // cookie cleared server-side anyway on next load; proceed to login
    }
    router.push('/login')
    router.refresh()
  }
  const [profile, setProfile] = useState(() => {
    if (!initialProfile?.pages?.[0]?.sections) return initialProfile
    const sections = [...(initialProfile.pages[0].sections || [])]
    const hasFooter = sections.some((s: any) => s.sectionType === 'footer')

    // Contact is a first-class section type (Sprint F3): never converted
    // or removed here. Only ensure a footer exists for old profiles.
    if (!hasFooter) {
      const migrated = [...sections]
      const maxOrder = migrated.reduce((max: number, s: any) => Math.max(max, s.sectionOrder || 0), 0)
      migrated.push({
        id: `new-footer-${Date.now()}`,
        sectionType: 'footer',
        sectionOrder: maxOrder + 1,
        content: {
          headline: { en: 'Work with me', ar: 'تواصل معي' },
          subheading: { en: "Let's build something great together.", ar: 'دعنا نبني شيئاً رائعاً معاً.' },
          links: initialProfile.contactLinks || [],
        },
        settings: { isVisible: true },
      })

      return {
        ...initialProfile,
        pages: [{
          ...initialProfile.pages[0],
          sections: migrated,
        }, ...initialProfile.pages.slice(1)],
      }
    }

    return initialProfile
  })
  const [leftTab, setLeftTab] = useState<'sections' | 'pages'>('sections')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedSectionType, setSelectedSectionType] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightSheetOpen, setRightSheetOpen] = useState(false)
  const [builderDarkMode, setBuilderDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(BUILDER_DARK_KEY) === '1'
    } catch {
      return false
    }
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activePage, setActivePage] = useState<'home' | string>('home')
  const [creatingProjectPage, setCreatingProjectPage] = useState(false)
  // True on real phones (< 768px). Forces the mobile preview frame.
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  // Mobile publish button feedback: idle → busy (spinner) → done (✓) → idle.
  const [publishState, setPublishState] = useState<
    'idle' | 'publishing' | 'unpublishing' | 'published' | 'unpublished'
  >('idle')
  const publishResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Mobile bottom-bar "Save Changes" feedback: idle → saving → saved → idle.
  const [mobileSaveState, setMobileSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [savedSnapshot, setSavedSnapshot] = useState(() => getProfileSnapshot(profile))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  // Version conflict (another tab saved first): blocks saves until the
  // user picks Reload or Overwrite in the modal (Sprint F4).
  const [conflict, setConflict] = useState<{ serverVersion: number } | null>(null)
  const backoffRef = useRef(0)

  // Builder dark mode is scoped to the builder wrapper (`dark` class +
  // `[data-theme]` on `.builder-root`, which sets all CSS vars and enables the
  // Tailwind `dark:` variant for its subtree). It is NOT written to <html>, so
  // it can never leak into other routes or fight next-themes. The preference
  // is persisted so it survives reloads.
  useEffect(() => {
    try {
      window.localStorage.setItem(BUILDER_DARK_KEY, builderDarkMode ? '1' : '0')
    } catch {
      // storage unavailable — ignore
    }
  }, [builderDarkMode])

  useEffect(() => {
    return () => {
      if (publishResetTimer.current) clearTimeout(publishResetTimer.current)
      if (saveResetTimer.current) clearTimeout(saveResetTimer.current)
    }
  }, [])

  // On a real phone the device switcher is hidden, so the phone frame is
  // always used there regardless of the desktop/mobile toggle.
  useEffect(() => {
    const check = () => {
      setIsMobileViewport(window.innerWidth < 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Serialize once per profile change (not once per render): this is the only
  // place the full snapshot is computed, and both dirty-checking and the
  // draft autosave reuse it.
  const currentSnapshot = useMemo(() => getProfileSnapshot(profile), [profile])
  const isDirty = currentSnapshot !== savedSnapshot

  // ---- Local draft autosave (Phase 2) -------------------------------------
  // Draft lives ONLY in localStorage (per profile) and is cleared on every
  // successful server save; nothing here touches the network.
  const draftKey = profile?.id ? `${BUILDER_DRAFT_PREFIX}${profile.id}` : null
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)
  const draftRestoredRef = useRef(false)

  // Restore a pending local draft once on mount (only if it differs from the
  // server snapshot, so a clean reload never re-applies anything).
  // LocalStorage is unavailable during SSR, so this client-only restore cannot
  // be derived during render without a hydration mismatch — hence the setState
  // here (the one legitimate case the compiler rule does not cover).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (draftRestoredRef.current || !draftKey) return
    draftRestoredRef.current = true
    // Shared-device privacy: drop any draft belonging to a different account.
    try {
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(BUILDER_DRAFT_PREFIX) && k !== draftKey) {
          window.localStorage.removeItem(k)
        }
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = window.localStorage.getItem(draftKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { snapshot?: string; ts?: number }
      if (!parsed?.snapshot || typeof parsed.snapshot !== 'string') {
        window.localStorage.removeItem(draftKey)
        return
      }
      if (parsed.snapshot === getProfileSnapshot(profile)) {
        window.localStorage.removeItem(draftKey)
        return
      }
      const d = JSON.parse(parsed.snapshot)
      setProfile((p: any) => ({
        ...p,
        avatarUrl: d.avatarUrl ?? p.avatarUrl,
        appearance: d.appearance ?? p.appearance,
        localized: d.localized ?? p.localized,
        contactLinks: d.contactLinks ?? p.contactLinks,
        pages: p.pages?.length
          ? [{ ...p.pages[0], sections: d.sections ?? p.pages[0]?.sections }, ...p.pages.slice(1)]
          : p.pages,
        projectPages: d.projectPages ?? p.projectPages,
      }))
      setDraftSavedAt(typeof parsed.ts === 'number' ? parsed.ts : Date.now())
      toast('info', t('toasts.draftRestored'))
    } catch {
      try {
        window.localStorage.removeItem(draftKey)
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Debounced autosave of the dirty snapshot to localStorage.
  useEffect(() => {
    if (!draftKey || !isDirty) return
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({ snapshot: currentSnapshot, ts: Date.now() }),
        )
        setDraftSavedAt(Date.now())
      } catch {
        /* storage full/unavailable — ignore */
      }
    }, 2500)
    return () => clearTimeout(t)
  }, [currentSnapshot, isDirty, draftKey])

  const handleSaveChanges = async (forceVersion?: number): Promise<boolean> => {
    if (saveStatus === 'saving') return false
    setSaveStatus('saving')
    try {
      const res = await updatePortfolio({
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        appearance: profile.appearance,
        localized: profile.localized,
        contactLinks: profile.contactLinks,
        sections: profile.pages[0]?.sections,
        projects: ensureValidProjectItemTypes(profile.projectPages),
        expectedVersion: forceVersion ?? profile.version,
      })
      if (res.success) {
        // Server state is now authoritative — drop the local draft.
        if (draftKey) {
          try {
            window.localStorage.removeItem(draftKey)
          } catch {
            /* ignore */
          }
        }
        setDraftSavedAt(null)
        let nextProfile = profile
        if (typeof (res as any).version === 'number') {
          nextProfile = { ...nextProfile, version: (res as any).version }
          setProfile(nextProfile)
        }
        if ((res as any).savedProjects && (res as any).savedProjects.length > 0) {
          let updatedPages = [...(profile.projectPages || [])]
          for (const sp of (res as any).savedProjects) {
            updatedPages = updatedPages.map((page: any) => {
              if (page.id === sp.tempId || page.id === sp.id) {
                return {
                  ...page,
                  id: sp.id,
                  slug: sp.slug,
                  title: sp.title || page.title,
                }
              }
              return page
            })

            if (sp.tempId) {
              updatedPages = updatedPages.map((page: any) => {
                if (page.linkedPageSlug === sp.tempId || page.linkedPageSlug === `project-${sp.tempId}`) {
                  return {
                    ...page,
                    linkedPageSlug: sp.slug,
                  }
                }
                return page
              })
            }
          }
          nextProfile = {
            ...nextProfile,
            projectPages: updatedPages,
          }
          setProfile(nextProfile)

          setActivePage((curr) => {
            const matched = (res as any).savedProjects.find((sp: any) => sp.tempId === curr)
            return matched ? matched.id : curr
          })
        }
        if ((res as any).savedSections && (res as any).savedSections.length > 0) {
          const byTemp = new Map((res as any).savedSections.map((s: any) => [s.tempId, s.id]))
          const remap = (sections: any[]) =>
            (sections || []).map((sec: any) =>
              sec.id && byTemp.has(sec.id) ? { ...sec, id: byTemp.get(sec.id) } : sec,
            )
          nextProfile = {
            ...nextProfile,
            pages: (nextProfile.pages || []).map((pg: any, i: number) =>
              i === 0 ? { ...pg, sections: remap(pg.sections) } : pg,
            ),
          }
          setProfile(nextProfile)
        }
        setSavedSnapshot(getProfileSnapshot(nextProfile))
        setSaveStatus('saved')
        backoffRef.current = 0
        toast('success', t('toasts.saved'))
        return true
      } else if ((res as any).conflict) {
        setSaveStatus('error')
        setConflict({ serverVersion: (res as any).currentVersion ?? profile.version })
        return false
      } else {
        setSaveStatus('error')
        toast('error', getFriendlyErrorMessage((res as any)?.code ?? res.error ?? 'SAVE_FAILED', locale))
        return false
      }
    } catch (err: any) {
      console.error('Failed to save changes', err)
      setSaveStatus('error')
      toast('error', getFriendlyErrorMessage('NETWORK_ERROR', locale))
      return false
    }
  }

  const handlePublish = async () => {
    if (saveStatus === 'saving' || publishState === 'publishing' || publishState === 'unpublishing') return
    if (publishResetTimer.current) {
      clearTimeout(publishResetTimer.current)
      publishResetTimer.current = null
    }
    const resetSoon = () => {
      publishResetTimer.current = setTimeout(() => setPublishState('idle'), 3000)
    }
    if (profile.status === 'PUBLISHED') {
      setPublishState('unpublishing')
      const res = await unpublishProfile()
      if (res.success) {
        setProfile((p: any) => ({ ...p, status: 'DRAFT', version: (res as any).version ?? p.version }))
        toast('success', t('toasts.unpublished'))
        setPublishState('unpublished')
        resetSoon()
      } else {
        toast('error', getFriendlyErrorMessage((res as any)?.code ?? (res as any).error ?? 'UNPUBLISH_FAILED', locale))
        setPublishState('idle')
      }
      return
    }
    setPublishState('publishing')
    const saved = await handleSaveChanges()
    if (!saved) {
      setPublishState('idle')
      return
    }
    const res = await publishProfile()
    if (res.success) {
      setProfile((p: any) => ({ ...p, status: 'PUBLISHED', version: (res as any).version ?? p.version }))
      toast('success', t('toasts.published'))
      setPublishState('published')
      resetSoon()
    } else {
      toast('error', getFriendlyErrorMessage((res as any)?.code ?? (res as any).error ?? 'PUBLISH_FAILED', locale))
      setPublishState('idle')
    }
  }

  // Mobile bottom bar "Go Live": opens the public portfolio in a new tab, but
  // only once it has been published (same destination as the desktop
  // "View Live" link).
  const handleGoLive = () => {
    if (profile.status !== 'PUBLISHED' || !profile.username) {
      toast('warning', t('toasts.publishNotReady'))
      return
    }
    setLeftDrawerOpen(false)
    setRightSheetOpen(false)
    window.open(`/u/${profile.username}`, '_blank', 'noopener,noreferrer')
  }

  // Mobile bottom-bar "Save Changes": same action as the header save, with
  // local spinner + a 2s "Saved ✓" confirmation.
  const handleMobileSave = async () => {
    if (mobileSaveState === 'saving') return
    if (saveResetTimer.current) {
      clearTimeout(saveResetTimer.current)
      saveResetTimer.current = null
    }
    setMobileSaveState('saving')
    const ok = await handleSaveChanges()
    if (!ok) {
      setMobileSaveState('idle')
      return
    }
    setMobileSaveState('saved')
    saveResetTimer.current = setTimeout(() => setMobileSaveState('idle'), 2000)
  }

  // Conflict resolution (Sprint F4): Reload discards local edits for the
  // server version; Overwrite re-saves local edits on top of it.
  const handleConflictReload = async () => {
    setConflict(null)
    setSaveStatus('saving')
    try {
      const fresh = await getOrCreateProfile()
      setProfile(fresh)
      setSavedSnapshot(getProfileSnapshot(fresh))
      backoffRef.current = 0
      setSaveStatus('saved')
      toast('success', t('toasts.reloaded'))
    } catch (err: any) {
      console.error('Failed to reload profile', err)
      setSaveStatus('error')
      toast('error', getFriendlyErrorMessage('RELOAD_FAILED', locale))
    }
  }

  const handleConflictOverwrite = async () => {
    if (!conflict) return
    const serverVersion = conflict.serverVersion
    setProfile((p: any) => ({ ...p, version: serverVersion }))
    setConflict(null)
    await handleSaveChanges(serverVersion)
  }

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  // State updater
  const updateProfile = (updater: (prev: any) => any) => {
    setProfile(updater)
  }

  // Theme toggle from inside the live preview canvas: persists the choice to
  // the owner's saved `appearance.colorMode` (survives reload). Stable
  // identity so the memoized preview is not invalidated by unrelated builder
  // state changes.
  const handlePreviewThemeChange = useCallback((mode: 'light' | 'dark') => {
    setProfile((p: any) => ({
      ...p,
      appearance: { ...p.appearance, colorMode: mode },
    }))
  }, [setProfile])

  // Sections from profile, sorted for display.
  const sections = useMemo(() => {
    return [...(profile.pages?.[0]?.sections || [])]
      .sort((a, b) => a.sectionOrder - b.sectionOrder)
  }, [profile.pages])

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null
    return sections.find((s: any) => s.id === selectedSectionId) || null
  }, [sections, selectedSectionId])

  // Builder preview profile: FREE users never see locked sections in the
  // preview — they are stripped from the data before render (not CSS-hidden).
  const previewProfile = useMemo(() => {
    if (!isFreePlan) return profile
    return stripLockedSectionsForFree(profile)
  }, [profile, isFreePlan])

  // Deferred rendering is React's transition-backed mechanism: the form and
  // sidebar stay urgent while the (very large) template re-renders at lower
  // priority. Combined with the memoized LivePreview, typing stays smooth.
  const deferredPreviewProfile = useDeferredValue(previewProfile)

  // Click on a section in the left panel
  const handleSelectSection = (section: any) => {
    setSelectedSectionId(section.id)
    setSelectedSectionType(section.sectionType)
    // Scroll preview to section element
    const targetId =
      section.sectionType === 'footer'
        ? 'contact'
        : section.sectionType === 'contact'
          ? 'contact-info'
          : section.sectionType
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // On mobile, auto-open the right sheet to edit properties
    if (window.innerWidth < 768) {
      setLeftDrawerOpen(false)
      setRightSheetOpen(true)
    }
  }

  // Section visibility toggle
  const toggleSectionVisibility = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    updateProfile((p: any) => {
      const newPages = [...(p.pages || [])]
      if (!newPages[0]) return p
      // Write BOTH representations (top-level `visible` + `settings.isVisible`)
      // through the shared helper so every reader agrees on the state.
      const currentSections = newPages[0].sections || []
      const newSections = currentSections.map((s: any) =>
        s.id === sectionId || s.sectionType === sectionId
          ? withSectionVisibility(s, !isSectionVisible(s))
          : s
      )

      newPages[0] = {
        ...newPages[0],
        sections: newSections,
      }
      return { ...p, pages: newPages }
    })
  }

  // DND sensors and drag end handler for section reordering
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sections.findIndex((s: any) => s.id === active.id)
    const newIndex = sections.findIndex((s: any) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(sections, oldIndex, newIndex)
    reordered.forEach((s: any, i: number) => {
      s.sectionOrder = i + 1
    })

    updateProfile((p: any) => {
      const newPages = [...(p.pages || [])]
      if (newPages[0]) {
        newPages[0] = {
          ...newPages[0],
          sections: reordered,
        }
      }
      return { ...p, pages: newPages }
    })
  }

  // Section content updater
  const updateSectionContent = (sectionId: string, field: string, lang: 'en' | 'ar', value: any) => {
    updateProfile((p: any) => {
      const newPages = [...(p.pages || [])]
      if (!newPages[0]) return p
      const newSections = (newPages[0].sections || []).map((s: any) => {
        if (s.id === sectionId) {
          const content = s.content || {}
          const newContent = {
            ...content,
            [field]: { ...(content[field] || {}), [lang]: value }
          }
          if (field === 'biography') {
            newContent.text = { ...(content.text || {}), [lang]: value }
          }
          return {
            ...s,
            content: newContent
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
      const newPages = [...(p.pages || [])]
      if (!newPages[0]) return p
      const newSections = (newPages[0].sections || []).map((s: any) => {
        if (s.id === sectionId) {
          return { ...s, content: { ...(s.content || {}), [field]: value } }
        }
        return s
      })
      newPages[0].sections = newSections
      return { ...p, pages: newPages }
    })
  }

  // Destructive removals are reversible via the toast's Undo action: the
  // exact removed value is re-inserted at its old index if it is still absent.
  const removeSectionArrayItem = (sectionId: string, field: string, items: any[], index: number) => {
    const removed = items[index]
    updateSectionContentRaw(sectionId, field, items.filter((_: any, i: number) => i !== index))
    if (removed === undefined) return
    const same = (a: any, b: any) => (a?.id && b?.id ? a.id === b.id : a === b)
    toast('info', t('toasts.itemRemoved'), {
      label: t('common.undo'),
      onClick: () => {
        updateProfile((p: any) => {
          const pages = [...(p.pages || [])]
          const page = pages[0]
          if (!page) return p
          const sections = (page.sections || []).map((s: any) => {
            if (s.id !== sectionId) return s
            const current = [...(s.content?.[field] || [])]
            if (!current.some((it: any) => same(it, removed))) {
              current.splice(Math.max(0, Math.min(index, current.length)), 0, removed)
            }
            return { ...s, content: { ...(s.content || {}), [field]: current } }
          })
          pages[0] = { ...page, sections }
          return { ...p, pages }
        })
      },
    })
  }

  // Project page handlers
  const projectPages = useMemo(() => {
    return [...(profile.projectPages || [])].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [profile.projectPages])

  const editingProjectPage = useMemo(() => {
    if (activePage === 'home') return null
    return projectPages.find((p: any) => p.id === activePage) || null
  }, [projectPages, activePage])

  // Slugs referenced by some project card (page-level linkType='page' or a
  // page_link item). A page no card points at is "unlinked": it stays
  // editable here but is hidden from public navigation until linked.
  const isRealSlug = (s: any) =>
    typeof s === 'string' && s !== '' && !s.startsWith('new-') && !s.startsWith('project-new-')
  const linkedPageSlugs = useMemo(() => {
    const refs = new Set<string>()
    for (const pg of profile.projectPages || []) {
      // Only card rows can reference a page.
      if ((pg as any).showInProjects === false) continue
      const linkType = (pg as any).linkType || (pg as any).content?.linkType
      const linked = (pg as any).linkedPageSlug || (pg as any).content?.linkedPageSlug
      if (linkType === 'page' && isRealSlug(linked)) refs.add(linked)
      for (const item of (pg as any).items || []) {
        const itemLinkType = item.linkType || (item.type === 'page_link' ? 'page' : 'none')
        const itemSlug = item.linkedPageSlug || (item.type === 'page_link' ? item.externalUrl : null)
        if (itemLinkType === 'page' && isRealSlug(itemSlug)) refs.add(itemSlug)
      }
    }
    return refs
  }, [profile.projectPages])

  // Resolve a card's linked content page (same profile, real slug).
  const findLinkedPage = (row: BuilderProjectPageRow | null): BuilderProjectPageRow | null => {
    if (!row || !isProjectCard(row)) return null
    const slug = linkedPageSlugOf(row)
    if (!slug) return null
    return (projectPages as BuilderProjectPageRow[]).find(
      (candidate) => candidate.slug === slug && candidate.id !== row.id,
    ) ?? null
  }

  const editingProjectCard = editingProjectPage ? isProjectCard(editingProjectPage) : false
  const editingLinkedSlug = editingProjectPage ? linkedPageSlugOf(editingProjectPage) : ''
  // Cards open their linked page; pages open their own slug. A card that has
  // no link yet keeps its legacy behaviour (own slug).
  const liveProjectSlug = editingProjectPage
    ? (editingProjectCard
        ? (editingLinkedSlug || editingProjectPage.slug || '')
        : (editingProjectPage.slug || ''))
    : ''
  const liveHref = profile.username
    ? activePage !== 'home' && liveProjectSlug
      ? `/u/${profile.username}/projects/${liveProjectSlug}`
      : `/u/${profile.username}`
    : '#'
  const liveDisabled =
    activePage !== 'home' &&
    !!editingProjectPage &&
    (!isRealSlug(liveProjectSlug) || String(editingProjectPage.id || '').startsWith('new-'))

  const focusLinkControl = (pageId: string) => {
    const el = document.getElementById(`pp-link-${pageId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (el instanceof HTMLElement) el.focus()
  }

  const handleCreateProjectPage = async () => {
    setCreatingProjectPage(true)
    try {
      const res = await createProjectPage()
      const realPage = (res as any)?.page || (res as any)?.projectPage || (res as any)?.data
      if (res.success && realPage) {
        updateProfile((p: any) => {
          const currentPages = p.projectPages || []
          // Identify any temp pages starting with "new-"
          const tempPageIds = new Set(
            currentPages
              .filter((item: any) => typeof item.id === 'string' && item.id.startsWith('new-'))
              .map((item: any) => item.id)
          )

          // a. Replace the temp page entry in state with the real page from DB response
          let replaced = false
          const updatedPages = currentPages.map((item: any) => {
            if (item.id === realPage.id || (typeof item.id === 'string' && item.id.startsWith('new-') && !replaced)) {
              replaced = true
              return { ...realPage, items: realPage.items || item.items || [] }
            }
            return item
          })
          if (!replaced) {
            updatedPages.push({ ...realPage, items: realPage.items || [] })
          }

          // b. If any project card has linkType="page" and linkedPageSlug = old temp ID, update it to the real slug
          const finalPages = updatedPages.map((proj: any) => {
            const updatedProj = { ...proj }
            const cardLinkType = proj.linkType || proj.content?.linkType
            const cardLinkedSlug = proj.linkedPageSlug || proj.content?.linkedPageSlug

            if (
              cardLinkType === 'page' &&
              (tempPageIds.has(cardLinkedSlug) ||
                (typeof cardLinkedSlug === 'string' && cardLinkedSlug.startsWith('new-')) ||
                (typeof cardLinkedSlug === 'string' && cardLinkedSlug.startsWith('project-new-')))
            ) {
              updatedProj.linkedPageSlug = realPage.slug
              if (updatedProj.content) {
                updatedProj.content = {
                  ...updatedProj.content,
                  linkedPageSlug: realPage.slug,
                }
              }
            }

            if (proj.items && Array.isArray(proj.items)) {
              updatedProj.items = proj.items.map((item: any) => {
                const itemLinkType = item.linkType || (item.type === 'page_link' ? 'page' : 'none')
                const itemLinkedSlug = item.linkedPageSlug || (item.type === 'page_link' ? item.externalUrl : null)
                if (
                  itemLinkType === 'page' &&
                  (tempPageIds.has(itemLinkedSlug) ||
                    (typeof itemLinkedSlug === 'string' && itemLinkedSlug.startsWith('new-')) ||
                    (typeof itemLinkedSlug === 'string' && itemLinkedSlug.startsWith('project-new-')))
                ) {
                  return {
                    ...item,
                    linkedPageSlug: realPage.slug,
                    externalUrl: item.type === 'page_link' ? realPage.slug : item.externalUrl,
                  }
                }
                return item
              })
            }

            return updatedProj
          })

          return {
            ...p,
            projectPages: finalPages,
          }
        })
        setActivePage(realPage.id)
        setSelectedSectionId(null)
        setSelectedSectionType(null)
        if (window.innerWidth < 768) {
          setLeftDrawerOpen(false)
          setRightSheetOpen(true)
        }
        toast('success', t('toasts.projectPageCreated'))
        toast('warning', t('toasts.linkPageHint'))
      } else {
        console.error('createProjectPage failed:', res.error)
        toast('error', getFriendlyErrorMessage((res as any)?.code ?? res.error ?? 'CREATE_PAGE_FAILED', locale))
      }
    } catch (err) {
      console.error('Failed to create project page', err)
      toast('error', getFriendlyErrorMessage('CREATE_PAGE_FAILED', locale))
    } finally {
      setCreatingProjectPage(false)
    }
  }

  const handleSelectProjectPage = (page: any) => {
    setActivePage(page.id)
    // Clear section selection
    setSelectedSectionId(null)
    setSelectedSectionType(null)
    if (window.innerWidth < 768) {
      setLeftDrawerOpen(false)
      setRightSheetOpen(true)
    }
  }

  const updateProjectPageField = (pageId: string, field: string, value: any) => {
    updateProfile((p: any) => ({
      ...p,
      projectPages: p.projectPages.map((pp: any) =>
        pp.id === pageId ? { ...pp, [field]: value } : pp
      )
    }))
  }

  // Point a project card at a page (card → page by slug). Client state only
  // — persisted on the next manual save like every other builder edit.
  const linkCardToPage = (cardId: string, pageSlug: string) => {
    updateProfile((p: any) => ({
      ...p,
      projectPages: (p.projectPages || []).map((proj: any) => {
        if (proj.id !== cardId) return proj
        const content = { ...((proj as any).content || {}), linkType: 'page', linkedPageSlug: pageSlug }
        return { ...proj, linkType: 'page', linkedPageSlug: pageSlug, content }
      }),
    }))
  }

  // Remove every card link pointing at the given page slug.
  const unlinkPageFromCards = (pageSlug: string) => {
    updateProfile((p: any) => ({
      ...p,
      projectPages: (p.projectPages || []).map((proj: any) => {
        const linked = (proj as any).linkedPageSlug || (proj as any).content?.linkedPageSlug
        if (linked !== pageSlug) return proj
        const content = { ...((proj as any).content || {}), linkType: 'none', linkedPageSlug: '' }
        return { ...proj, linkType: 'none', linkedPageSlug: '', content }
      }),
    }))
  }

  const handleDeleteProjectPage = async (pageId: string) => {
    // Destructive + irreversible on the server (UI/UX #9): confirm first.
    const ok = await confirm({
      title: t('confirm.deleteProjectPageTitle'),
      message: t('confirm.deleteProjectPageMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
    try {
      const res = await deleteProjectPage(pageId)
      if (res.success) {
        updateProfile((p: any) => ({
          ...p,
          projectPages: p.projectPages.filter((pp: any) => pp.id !== pageId)
        }))
        if (activePage === pageId) {
          setActivePage('home')
        }
        toast('success', t('toasts.projectPageDeleted'))
      } else {
        console.error('deleteProjectPage failed:', res.error)
        toast('error', getFriendlyErrorMessage((res as any)?.code ?? res.error ?? 'DELETE_PAGE_FAILED', locale))
      }
    } catch (err) {
      console.error('Failed to delete project page', err)
      toast('error', getFriendlyErrorMessage('DELETE_PAGE_FAILED', locale))
    }
  }

  // Render properties editor for selected section or project page
  const renderRightPanelContent = () => {
    // Project page editing
    if (activePage !== 'home' && editingProjectPage && !selectedSection) {
      const pp = editingProjectPage
      const ppIsCard = isProjectCard(pp)
      const ppLinkedPage = findLinkedPage(pp)
      return (
        <div className="space-y-6">
          <FormCard title={t('form.pageConfiguration')}>
            <div className="space-y-4">
              <div>
                <label htmlFor={`pp-title-${pp.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.pageTitle')}</label>
                <Input
                  id={`pp-title-${pp.id}`}
                  value={pp.title || ''}
                  onChange={(e) => {
                    updateProjectPageField(pp.id, 'title', e.target.value)
                    if (!pp.slug || pp.slug === 'untitled') {
                      updateProjectPageField(pp.id, 'slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                    }
                  }}
                  className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                />
              </div>
              <div>
                <label htmlFor={`pp-slug-${pp.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.urlSlug')}</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-s-md border border-e-0 border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] text-xs">
                    /u/{profile.username}/projects/
                  </span>
                  <Input
                    id={`pp-slug-${pp.id}`}
                    value={pp.slug || ''}
                    onChange={(e) => updateProjectPageField(pp.id, 'slug', e.target.value.replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, ''))}
                    className="h-[44px] min-h-[44px] text-[15px] px-[12px] py-[10px] rounded-s-none flex-1"
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`pp-link-${pp.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.linkToProject')}</label>
                {(() => {
                  const cardRows = (projectPages || []).filter(
                    (proj: any) => proj.showInProjects !== false && proj.id !== pp.id
                  )
                  const linkingCard = cardRows.find((proj: any) => {
                    const linked = (proj as any).linkedPageSlug || (proj as any).content?.linkedPageSlug
                    return linked === pp.slug
                  })
                  return (
                    <>
                      <Select
                        id={`pp-link-${pp.id}`}
                        value={linkingCard ? linkingCard.id : ''}
                        onChange={(value) => {
                          if (value) linkCardToPage(value, pp.slug)
                          else unlinkPageFromCards(pp.slug)
                        }}
                        options={[
                          { value: '', label: t('project.noLink') },
                          ...cardRows.map((proj: any) => ({
                            value: proj.id,
                            label: proj.title || proj.slug || t('common.untitled'),
                          })),
                        ]}
                      />
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                        {t('misc.linkHint')}
                      </p>
                    </>
                  )
                })()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <input
                    id={`pp-card-${pp.id}`}
                    type="checkbox"
                    checked={pp.showInProjects !== false}
                    onChange={(e) => updateProjectPageField(pp.id, 'showInProjects', e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--color-surface)]"
                  />
                  <label htmlFor={`pp-card-${pp.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] cursor-pointer">
                    {t('misc.showAsCard')}
                  </label>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                  {t('misc.showAsCardHint')}
                </p>
              </div>
              <div>
                <label htmlFor={`pp-back-${pp.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.backButtonLabel')}</label>
                <Input
                  id={`pp-back-${pp.id}`}
                  value={pp.backButtonLabel || 'Back to Portfolio'}
                  onChange={(e) => updateProjectPageField(pp.id, 'backButtonLabel', e.target.value)}
                  className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                />
              </div>
            </div>
          </FormCard>

          <FormCard title={t('form.pageHeader')} subtitle={t('form.subtitlePageHeader')}>
            <div className="space-y-4">
              <div>
                <label htmlFor={`pp-cover-${pp.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.coverImageUrl')}</label>
                <div className="flex gap-2">
                  <Input
                    id={`pp-cover-${pp.id}`}
                    value={pp.coverImage || ''}
                    onChange={(e) => updateProjectPageField(pp.id, 'coverImage', e.target.value)}
                    className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    placeholder={t('placeholder.url')}
                  />
                  <FileButton
                    accept="image/*"
                    onFiles={async (files) => {
                      const file = files?.[0]
                      if (!file) return
                      try {
                        const result = await uploadToCloudinary(file)
                        updateProjectPageField(pp.id, 'coverImage', result.url)
                      } catch (err) {
                        console.error(err)
                      }
                    }}
                    className="h-[44px] min-h-[44px] px-4"
                  >
                    {t('common.upload')}
                  </FileButton>
                </div>
                {pp.coverImage && (
                  <img src={pp.coverImage} alt={t('misc.coverPreview')} className="mt-2 w-full h-28 rounded-lg object-cover border border-[var(--color-border)]" />
                )}
              </div>
              <div>
                <label htmlFor={`pp-desc-${pp.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.description')}</label>
                <textarea
                  id={`pp-desc-${pp.id}`}
                  value={pp.description || ''}
                  onChange={(e) => updateProjectPageField(pp.id, 'description', e.target.value)}
                  className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
                />
              </div>
            </div>
          </FormCard>

          {ppIsCard && ppLinkedPage ? (
            <FormCard title={t('projectManager.linkedCardTitle')} subtitle={t('projectManager.linkedCardSubtitle')}>
              <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-4">
                <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {t('projectManager.linkedCardNotice', {
                    title: ppLinkedPage.title || ppLinkedPage.slug || '',
                  })}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="self-start"
                  onClick={() => handleSelectProjectPage(ppLinkedPage)}
                >
                  <ExternalLink className="h-4 w-4 me-1.5" />
                  {t('projectManager.editLinkedPage')}
                </Button>
              </div>
            </FormCard>
          ) : (
          <FormCard title={t('form.projectItems')} subtitle={t('form.subtitleProjectItems')}>
            <div className="space-y-4">
              {ppIsCard && (
                <div role="note" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                    {t('projectManager.unlinkedCardNotice')}
                  </p>
                  <button
                    type="button"
                    onClick={() => focusLinkControl(pp.id)}
                    className="mt-2 inline-flex min-h-[32px] items-center gap-1 text-[12px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    {t('projectManager.linkPageCta')}
                  </button>
                </div>
              )}
              <div>
                <label id={`pp-display-mode-${pp.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.displayMode')}</label>
                <div role="group" aria-labelledby={`pp-display-mode-${pp.id}`} className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
                  <button
                    type="button"
                    onClick={() => updateProjectPageField(pp.id, 'displayMode', 'grid')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                      (pp.displayMode || 'grid') === 'grid'
                        ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {t('display.grid')}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProjectPageField(pp.id, 'displayMode', 'list')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                      pp.displayMode === 'list'
                        ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {t('display.list')}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(pp.items || []).map((item: any, idx: number) => (
                  <ItemCard
                    key={item.id}
                    title={item.title || t('common.item')}
                    onRemove={() => {
                      const removed = (pp.items || [])[idx]
                      const newItems = [...(pp.items || [])]
                      newItems.splice(idx, 1)
                      updateProjectPageField(pp.id, 'items', newItems)
                      if (removed !== undefined) {
                        toast('info', t('toasts.itemRemoved'), {
                          label: t('common.undo'),
                          onClick: () => {
                            const restored = [...newItems]
                            restored.splice(Math.max(0, Math.min(idx, restored.length)), 0, removed)
                            updateProjectPageField(pp.id, 'items', restored)
                          },
                        })
                      }
                    }}
                  >
                    <div className="flex flex-col gap-4 mt-2">
                      <div>
                        <label htmlFor={`pp-item-${item.id}-title`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.title')}</label>
                        <Input
                          id={`pp-item-${item.id}-title`}
                          value={item.title || ''}
                          onChange={(e) => {
                            const newItems = [...(pp.items || [])]
                            newItems[idx].title = e.target.value
                            updateProjectPageField(pp.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] font-semibold"
                        />
                      </div>
                      <div>
                        <label htmlFor={`pp-item-${item.id}-desc`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.description')}</label>
                        <textarea
                          id={`pp-item-${item.id}-desc`}
                          value={item.textContent || ''}
                          onChange={(e) => {
                            const newItems = [...(pp.items || [])]
                            newItems[idx].textContent = e.target.value
                            updateProjectPageField(pp.id, 'items', newItems)
                          }}
                          className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label htmlFor={`pp-item-${item.id}-image`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('common.imageUrl')}</label>
                        <div className="flex gap-2">
                          <Input
                            id={`pp-item-${item.id}-image`}
                            value={item.imageUrl || ''}
                            onChange={(e) => {
                              const newItems = [...(pp.items || [])]
                              newItems[idx].imageUrl = e.target.value
                              updateProjectPageField(pp.id, 'items', newItems)
                            }}
                            className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          />
                          <FileButton
                            accept="image/*"
                            onFiles={async (files) => {
                              const file = files?.[0]
                              if (!file) return
                              try {
                                const result = await uploadToCloudinary(file)
                                const newItems = [...(pp.items || [])]
                                newItems[idx].imageUrl = result.url
                                updateProjectPageField(pp.id, 'items', newItems)
                              } catch (err) {
                                console.error(err)
                              }
                            }}
                            className="h-[44px] min-h-[44px] px-3"
                          >
                            {t('common.upload')}
                          </FileButton>
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`pp-item-${item.id}-link`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('project.externalLink')}</label>
                        <Input
                          id={`pp-item-${item.id}-link`}
                          value={item.externalUrl || ''}
                          onChange={(e) => {
                            const newItems = [...(pp.items || [])]
                            newItems[idx].externalUrl = e.target.value
                            updateProjectPageField(pp.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          placeholder={t('placeholder.url')}
                        />
                      </div>
                    </div>
                  </ItemCard>
                ))}
                
                {(pp.items || []).length === 0 && (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">{t('empty.projectPageItems')}</p>
                  </div>
                )}
                
                <AddActionCard 
                  onClick={() => {
                    const newItems = [...(pp.items || []), {
                      id: Math.random().toString(36).substr(2, 9),
                      title: 'New Item',
                      type: 'external_link',
                    }]
                    updateProjectPageField(pp.id, 'items', newItems)
                  }}
                  label={t('actions.addProjectItem')}
                  icon={Palette}
                />
              </div>
            </div>
          </FormCard>
          )}
        </div>
      )
    }

    if (!selectedSection || !selectedSectionType) {
      return <ThemeSettings profile={profile} updateProfile={updateProfile} />
    }

    const c = selectedSection.content || {}
    const loc = profile.localized || {}
    // Item 8: when the portfolio is bilingual, every profile text field gets a
    // second input for the other language, stored in the SAME `localized`
    // structure the renderer already reads ({ar,en}); empty values fall back.
    const langMode = getPortfolioLang(profile.appearance)
    const showEn = langMode === 'en' || langMode === 'both'
    const showAr = langMode === 'ar' || langMode === 'both'

    switch (selectedSectionType) {
      case 'hero':
        return (
          <div className="space-y-6">
            <FormCard title={t('form.profilePhoto')} subtitle={t('form.subtitleProfilePhoto')}>
              <div className="flex gap-2">
                <Input
                  value={profile.avatarUrl || ''}
                  onChange={e => updateProfile((p: any) => ({ ...p, avatarUrl: e.target.value }))}
                  placeholder={t('placeholder.imageUrl')}
                  className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                />
                <FileButton
                  accept="image/*"
                  disabled={uploadingAvatar}
                  onFiles={async (files) => {
                    const file = files?.[0]
                    if (!file) return
                    setUploadingAvatar(true)
                    try {
                      const result = await uploadToCloudinary(file)
                      updateProfile((p: any) => ({ ...p, avatarUrl: result.url }))
                    } catch (err) {
                      console.error(err)
                    } finally {
                      setUploadingAvatar(false)
                    }
                  }}
                  className="h-[44px] min-h-[44px] px-4"
                >
                  {uploadingAvatar ? t('common.uploading') : t('common.upload')}
                </FileButton>
                {profile.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => updateProfile((p: any) => ({ ...p, avatarUrl: '' }))}
                    className="h-[44px] min-h-[44px] px-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-300 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    title={t('misc.removeProfileImage')}
                  >
                    <span>✕ {t('common.remove')}</span>
                  </button>
                )}
              </div>
              {profile.avatarUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={profile.avatarUrl} alt={t('misc.avatarPreview')} className="w-16 h-16 rounded-full object-cover border border-[var(--color-border)] shadow-sm" />
                </div>
              )}
            </FormCard>

            <FormCard title={t('form.backgroundImage')} subtitle={t('form.subtitleBackgroundImage')}>
              <div className="space-y-4">
                <div>
                  <label htmlFor={`bg-image-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.backgroundImageUrl')}</label>
                  <div className="flex gap-2">
                    <Input
                      id={`bg-image-${selectedSection.id}`}
                      value={c.backgroundImage || ''}
                      onChange={(e) => updateSectionContentRaw(selectedSection.id, 'backgroundImage', e.target.value)}
                      placeholder={t('placeholder.url')}
                      className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    />
                    <FileButton
                      accept="image/*"
                      onFiles={async (files) => {
                        const file = files?.[0]
                        if (!file) return
                        try {
                          const result = await uploadToCloudinary(file)
                          updateSectionContentRaw(selectedSection.id, 'backgroundImage', result.url)
                        } catch (err) {
                          console.error(err)
                        }
                      }}
                      className="h-[44px] min-h-[44px] px-4"
                    >
                      {t('common.upload')}
                    </FileButton>
                    {c.backgroundImage && (
                      <button
                        type="button"
                        onClick={() => updateSectionContentRaw(selectedSection.id, 'backgroundImage', '')}
                        className="h-[44px] min-h-[44px] px-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-300 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        title={t('misc.removeBackground')}
                      >
                        <span>✕ {t('common.remove')}</span>
                      </button>
                    )}
                  </div>
                  {c.backgroundImage && (
                    <div className="mt-2">
                      <img src={c.backgroundImage} alt={t('misc.backgroundPreview')} className="w-full h-28 rounded-lg object-cover border border-[var(--color-border)] shadow-sm" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor={`overlay-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)]">{t('field.overlayOpacity')}</label>
                    <span className="text-xs font-mono font-medium text-[var(--color-text-muted)]">
                      {Math.round((c.overlayOpacity !== undefined ? Number(c.overlayOpacity) : 0.5) * 100)}%
                    </span>
                  </div>
                  <input
                    id={`overlay-${selectedSection.id}`}
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={c.overlayOpacity !== undefined ? c.overlayOpacity : 0.5}
                    onChange={(e) => updateSectionContentRaw(selectedSection.id, 'overlayOpacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-surface-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                    {t('misc.overlayHint')}
                  </p>
                </div>
              </div>
            </FormCard>

            <FormCard title={t('form.heroContent')} subtitle={t('form.subtitleHeroContent')}>
              <div className="space-y-4">
                <div className="space-y-3">
                  {showEn && (
                    <div>
                      <label htmlFor={`hero-display-name-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{showAr ? `${t('field.displayName')} (English)` : t('field.displayName')}</label>
                      <Input
                        id={`hero-display-name-${selectedSection.id}`}
                        value={loc.displayName?.en || profile.displayName || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          updateProfile((p: any) => ({
                            ...p,
                            displayName: val,
                            localized: {
                              ...(p.localized || {}),
                              displayName: { ...(p.localized?.displayName || {}), en: val }
                            }
                          }))
                        }}
                        className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                        placeholder={t('placeholder.nameEn')}
                      />
                    </div>
                  )}
                  {showAr && (
                    <div dir="rtl">
                      <label htmlFor={`hero-display-name-ar-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{showEn ? `${t('field.displayName')} (عربي)` : t('field.displayName')}</label>
                      <Input
                        id={`hero-display-name-ar-${selectedSection.id}`}
                        value={loc.displayName?.ar || profile.displayName || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          updateProfile((p: any) => ({
                            ...p,
                            localized: {
                              ...(p.localized || {}),
                              displayName: { ...(p.localized?.displayName || {}), ar: val }
                            }
                          }))
                        }}
                        className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] text-right"
                        placeholder="مثال: أحمد علي"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {showEn && (
                    <div>
                      <label htmlFor={`hero-job-title-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{showAr ? `${t('field.jobTitle')} (English)` : t('field.jobTitle')}</label>
                      <Input
                        id={`hero-job-title-${selectedSection.id}`}
                        value={loc.professionalTitle?.en || c.subtitle?.en || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          updateProfile((p: any) => ({
                            ...p,
                            localized: {
                              ...(p.localized || {}),
                              professionalTitle: { ...(p.localized?.professionalTitle || {}), en: val }
                            }
                          }))
                          updateSectionContent(selectedSection.id, 'subtitle', 'en', val)
                        }}
                        className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                        placeholder={t('placeholder.jobTitleEn')}
                      />
                    </div>
                  )}
                  {showAr && (
                    <div dir="rtl">
                      <label htmlFor={`hero-job-title-ar-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{showEn ? `${t('field.jobTitle')} (عربي)` : t('field.jobTitle')}</label>
                      <Input
                        id={`hero-job-title-ar-${selectedSection.id}`}
                        value={loc.professionalTitle?.ar || c.subtitle?.ar || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          updateProfile((p: any) => ({
                            ...p,
                            localized: {
                              ...(p.localized || {}),
                              professionalTitle: { ...(p.localized?.professionalTitle || {}), ar: val }
                            }
                          }))
                          updateSectionContent(selectedSection.id, 'subtitle', 'ar', val)
                        }}
                        className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] text-right"
                        placeholder="مثال: مطوّر ويب"
                      />
                    </div>
                  )}
                </div>
              </div>
            </FormCard>
          </div>
        )

      case 'about':
        const aboutStats = c.stats || []
        return (
          <div className="space-y-6">
            <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleAbout')}>
              <div className="space-y-4">
                <div role="group" aria-labelledby={`about-icon-label-${selectedSection.id}`}>
                  <label id={`about-icon-label-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.icon')}</label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>
                
                <div>
                  <label htmlFor={`about-heading-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.heading')}</label>
                  <Input
                    id={`about-heading-${selectedSection.id}`}
                    value={c.title?.en || 'About Me'}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'title', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                  />
                </div>

                <div>
                  <label htmlFor={`about-bio-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.detailedBiography')}</label>
                  <textarea
                    id={`about-bio-${selectedSection.id}`}
                    value={c.biography?.en !== undefined ? c.biography.en : (c.text?.en || '')}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'biography', 'en', e.target.value)}
                    className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
                    placeholder={t('placeholder.biography')}
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title={t('form.statCards')} subtitle={t('form.subtitleStatCards')}>
              <div className="space-y-4">
                {aboutStats.map((stat: any, idx: number) => (
                  <ItemCard
                    key={idx}
                    onRemove={() => removeSectionArrayItem(selectedSection.id, 'stats', aboutStats, idx)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-[var(--color-text-muted)] font-medium w-10 shrink-0">{t('field.icon')}</span>
                      <div className="flex-1">
                        <IconPicker
                          value={stat.icon}
                          onChange={(val) => {
                            const newStats = [...aboutStats]
                            newStats[idx] = { ...newStats[idx], icon: val }
                            updateSectionContentRaw(selectedSection.id, 'stats', newStats)
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label htmlFor={`stat-${selectedSection.id}-${idx}-value`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.value')}</label>
                        <Input
                          id={`stat-${selectedSection.id}-${idx}-value`}
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...aboutStats]
                            newStats[idx] = { ...newStats[idx], value: e.target.value }
                            updateSectionContentRaw(selectedSection.id, 'stats', newStats)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          placeholder={t('placeholder.statValue')}
                        />
                      </div>
                      <div>
                        <label htmlFor={`stat-${selectedSection.id}-${idx}-label`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.label')}</label>
                        <Input
                          id={`stat-${selectedSection.id}-${idx}-label`}
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...aboutStats]
                            newStats[idx] = { ...newStats[idx], label: e.target.value }
                            updateSectionContentRaw(selectedSection.id, 'stats', newStats)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          placeholder={t('placeholder.statLabel')}
                        />
                      </div>
                    </div>
                  </ItemCard>
                ))}
                {aboutStats.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">{t('empty.stats')}</p>
                  </div>
                )}
                <AddActionCard 
                  onClick={() => {
                    const newStats = [...aboutStats, { icon: 'trophy', value: '0', label: 'New Stat' }]
                    updateSectionContentRaw(selectedSection.id, 'stats', newStats)
                  }}
                  label={t('actions.addStat')}
                />
              </div>
            </FormCard>
          </div>
        )
case 'skills':
        const skillGroups = c.groups || []
        const fallbackSkills = c.skills || []
        return (
          <div className="space-y-6">
            <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleSkills')}>
              <div className="space-y-4">
                <div role="group" aria-labelledby={`skills-icon-label-${selectedSection.id}`}>
                  <label id={`skills-icon-label-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.icon')}</label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>
                <div>
                  <label htmlFor={`skills-heading-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.heading')}</label>
                  <Input
                    id={`skills-heading-${selectedSection.id}`}
                    value={c.heading?.en || 'Skills & Expertise'}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'heading', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title={t('form.skillGroups')} subtitle={t('form.subtitleSkillGroups')}>
              <div className="space-y-4">
                {skillGroups.length > 0 ? skillGroups.map((group: any, gIdx: number) => (
                  <ItemCard
                    key={gIdx}
                    onRemove={() => removeSectionArrayItem(selectedSection.id, 'groups', skillGroups, gIdx)}
                  >
                    <div>
                      <label htmlFor={`skill-group-${selectedSection.id}-${gIdx}-name`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.groupName')}</label>
                      <Input
                        id={`skill-group-${selectedSection.id}-${gIdx}-name`}
                        value={group.name}
                        onChange={(e) => {
                          const newGroups = [...skillGroups]
                          newGroups[gIdx] = { ...group, name: e.target.value }
                          updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                        }}
                        className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] font-semibold"
                        placeholder={t('placeholder.skills')}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2 mt-4">
                        <label id={`skill-group-${selectedSection.id}-${gIdx}-skills-label`} className="text-xs font-semibold text-[var(--color-text-primary)]">{t('field.skillsInGroup')}</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newGroups = [...skillGroups]
                            newGroups[gIdx].skills = [...(group.skills || []), { name: 'New Skill', percentage: 80 }]
                            updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                          }}
                          className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                        >
                          + {t('actions.addSkill')}
                        </button>
                      </div>
                      <div className="space-y-3" role="group" aria-labelledby={`skill-group-${selectedSection.id}-${gIdx}-skills-label`}>
                        {(group.skills || []).map((skill: any, sIdx: number) => (
                          <div key={sIdx} className="flex items-center gap-2">
                            <Input
                              value={skill.name}
                              onChange={(e) => {
                                const newGroups = [...skillGroups]
                                newGroups[gIdx].skills[sIdx].name = e.target.value
                                updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                              }}
                              placeholder={t('placeholder.skillName')}
                              className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                            />
                            <div className="relative w-24 shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={skill.percentage}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10)
                                  const newGroups = [...skillGroups]
                                  newGroups[gIdx].skills[sIdx].percentage = isNaN(val) ? 0 : val
                                  updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                                }}
                                className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-[12px] py-[10px] min-h-[44px] h-[44px] text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] pe-7"
                              />
                              <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] pointer-events-none">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newGroups = [...skillGroups]
                                newGroups[gIdx].skills.splice(sIdx, 1)
                                updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                              }}
                              className="p-2 text-[var(--color-text-muted)] hover:text-red-500 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {(!group.skills || group.skills.length === 0) && (
                          <div className="text-center py-3 bg-[var(--color-surface-secondary)] rounded-lg text-xs text-[var(--color-text-muted)]">{t('empty.skillsInGroup')}</div>
                        )}
                      </div>
                    </div>
                  </ItemCard>
                )) : fallbackSkills.length > 0 ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-sm text-amber-800 dark:text-amber-500">
                    {t('misc.legacySkills')}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">{t('empty.skillGroups')}</p>
                  </div>
                )}
                
                <AddActionCard 
                  onClick={() => {
                    const newGroups = [...skillGroups, { name: 'New Group', skills: [] }]
                    updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                  }}
                  label={t('actions.addSkillGroup')}
                  icon={Layers}
                />
              </div>
            </FormCard>
          </div>
        )
      case 'experience':
        const experienceItems = c.items || []
        const expDisplayMode = c.displayMode || 'timeline'
        // Bilingual setter for item sub-fields: keeps the `{en,ar}` shape and
        // upgrades legacy flat strings on first edit (item 8).
        const setExpField = (i: number, field: string, l: 'ar' | 'en', val: string) => {
          const newItems = [...experienceItems]
          const cur = newItems[i][field]
          const obj = (cur && typeof cur === 'object') ? cur : { en: typeof cur === 'string' ? cur : '' }
          newItems[i] = { ...newItems[i], [field]: { ...obj, [l]: val } }
          updateSectionContentRaw(selectedSection.id, 'items', newItems)
        }
        return (
          <div className="space-y-6">
            <FormCard title={t('form.sectionSettings')} subtitle={t('form.subtitleSectionSettings')}>
              <div className="space-y-4">
                <div>
                  <label id={`exp-display-mode-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    {t('field.displayMode')}
                  </label>
                  <div role="group" aria-labelledby={`exp-display-mode-${selectedSection.id}`} className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
                    {['timeline', 'grid', 'list'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => updateSectionContentRaw(selectedSection.id, 'displayMode', mode)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                          expDisplayMode === mode
                            ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {t(`display.${mode}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div role="group" aria-labelledby={`exp-section-icon-label-${selectedSection.id}`}>
                  <label id={`exp-section-icon-label-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    {t('field.sectionIcon')}
                  </label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleExperience')}>
              <div className="space-y-4">
                <div>
                  <label htmlFor={`exp-heading-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.heading')}</label>
                  <Input
                    id={`exp-heading-${selectedSection.id}`}
                    value={c.heading?.en || 'Work Experience'}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'heading', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                  />
                </div>

                <div>
                  <label htmlFor={`exp-desc-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.descriptionOptional')}</label>
                  <textarea
                    id={`exp-desc-${selectedSection.id}`}
                    value={c.description?.en || ''}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'description', 'en', e.target.value)}
                    className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title={t('form.experienceItems')} subtitle={t('form.subtitleExperienceItems')}>
              <div className="space-y-4">
                {experienceItems.map((item: any, idx: number) => (
                  <ItemCard
                    key={item.id}
                    title={pickLang(item.jobTitle, 'en') || 'New Role'}
                    subtitle={pickLang(item.companyName, 'en') || 'Company'}
                    onRemove={() => removeSectionArrayItem(selectedSection.id, 'items', experienceItems, idx)}
                  >
                      <div className="flex flex-col gap-4 mt-3">
                        <BiField
                          idBase={`exp-${item.id}-job`}
                          label={t('field.jobTitle')}
                          value={item.jobTitle}
                          showEn={showEn}
                          showAr={showAr}
                          onChange={(l, v) => setExpField(idx, 'jobTitle', l, v)}
                        />
                        <BiField
                          idBase={`exp-${item.id}-company`}
                          label={t('field.companyName')}
                          value={item.companyName}
                          showEn={showEn}
                          showAr={showAr}
                          onChange={(l, v) => setExpField(idx, 'companyName', l, v)}
                        />
                      <div>
                        <label htmlFor={`exp-${item.id}-logo`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.companyLogoUrl')}</label>
                        <div className="flex gap-2">
                          <Input
                            id={`exp-${item.id}-logo`}
                            value={item.companyLogo || ''}
                            onChange={(e) => {
                              const newItems = [...experienceItems]
                              newItems[idx].companyLogo = e.target.value
                              updateSectionContentRaw(selectedSection.id, 'items', newItems)
                            }}
                            className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                            placeholder={t('placeholder.url')}
                          />
                          <FileButton
                            accept="image/*"
                            onFiles={async (files) => {
                              const file = files?.[0]
                              if (!file) return
                              try {
                                const result = await uploadToCloudinary(file)
                                const newItems = [...experienceItems]
                                newItems[idx].companyLogo = result.url
                                updateSectionContentRaw(selectedSection.id, 'items', newItems)
                              } catch (err) {
                                console.error(err)
                              }
                            }}
                            className="h-[44px] min-h-[44px] px-3"
                          >
                            {t('common.upload')}
                          </FileButton>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor={`exp-${item.id}-start`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.startDate')}</label>
                        <input
                          id={`exp-${item.id}-start`}
                          type="month"
                          value={item.startDate || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].startDate = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label htmlFor={`exp-${item.id}-end`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.endDate')}</label>
                        <input
                          id={`exp-${item.id}-end`}
                          type="month"
                          value={item.endDate || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].endDate = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] disabled:opacity-50"
                          disabled={item.isCurrent}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={item.isCurrent || false}
                            onChange={(e) => {
                              const newItems = [...experienceItems]
                              newItems[idx].isCurrent = e.target.checked
                              if (e.target.checked) newItems[idx].endDate = ''
                              updateSectionContentRaw(selectedSection.id, 'items', newItems)
                            }}
                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] bg-[var(--color-surface)]"
                            id={`current-${item.id}`}
                          />
                          <label htmlFor={`current-${item.id}`} className="text-xs font-medium text-[var(--color-text-secondary)] cursor-pointer">
                            {t('misc.currentlyWorking')}
                          </label>
                        </div>
                      </div>

                      <BiField
                        idBase={`exp-${item.id}-location`}
                        label={t('field.location')}
                        value={item.location}
                        showEn={showEn}
                        showAr={showAr}
                        onChange={(l, v) => setExpField(idx, 'location', l, v)}
                        placeholderEn={t('placeholder.locationEn')}
                        placeholderAr={t('placeholder.locationAr')}
                      />
                      <div>
                        <label htmlFor={`exp-${item.id}-mode`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.workMode')}</label>
                        <Select
                          id={`exp-${item.id}-mode`}
                          value={item.workMode || ''}
                          onChange={(value) => {
                            const newItems = [...experienceItems]
                            newItems[idx].workMode = value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          placeholder={t('common.select')}
                          options={[
                            { value: 'Remote', label: t('display.remote') },
                            { value: 'Hybrid', label: t('display.hybrid') },
                            { value: 'On-site', label: t('display.onsite') },
                          ]}
                        />
                      </div>

                      <div>
                        <label htmlFor={`exp-${item.id}-desc`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.descriptionBullets')}</label>
                        <textarea
                          id={`exp-${item.id}-desc`}
                          value={item.description || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].description = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]"
                          placeholder={t('placeholder.experienceBullets')}
                        />
                      </div>
                    </div>
                  </ItemCard>
                ))}
                
                {experienceItems.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">{t('empty.experience')}</p>
                  </div>
                )}
                
                <AddActionCard 
                  onClick={() => {
                    const newItems = [...experienceItems, { 
                      id: Math.random().toString(36).substr(2, 9), 
                      jobTitle: 'New Role', 
                      companyName: '', 
                      isCurrent: false 
                    }]
                    updateSectionContentRaw(selectedSection.id, 'items', newItems)
                  }}
                  label={t('actions.addExperience')}
                  icon={Briefcase}
                />
              </div>
            </FormCard>
          </div>
        )
      case 'services':
        const services = c.services || []
        const setServiceField = (i: number, field: string, l: 'ar' | 'en', val: string) => {
          const newServices = [...services]
          const cur = newServices[i][field]
          const obj = (cur && typeof cur === 'object') ? cur : { en: typeof cur === 'string' ? cur : '' }
          newServices[i] = { ...newServices[i], [field]: { ...obj, [l]: val } }
          updateSectionContentRaw(selectedSection.id, 'services', newServices)
        }
        return (
          <div className="space-y-6">
            <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleServices')}>
              <div className="space-y-4">
                <div role="group" aria-labelledby={`services-icon-label-${selectedSection.id}`}>
                  <label id={`services-icon-label-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    {t('field.sectionIcon')}
                  </label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>

                <div>
                  <label htmlFor={`services-heading-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    {t('field.sectionHeading')}
                  </label>
                  <Input
                    id={`services-heading-${selectedSection.id}`}
                    value={c.title?.en || 'Services'}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'title', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                  />
                </div>

                <div>
                  <label htmlFor={`services-desc-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    {t('field.sectionDescription')}
                  </label>
                  <textarea
                    id={`services-desc-${selectedSection.id}`}
                    value={c.description?.en || ''}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'description', 'en', e.target.value)}
                    className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    placeholder={t('placeholder.serviceDescription')}
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title={t('form.servicesList')} subtitle={t('form.subtitleServicesList')}>
              <div className="space-y-4">
                {services.map((service: any, idx: number) => (
                  <ItemCard
                    key={idx}
                    title={pickLang(service.title, 'en') || 'New Service'}
                    onRemove={() => removeSectionArrayItem(selectedSection.id, 'services', services, idx)}
                  >
                    <div className="flex flex-col gap-4 mt-2">
                      <div role="group" aria-labelledby={`service-${idx}-icon-label`}>
                        <label id={`service-${idx}-icon-label`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.serviceIcon')}</label>
                        <IconPicker
                          value={service.icon}
                          onChange={(val) => {
                            const newServices = [...services]
                            newServices[idx] = { ...newServices[idx], icon: val }
                            updateSectionContentRaw(selectedSection.id, 'services', newServices)
                          }}
                        />
                      </div>
                      <BiField
                        idBase={`service-${idx}-title`}
                        label={t('field.serviceTitle')}
                        value={service.title}
                        showEn={showEn}
                        showAr={showAr}
                        onChange={(l, v) => setServiceField(idx, 'title', l, v)}
                        placeholderEn={t('placeholder.serviceTitleEn')}
                        placeholderAr={t('placeholder.serviceTitleAr')}
                      />
                      <BiField
                        idBase={`service-${idx}-desc`}
                        label={t('field.serviceDescription')}
                        value={service.description}
                        showEn={showEn}
                        showAr={showAr}
                        multiline
                        onChange={(l, v) => setServiceField(idx, 'description', l, v)}
                        placeholderEn={t('placeholder.serviceDescEn')}
                        placeholderAr={t('placeholder.serviceDescAr')}
                      />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label id={`service-${idx}-features-label`} className="text-xs font-semibold text-[var(--color-text-primary)]">{t('field.features')}</label>
                          <button
                            type="button"
                            onClick={() => {
                              const newServices = [...services]
                              const features = [...(newServices[idx].features || []), '']
                              newServices[idx] = { ...newServices[idx], features }
                              updateSectionContentRaw(selectedSection.id, 'services', newServices)
                            }}
                            className="text-xs text-[var(--color-primary)] hover:underline cursor-pointer font-medium"
                          >
                            + {t('actions.addFeature')}
                          </button>
                        </div>
                      <div className="space-y-3" role="group" aria-labelledby={`service-${idx}-features-label`}>
                          {(service.features || []).map((feature: string, fi: number) => (
                            <div key={fi} className="flex items-center gap-2">
                              <Input
                                value={feature}
                                onChange={(e) => {
                                  const newServices = [...services]
                                  const features = [...(newServices[idx].features || [])]
                                  features[fi] = e.target.value
                                  newServices[idx] = { ...newServices[idx], features }
                                  updateSectionContentRaw(selectedSection.id, 'services', newServices)
                                }}
                                placeholder={t('placeholder.featureText')}
                                className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                              />
                              <button
                                type="button"
                                aria-label={t('common.removeFeature')}
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: t('confirm.removeFeatureTitle'),
                                    message: t('confirm.removeFeatureMessage'),
                                    confirmLabel: t('confirm.confirm'),
                                    cancelLabel: t('confirm.cancel'),
                                    destructive: true,
                                  })
                                  if (!ok) return
                                  const newServices = [...services]
                                  const features = (newServices[idx].features || []).filter((_: any, i: number) => i !== fi)
                                  newServices[idx] = { ...newServices[idx], features }
                                  updateSectionContentRaw(selectedSection.id, 'services', newServices)
                                }}
                                className="p-2 text-[var(--color-danger)] hover:opacity-80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-md"
                                title={t('common.removeFeature')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ItemCard>
                ))}
                
                {services.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-secondary)]">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">{t('empty.services')}</p>
                  </div>
                )}
                
                <AddActionCard 
                  onClick={() => {
                    const newServices = [...services, { icon: 'code', title: 'New Service', description: '', features: [] }]
                    updateSectionContentRaw(selectedSection.id, 'services', newServices)
                  }}
                  label={t('actions.addService')}
                  icon={Briefcase}
                />
              </div>
            </FormCard>
          </div>
        )

      case 'projects':
        const displayMode = c.displayMode || 'grid'
        return (
          <div className="space-y-6">
            <FormCard title={t('form.sectionSettings')} subtitle={t('form.subtitleSectionSettings')}>
              <div className="space-y-4">
                <div>
                  <label id={`projects-display-mode-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    {t('field.displayMode')}
                  </label>
                  <div role="group" aria-labelledby={`projects-display-mode-${selectedSection.id}`} className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
                    <button
                      type="button"
                      onClick={() => updateSectionContentRaw(selectedSection.id, 'displayMode', 'grid')}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                        displayMode === 'grid'
                          ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSectionContentRaw(selectedSection.id, 'displayMode', 'list')}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                        displayMode === 'list'
                          ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>

                <div role="group" aria-labelledby={`projects-icon-label-${selectedSection.id}`}>
                  <label id={`projects-icon-label-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    {t('field.sectionIcon')}
                  </label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title={t('form.sectionContent')} subtitle={t('form.subtitleProjects')}>
              <div>
                <label htmlFor={`projects-heading-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.sectionHeading')}</label>
                <Input
                  id={`projects-heading-${selectedSection.id}`}
                  value={c.title?.en || 'Featured Projects'}
                  onChange={(e) => updateSectionContent(selectedSection.id, 'title', 'en', e.target.value)}
                  className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                />
              </div>
            </FormCard>

            <FormCard title={t('form.projectCards')} subtitle={t('form.subtitleProjectCards')}>
              <ProjectManager profile={profile} updateProfile={updateProfile} isCardMode={true} allProjectPages={projectPages} isFree={isFreePlan} />
            </FormCard>
          </div>
        )

      case 'footer':
        const footerLinks = profile.contactLinks || c.links || []
        return (
          <div className="space-y-6">
            <FormCard title={t('form.footerContent')} subtitle={t('form.subtitleFooterContent')}>
              <div className="space-y-4">
                <div>
                  <label htmlFor={`footer-headline-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.headline')}</label>
                  <Input
                    id={`footer-headline-${selectedSection.id}`}
                    value={c.headline?.en ?? (typeof c.headline === 'string' ? c.headline : 'Work with me')}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'headline', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    placeholder={t('placeholder.footerHeadline')}
                  />
                </div>

                <div>
                  <label htmlFor={`footer-subheading-${selectedSection.id}`} className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">{t('field.subheadingOptional')}</label>
                  <Input
                    id={`footer-subheading-${selectedSection.id}`}
                    value={c.subheading?.en ?? (typeof c.subheading === 'string' ? c.subheading : '')}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'subheading', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    placeholder={t('placeholder.footerSubheading')}
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title={t('form.socialLinks')} subtitle={t('form.subtitleSocialLinks')}>
              <div className="space-y-3">
                {footerLinks.map((link: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                    <Select
                      value={link.label || link.platform || 'LinkedIn'}
                      onChange={(value) => {
                        const newLinks = [...footerLinks]
                        newLinks[idx] = { ...newLinks[idx], label: value, platform: value }
                        updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
                        updateSectionContentRaw(selectedSection.id, 'links', newLinks)
                      }}
                      className="w-32"
                      options={[
                        { value: 'LinkedIn', label: t('social.linkedin') },
                        { value: 'GitHub', label: t('social.github') },
                        { value: 'Twitter', label: t('social.twitter') },
                        { value: 'Instagram', label: t('social.instagram') },
                        { value: 'Facebook', label: t('social.facebook') },
                        { value: 'Email', label: t('social.email') },
                        { value: 'WhatsApp', label: t('social.whatsapp') },
                        { value: 'YouTube', label: t('social.youtube') },
                        { value: 'TikTok', label: t('social.tiktok') },
                        { value: 'Website', label: t('social.website') },
                      ]}
                    />
                    <Input
                      value={link.url || ''}
                      onChange={(e) => {
                        const newLinks = [...footerLinks]
                        newLinks[idx] = { ...newLinks[idx], url: e.target.value }
                        updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
                        updateSectionContentRaw(selectedSection.id, 'links', newLinks)
                      }}
                      placeholder={t('placeholder.emailOrUrl')}
                      className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    />
                    <button
                      aria-label={t('common.removeLink')}
                      onClick={async () => {
                        const ok = await confirm({
                          title: t('confirm.removeLinkTitle'),
                          message: t('confirm.removeLinkMessage'),
                          confirmLabel: t('confirm.confirm'),
                          cancelLabel: t('confirm.cancel'),
                          destructive: true,
                        })
                        if (!ok) return
                        const newLinks = footerLinks.filter((_: any, i: number) => i !== idx)
                        updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
                        updateSectionContentRaw(selectedSection.id, 'links', newLinks)
                      }}
                      className="p-2 text-[var(--color-danger)] hover:opacity-80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-md"
                      title={t('common.removeLink')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {footerLinks.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] text-center py-4 border border-dashed rounded-lg border-[var(--color-border)]">
                    {t('empty.links')}
                  </p>
                )}
                <AddActionCard
                  onClick={() => {
                    const newLinks = [...footerLinks, { label: 'LinkedIn', url: '' }]
                    updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
                    updateSectionContentRaw(selectedSection.id, 'links', newLinks)
                  }}
                  label={t('actions.addSocialLink')}
                />
              </div>
            </FormCard>
          </div>
        )

      case 'testimonials':
        return (
          <TestimonialsEditor
            sectionId={selectedSection.id}
            content={c}
            updateSectionContent={updateSectionContent}
            updateSectionContentRaw={updateSectionContentRaw}
            FormCard={FormCard}
            ItemCard={ItemCard}
            AddActionCard={AddActionCard}
            IconPicker={IconPicker}
          />
        )

      case 'gallery':
        return (
          <GalleryEditor
            sectionId={selectedSection.id}
            content={c}
            updateSectionContent={updateSectionContent}
            updateSectionContentRaw={updateSectionContentRaw}
            FormCard={FormCard}
            ItemCard={ItemCard}
            AddActionCard={AddActionCard}
            IconPicker={IconPicker}
          />
        )

      case 'files':
        return (
          <FilesEditor
            sectionId={selectedSection.id}
            content={c}
            updateSectionContent={updateSectionContent}
            updateSectionContentRaw={updateSectionContentRaw}
            FormCard={FormCard}
            ItemCard={ItemCard}
            AddActionCard={AddActionCard}
            IconPicker={IconPicker}
          />
        )

      case 'contact':
        return (
          <ContactEditor
            sectionId={selectedSection.id}
            content={c}
            updateSectionContent={updateSectionContent}
            updateSectionContentRaw={updateSectionContentRaw}
            FormCard={FormCard}
            ItemCard={ItemCard}
            AddActionCard={AddActionCard}
            IconPicker={IconPicker}
          />
        )

      case 'custom':
        return (
          <CustomEditor
            sectionId={selectedSection.id}
            content={c}
            updateSectionContent={updateSectionContent}
            updateSectionContentRaw={updateSectionContentRaw}
            FormCard={FormCard}
            ItemCard={ItemCard}
            AddActionCard={AddActionCard}
            IconPicker={IconPicker}
          />
        )

      default:
        return (
          <div className="text-xs text-[var(--color-text-muted)]">
            Select a section from the left panel to configure its specific fields.
          </div>
        )
    }
  }

  const publishBusy = publishState === 'publishing' || publishState === 'unpublishing'
  const publishDone = publishState === 'published' || publishState === 'unpublished'
  const publishLabel = publishBusy
    ? publishState === 'unpublishing'
      ? L.unpublishing
      : L.publishing
    : publishDone
      ? publishState === 'unpublished'
        ? L.unpublished
        : L.published
      : profile.status === 'PUBLISHED'
        ? L.unpublish
        : L.publish

  // Canvas preview mode. On a real phone (<768px) the device switcher is
  // hidden, so we always show the mobile frame — otherwise the "desktop" mode
  // would render a 1080px scaled frame (desktop layout) on a phone screen.
  const effectivePreviewMode: 'desktop' | 'mobile' = isMobileViewport ? 'mobile' : previewMode

  return (
    <div lang={locale} dir={dir} className={`builder-root flex h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden overflow-x-hidden bg-[var(--color-page)] select-none ${builderDarkMode ? 'dark' : ''}`} data-theme={builderDarkMode ? 'dark' : 'light'}>
      {/* FREE plan upgrade banner — sticky at the very top for free users */}
      {isFreePlan && (
        <div
          className="flex shrink-0 items-center justify-center gap-2 px-3 py-2 text-center text-xs font-bold sticky top-0 z-40"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--on-primary)' }}
          role="note"
          aria-label={t('banner.upgradeAria')}
        >
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{t('banner.freePlanNotice')}</span>
          <a
            href={upgradeHref}
            target={hasWhatsapp ? '_blank' : undefined}
            rel={hasWhatsapp ? 'noreferrer' : undefined}
            className="shrink-0 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[11px] font-bold text-[var(--color-text-primary)] hover:opacity-90 transition-opacity min-h-[32px] inline-flex items-center"
          >
            {t('banner.upgradeNow')}
          </a>
        </div>
      )}
      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 space-y-3">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                {t('conflict.title')}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('conflict.message')}
              </p>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" className="flex-1" onClick={handleConflictReload}>
                  {t('conflict.reload')}
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleConflictOverwrite}>
                  {t('conflict.overwrite')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR (Height: 52px, border-b, bg white / dark card)
      ────────────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-4 z-30 max-w-[100vw]">
        {/* Left: mobile nav toggle + brand title */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <button
            onClick={() => setLeftDrawerOpen(true)}
            className="md:hidden flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label={t('topbar.openNavigation')}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="truncate text-xs sm:text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
            {L.builderTitle}
          </h1>
        </div>

        {/* Center (md+): undo/redo + save status */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
            <button
              type="button"
              title={t('topbar.undo')}
              className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title={t('topbar.redo')}
              className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-[11px] font-medium">{L.saveSaving}</span>
              </span>
            ) : isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[11px] font-medium">{L.unsaved}</span>
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">{L.saved}</span>
              </span>
            ) : saveStatus === 'error' ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-danger)]">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">{L.saveFailed}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: device switcher + account + actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="hidden md:flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5" aria-label={t('topbar.previewMode')}>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-md transition-colors cursor-pointer ${
                previewMode === 'desktop'
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              title={t('topbar.desktopView')}
              aria-label={t('topbar.desktopPreview')}
              aria-pressed={previewMode === 'desktop'}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-md transition-colors cursor-pointer ${
                previewMode === 'mobile'
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              title={t('topbar.mobileView')}
              aria-label={t('topbar.mobilePreview')}
              aria-pressed={previewMode === 'mobile'}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {liveDisabled ? (
            <span
              title={t('topbar.saveFirst')}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] bg-transparent px-2.5 text-xs font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed select-none"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('topbar.viewLive')}</span>
            </span>
          ) : (
            <a
              href={liveHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] bg-transparent px-2.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('topbar.viewLive')}</span>
            </a>
          )}

          <ProfileMenu
            displayName={profile.displayName || profile.username || 'User'}
            onToggleLocale={toggleLocale}
            dark={builderDarkMode}
            onToggleDark={() => setBuilderDarkMode(!builderDarkMode)}
            onLogout={handleLogout}
          />

          <NotificationBell />

          {/* Publish lives in the header on desktop; the mobile bottom bar
              carries its own Go Live / Save actions, so it is hidden there. */}
          <Button
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex h-[36px] min-h-[36px] px-3 text-xs gap-1.5 font-medium"
            onClick={handlePublish}
            aria-label={profile.status === 'PUBLISHED' ? t('labels.unpublishAria') : t('labels.publishAria')}
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">{profile.status === 'PUBLISHED' ? t('labels.unpublish') : t('labels.publish')}</span>
          </Button>

          <button
            onClick={() => setRightSheetOpen(true)}
            className="md:hidden flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] cursor-pointer"
            aria-label={t('topbar.openSettings')}
          >
            <Sliders className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN 3-PANEL BODY
      ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden overflow-x-hidden relative">
        {/* ─────────────────────────────────────────────────────────────
            2. LEFT PANEL (~200px, pill tabs: Sections / Pages)
            Desktop on md+ (≥768px). Slide-over drawer on mobile.
        ────────────────────────────────────────────────────────────── */}
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[200px] shrink-0 flex-col border-e border-[var(--color-border)] bg-[var(--color-surface-secondary)] overflow-hidden">
          {renderLeftPanelContent()}
        </aside>

        {/* Mobile slide-over drawer */}
        {leftDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setLeftDrawerOpen(false)} />
            <div className="relative w-72 max-w-[80vw] bg-[var(--color-surface-secondary)] shadow-2xl flex flex-col h-full z-10" role="dialog" aria-modal="true" aria-label={t('topbar.sectionsAndPages')}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{L.navigation}</span>
                <button onClick={() => setLeftDrawerOpen(false)} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label={t('topbar.closeNavigation')}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {renderLeftPanelContent()}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. CENTER CANVAS (full width on mobile, framed on md+)
        ────────────────────────────────────────────────────────────── */}
        <main className="flex-1 min-h-0 min-w-0 max-w-[100vw] bg-[var(--color-page)] relative overflow-hidden overflow-x-hidden flex items-center justify-center p-2 md:p-4">
          {isFreePlan && (
            <div className="pointer-events-none absolute inset-x-3 top-2 z-10 flex justify-center">
              <p className="rounded-full bg-amber-500/95 px-3 py-1 text-center text-[11px] font-semibold text-white shadow-md">
                {t('preview.freeNotice')}
              </p>
            </div>
          )}
          <div
            className={`transition-all duration-300 ease-in-out bg-[var(--color-surface)] overflow-hidden flex flex-col max-w-full ${
              effectivePreviewMode === 'mobile'
                ? 'w-full h-full min-h-0 min-w-0 items-center justify-center bg-transparent shadow-none border-0'
                : 'w-full h-full max-w-[1080px] min-w-0 rounded-[12px] shadow-md border border-black/5 dark:border-white/10'
            }`}
          >
            {effectivePreviewMode === 'mobile' ? (
              <div className="w-[375px] max-w-full h-full max-h-full mx-auto overflow-hidden rounded-[2.5rem] border-4 border-gray-800 shadow-2xl bg-white flex flex-col">
                <div className="h-5 w-full bg-gray-800 flex items-center justify-center shrink-0">
                  <div className="h-3 w-20 bg-black/60 rounded-full" />
                </div>
                {/* Inline, container-query-scaled preview: the template's
                    `cq-md:`/`cq-lg:` variants resolve against this 375px box, so
                    it renders the real mobile layout live — no iframe, no
                    save/reload required. */}
                <div className="flex-1 min-h-0">
                  <LivePreview
                    profile={deferredPreviewProfile}
                    isFree={isFreePlan}
                    onThemeChange={handlePreviewThemeChange}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 w-full min-h-0 overflow-hidden relative">
                {activePage !== 'home' && editingProjectPage && !selectedSection ? (
                  <ProjectPagePreview profile={profile} projectPage={editingProjectPage} />
                ) : (
                  <LivePreview
                    profile={deferredPreviewProfile}
                    isFree={isFreePlan}
                    onThemeChange={handlePreviewThemeChange}
                  />
                )}
              </div>
            )}
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────────
            4. RIGHT PANEL (~470px on md+, bottom sheet on mobile)
        ────────────────────────────────────────────────────────────── */}
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[320px] lg:w-[470px] lg:min-w-[470px] min-w-0 shrink-0 flex-col border-s border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          {/* Only mount the desktop panel while the mobile sheet is closed:
              the sheet renders the same form, so mounting both at once would
              duplicate every field id in the document. */}
          {!rightSheetOpen && renderRightPanelWrapper()}
        </aside>

        {/* Mobile bottom sheet */}
        {rightSheetOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            <div className="fixed inset-0 bg-black/50" onClick={() => setRightSheetOpen(false)} />
            <div className="relative w-full max-w-[100vw] max-h-[85dvh] bg-[var(--color-surface)] rounded-t-2xl shadow-2xl flex flex-col z-10 overflow-hidden overflow-x-hidden" role="dialog" aria-modal="true" aria-label={t('topbar.editPanel')}>
              <div className="h-1.5 w-10 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-2 shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                {renderRightPanelWrapper(() => setRightSheetOpen(false))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MOBILE BOTTOM TAB BAR (<md only): Sections / Edit / Preview / Publish
      ────────────────────────────────────────────────────────────── */}
      <nav
        className="md:hidden shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2 z-30"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        aria-label={L.navigation}
      >
        <div className="grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => {
              setRightSheetOpen(false)
              setLeftDrawerOpen(true)
            }}
            className="flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label={L.openSections}
          >
            <Layout className="h-5 w-5 shrink-0" />
            <span>{L.sections}</span>
          </button>
          <button
            type="button"
            onClick={handleMobileSave}
            disabled={mobileSaveState === 'saving'}
            aria-busy={mobileSaveState === 'saving'}
            className={`flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer disabled:cursor-wait ${
              !isDirty && mobileSaveState === 'idle' ? 'opacity-60' : ''
            }`}
            aria-label={L.saveChanges}
          >
            {mobileSaveState === 'saving' ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : mobileSaveState === 'saved' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
            ) : (
              <Save className="h-5 w-5 shrink-0" />
            )}
            <span>
              {mobileSaveState === 'saving'
                ? L.saveSaving
                : mobileSaveState === 'saved'
                  ? L.savedChanges
                  : L.saveChanges}
            </span>
          </button>
          <button
            type="button"
            onClick={handleGoLive}
            className="flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            aria-label={L.goLive}
          >
            <ExternalLink className="h-5 w-5 shrink-0" />
            <span>{L.goLive}</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishBusy}
            aria-busy={publishBusy}
            className={`flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors ${
              publishDone
                ? 'text-[var(--color-success)]'
                : 'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'
            } disabled:opacity-70 disabled:cursor-wait`}
            aria-label={
              publishBusy
                ? publishLabel
                : profile.status === 'PUBLISHED'
                  ? L.unpublishAria
                  : L.publishAria
            }
          >
            {publishBusy ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : publishDone ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <Globe className="h-5 w-5 shrink-0" />
            )}
            <span>{publishLabel}</span>
          </button>
        </div>
      </nav>
    </div>
  )

  // Sub-component rendering Left Panel contents
  function renderLeftPanelContent() {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Pill Tabs at Top - only show on home page */}
        {activePage === 'home' && (
          <div className="p-3 border-b border-[var(--color-border)] bg-transparent">
            <div role="tablist" aria-label={L.sections} className="flex rounded-full bg-[var(--color-surface-secondary)] p-1 border border-[var(--color-border)]/60">
              <button
                role="tab"
                aria-selected={leftTab === 'sections'}
                onClick={() => setLeftTab('sections')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-colors text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  leftTab === 'sections'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {L.sections}
              </button>
              <button
                onClick={() => {
                  if (isFreePlan) {
                    toast('warning', t('sections.pagesLockedToast'), lockedToastAction)
                    return
                  }
                  setLeftTab('pages')
                }}
                title={isFreePlan ? t('sections.lockedPagesTitle') : undefined}
                role="tab"
                aria-selected={leftTab === 'pages' && !isFreePlan}
                className={`flex-1 py-1.5 min-h-[44px] text-xs font-semibold rounded-full transition-colors text-center flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                  isFreePlan
                    ? 'cursor-not-allowed opacity-50 text-[var(--color-text-muted)]'
                    : 'cursor-pointer'
                } ${
                  leftTab === 'pages' && !isFreePlan
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {isFreePlan && <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />}
                {L.pages}
              </button>
            </div>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {activePage !== 'home' ? (
            <div className="space-y-3 pt-1">
              {/* Back to Home button */}
              <button
                onClick={() => {
                  setActivePage('home')
                  setSelectedSectionId(null)
                  setSelectedSectionType(null)
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                {t('sections.backToHome')}
              </button>

              {/* Active page card (highlighted) */}
              {editingProjectPage && (
                <div className="rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface)] p-3 shadow-sm space-y-2">
                  <div className="aspect-[16/9] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-center">
                    <FileText className="h-8 w-8 text-[var(--color-primary)] opacity-60" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">{editingProjectPage.title || t('common.untitled')}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-mono">/projects/{editingProjectPage.slug}</p>
                    </div>
                    <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                      {t('sections.editing')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {leftTab === 'sections' ? (
            <>
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {t('sections.portfolioSections')}
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((s: any) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {sections.map((sec: any) => {
                      const isSelected = selectedSectionId === sec.id
                      const isLocked = isFreePlan && isSectionLockedForFree(sec.sectionType)
                      const isVisible = isSectionVisible(sec)
                      return (
                        <SortableSectionItem
                          key={sec.id}
                          sec={sec}
                          isSelected={isSelected}
                          isVisible={isVisible}
                          locked={isLocked}
                          onSelect={() => {
                            if (isLocked) {
                              showLockedToast()
                              return
                            }
                            handleSelectSection(sec)
                          }}
                          onToggleVisibility={(e) => toggleSectionVisibility(sec.id, e)}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <div className="space-y-3 pt-1">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {t('sections.sitePages')}
              </p>
              {/* Home Page Thumbnail Card */}
              <div
                onClick={() => {
                  setSelectedSectionId(null)
                  setSelectedSectionType(null)
                  setActivePage('home')
                }}
                className={`rounded-xl border p-3 shadow-sm space-y-2 cursor-pointer transition-all ${
                  activePage === 'home' && !selectedSectionId
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface)]'
                    : 'border-[var(--color-border)] bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10'
                }`}
              >
                <div className="aspect-[16/9] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex flex-col p-1.5 overflow-hidden">
                  <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full mb-1" />
                  <div className="h-5 w-full rounded bg-gradient-to-r from-blue-400 to-indigo-500 mb-1 opacity-70" />
                  <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="bg-white/80 dark:bg-white/10 rounded" />
                    <div className="bg-white/80 dark:bg-white/10 rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">{t('sections.home')}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono">/</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t('common.live')}
                  </span>
                </div>
              </div>

              {/* Project Pages — locked behind subscription for FREE users */}
              {projectPages.map((pp: any) => {
                const isSelected = activePage === pp.id
                return (
                  <div
                    key={pp.id}
                    onClick={() => {
                      if (isFreePlan) {
                        showLockedToast()
                        return
                      }
                      handleSelectProjectPage(pp)
                    }}
                    title={isFreePlan ? t('sections.lockedTitle') : undefined}
                    className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      isFreePlan
                        ? 'opacity-50 cursor-not-allowed border-transparent'
                        : 'cursor-pointer'
                    } ${
                      isSelected && !isFreePlan
                        ? 'bg-[var(--color-surface)] border-[var(--color-primary)] shadow-sm text-[var(--color-primary)] font-semibold'
                        : 'border-transparent bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-[var(--color-border)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isFreePlan ? (
                        <Lock className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                      ) : pp.showInProjects !== false ? (
                        <LayoutGrid className="h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-60 group-hover:opacity-100 shrink-0" aria-hidden="true" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-60 group-hover:opacity-100 shrink-0" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="text-xs truncate">{pp.title || t('common.untitled')}</span>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                              pp.showInProjects !== false
                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                            }`}
                          >
                            {pp.showInProjects !== false
                              ? t('projectManager.cardBadge')
                              : t('projectManager.pageBadge')}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono">/projects/{pp.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {pp.isPublished && (
                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 me-1">
                          {t('common.live')}
                        </span>
                      )}
                      {pp.showInProjects === false && !linkedPageSlugs.has(pp.slug) && (
                        <span
                          title={t('sections.notLinkedTooltip')}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 me-1"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {t('sections.notLinked')}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProjectPage(pp.id)
                        }}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* New Project Page Button — locked for FREE users */}
              <button
                onClick={() => {
                  if (isFreePlan) {
                    showLockedToast()
                    return
                  }
                  handleCreateProjectPage()
                }}
                disabled={creatingProjectPage}
                title={isFreePlan ? t('sections.lockedTitle') : undefined}
                className="w-full flex items-center justify-center gap-1.5 py-2 min-h-[44px] text-[11px] font-semibold text-[var(--color-primary)] border border-dashed border-[var(--color-primary)]/40 rounded-lg hover:bg-[var(--color-primary)]/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {creatingProjectPage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {creatingProjectPage ? t('sections.creating') : t('sections.newProjectPage')}
              </button>
            </div>
          )}
            </>
          )}
        </div>

        {/* Bottom Theme & Global Styles shortcut - only on home page */}
        {activePage === 'home' && (
          <div className="p-3 border-t border-[var(--color-border)] bg-transparent mt-auto space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {t('sections.insights')}
              </span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            {isFreePlan ? (
              <button
                type="button"
                onClick={showLockedToast}
                title={t('sections.lockedTitle')}
                className="w-full flex min-h-[44px] items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-not-allowed opacity-50 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
              >
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t('sections.analytics')}</span>
              </button>
            ) : (
              <Link
                href="/profile/builder/analytics"
                className="w-full flex min-h-[44px] items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>{t('sections.analytics')}</span>
              </Link>
            )}
            <button
              onClick={() => {
                setSelectedSectionId(null)
                setSelectedSectionType(null)
                if (window.innerWidth < 768) setRightSheetOpen(true)
              }}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedSectionId === null
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>{t('sections.themeBioSettings')}</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // Sub-component wrapping Right Panel contents
  function renderRightPanelWrapper(onCloseMobile?: () => void) {
    const titleLabel = activePage !== 'home' && editingProjectPage && !selectedSection
      ? editingProjectPage.title || t('panel.projectPage')
      : selectedSection
        ? t(`section.${selectedSection.sectionType}`)
        : t('panel.themeBio')

    return (
      <div className="flex flex-col h-full overflow-hidden bg-[var(--color-surface-secondary)]">
        {/* Panel Header: "Edit | [Section Name]" */}
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {t('panel.edit')}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">|</span>
            <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {titleLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {(selectedSectionId || activePage !== 'home') && (
              <button
                onClick={() => {
                  setSelectedSectionId(null)
                  setSelectedSectionType(null)
                  setActivePage('home')
                }}
                className="text-[11px] font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer me-1"
                title={t('panel.theme')}
              >
                <Palette className="h-3 w-3" />
                <span className="hidden sm:inline">{t('panel.theme')}</span>
              </button>
            )}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Property Fields */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin space-y-6">
          {renderRightPanelContent()}
        </div>

        {/* Fixed Bottom Save Button */}
        <div className="p-3 border-t border-[var(--color-border)] bg-transparent shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2 px-1 text-xs min-h-[16px]">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[11px] font-medium">{t('panel.unsavedChanges')}</span>
                {draftSavedAt ? (
                  <span className="text-[11px] opacity-70" title={t('panel.draftSavedTitle')}>
                    · {t('panel.draftSaved')}
                  </span>
                ) : null}
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                <Check className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">{t('panel.saved')}</span>
              </span>
            ) : null}
          </div>
          <Button
            variant="primary"
            className="w-full h-10 gap-2 text-xs font-semibold shadow-sm cursor-pointer"
            onClick={() => handleSaveChanges()}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('panel.savingChanges')}</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>{t('panel.saveChanges')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }
}
