/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  ArrowLeft, Monitor, Smartphone, ExternalLink, Globe,
  Undo2, Redo2, CheckCircle, Check, Loader2, AlertCircle,
  GripVertical, Eye, EyeOff, ChevronRight, ChevronDown,
  Palette, Layout, FileText, Menu, X, Sliders, Plus, Trash2,
  Trophy, Star, Users, Briefcase, Heart, Zap, Target, Award,
  Clock, TrendingUp, Code, Layers, Rocket, PenTool, Sun, Moon,
  ArrowUp, BarChart3, LogOut, Languages, User
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
import { useI18n } from '@/components/I18nProvider'
import { useRouter } from 'next/navigation'
import { updatePortfolio, createProjectPage, updateProjectPage, deleteProjectPage, publishProfile, unpublishProfile, getOrCreateProfile } from '@/lib/actions/portfolio'
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
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {ICON_OPTIONS.map(({ key, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(value === key ? undefined : key)}
          className={`p-1.5 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
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
          className="p-1.5 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-all cursor-pointer flex items-center justify-center"
          title="Clear icon"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function ProjectPagePreview({ profile, projectPage }: { profile: any; projectPage: any }) {
  const appearance = profile.appearance || {}
  const defaultLangMode = appearance.defaultLanguage || 'en'
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
                  <div className="w-full sm:w-[300px] h-[200px] sm:h-auto shrink-0 bg-[var(--color-bg)] flex items-center justify-center border-b sm:border-b-0 sm:border-r border-[var(--color-border)] overflow-hidden">
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

        {/* Footer */}
        <footer
          className="py-16"
          style={{ backgroundColor: appearance.footerBg || '#0f172a', color: appearance.footerText || '#94a3b8' }}
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


function FormCard({ children, title, subtitle, action }: { children: React.ReactNode, title?: string, subtitle?: string, action?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1f2937] border border-[var(--color-border)] rounded-xl p-5 shadow-sm space-y-4">
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
  return (
    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-800/30 space-y-3 relative group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {title && <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{title}</h4>}
          {subtitle && <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] bg-white dark:bg-gray-700 rounded-md border border-[var(--color-border)] shadow-sm">
              <PenTool className="w-3.5 h-3.5" />
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-500 bg-white dark:bg-gray-700 rounded-md border border-[var(--color-border)] shadow-sm">
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
  onSelect,
  onToggleVisibility,
}: {
  sec: any
  isSelected: boolean
  isVisible: boolean
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
      className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-white dark:bg-[#262f45] border-[var(--color-primary)] shadow-sm text-[var(--color-primary)] font-semibold'
          : 'border-transparent bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-[var(--color-border)] text-[var(--color-text-primary)]'
      } ${isDragging ? 'z-50 shadow-md' : ''}`}
    >
      <div className="flex items-center gap-2 truncate">
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-black/5 dark:hover:bg-white/10 touch-none flex items-center justify-center shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-60 group-hover:opacity-100 shrink-0" />
        </div>
        <span className="text-xs capitalize truncate">{sec.sectionType}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Eye visibility toggle */}
        <button
          onClick={onToggleVisibility}
          className={`p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer ${
            isVisible ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)] opacity-50'
          }`}
          title={isVisible ? 'Hide Section' : 'Show Section'}
        >
          {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>

        {/* Chevron */}
        <ChevronRight
          className={`h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform ${
            isSelected ? 'rotate-90 text-[var(--color-primary)]' : ''
          }`}
        />
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
  lang,
  onToggleLang,
  dark,
  onToggleDark,
  onLogout,
}: {
  displayName: string
  lang: 'ar' | 'en'
  onToggleLang: () => void
  dark: boolean
  onToggleDark: () => void
  onLogout: () => void
}) {
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
    'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer text-left'

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
        title={displayName}
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <User className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[var(--color-border)]">
            <p className="text-xs font-bold truncate">{displayName}</p>
          </div>
          <button
            onClick={() => {
              onToggleLang()
              setOpen(false)
            }}
            className={rowClass}
          >
            <Languages className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="flex-1">{lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}</span>
            <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
              {lang === 'ar' ? 'EN' : 'عربي'}
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
            <span className="flex-1">{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className={`${rowClass} border-t border-[var(--color-border)]`}
          >
            <LogOut className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="flex-1">Log out</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function BuilderClient({ initialProfile }: { initialProfile: any }) {
  const { toast } = useToast()
  const { lang, setLang } = useI18n()
  const router = useRouter()

  const handleLogout = async () => {
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
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date())
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightSheetOpen, setRightSheetOpen] = useState(false)
  const [builderDarkMode, setBuilderDarkMode] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [activePage, setActivePage] = useState<'home' | string>('home')
  const [creatingProjectPage, setCreatingProjectPage] = useState(false)

  const [savedSnapshot, setSavedSnapshot] = useState(() => getProfileSnapshot(profile))
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  // Version conflict (another tab saved first): blocks saves until the
  // user picks Reload or Overwrite in the modal (Sprint F4).
  const [conflict, setConflict] = useState<{ serverVersion: number } | null>(null)
  const backoffRef = useRef(0)

  const isDirty = useMemo(() => {
    return getProfileSnapshot(profile) !== savedSnapshot
  }, [profile, savedSnapshot])

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
        setLastSaved(new Date())
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
        toast('success', 'Changes saved successfully!')
        return true
      } else if ((res as any).conflict) {
        setSaveStatus('error')
        setConflict({ serverVersion: (res as any).currentVersion ?? profile.version })
        return false
      } else {
        setSaveStatus('error')
        toast('error', res.error || 'Failed to save changes')
        return false
      }
    } catch (err: any) {
      console.error('Failed to save changes', err)
      setSaveStatus('error')
      toast('error', 'An unexpected error occurred')
      return false
    }
  }

  const handlePublish = async () => {
    if (saveStatus === 'saving') return
    if (profile.status === 'PUBLISHED') {
      const res = await unpublishProfile()
      if (res.success) {
        setProfile((p: any) => ({ ...p, status: 'DRAFT', version: (res as any).version ?? p.version }))
        toast('success', 'Unpublished. Your public page is now hidden.')
      } else {
        toast('error', (res as any).error || 'Failed to unpublish')
      }
      return
    }
    const saved = await handleSaveChanges()
    if (!saved) return
    const res = await publishProfile()
    if (res.success) {
      setProfile((p: any) => ({ ...p, status: 'PUBLISHED', version: (res as any).version ?? p.version }))
      toast('success', 'Published! Your portfolio is now live.')
    } else {
      toast('error', (res as any).error || 'Failed to publish')
    }
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
      toast('success', 'Reloaded the latest saved version.')
    } catch (err: any) {
      console.error('Failed to reload profile', err)
      setSaveStatus('error')
      toast('error', 'Reload failed, please try again')
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
  const updateProfile = useCallback((updater: (prev: any) => any) => {
    setProfile(updater)
  }, [])

  // Sections from profile, sorted for display.
  const sections = useMemo(() => {
    return [...(profile.pages?.[0]?.sections || [])]
      .sort((a, b) => a.sectionOrder - b.sectionOrder)
  }, [profile.pages])

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null
    return sections.find((s: any) => s.id === selectedSectionId) || null
  }, [sections, selectedSectionId])

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
    if (window.innerWidth < 1024) {
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

      const currentSections = newPages[0].sections || []
      const newSections = currentSections.map((s: any) => {
        if (s.id === sectionId || s.sectionType === sectionId) {
          let currentVisible = true
          if (s.visible === false) {
            currentVisible = false
          } else if (s.visible === true) {
            currentVisible = true
          } else if (s.settings) {
            try {
              const parsed = typeof s.settings === 'string' ? JSON.parse(s.settings) : s.settings
              currentVisible = parsed?.isVisible !== false
            } catch {
              currentVisible = true
            }
          }
          const nextVisible = !currentVisible

          const prevSettings = typeof s.settings === 'string' ? JSON.parse(s.settings) : (s.settings || {})
          return { 
            ...s, 
            visible: nextVisible,
            settings: { ...prevSettings, isVisible: nextVisible } 
          }
        }
        return s
      })

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

  // Move section up or down
  const moveSection = (index: number, direction: -1 | 1, e: React.MouseEvent) => {
    e.stopPropagation()
    if (index + direction < 0 || index + direction >= sections.length) return
    updateProfile((p: any) => {
      const newPages = [...(p.pages || [])]
      const newSections = [...(newPages[0]?.sections || [])]
      const temp = newSections[index]
      newSections[index] = newSections[index + direction]
      newSections[index + direction] = temp
      newSections.forEach((s: any, i: number) => { s.sectionOrder = i + 1 })
      newPages[0].sections = newSections
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

  // Localized profile updater
  const handleLocalizedChange = (field: string, lang: 'en' | 'ar', value: string) => {
    updateProfile((p: any) => ({
      ...p,
      localized: {
        ...p.localized,
        [field]: { ...p.localized?.[field], [lang]: value }
      }
    }))
  }

  // Contact links helpers
  const handleSocialChange = (index: number, key: string, value: string) => {
    const newLinks = [...(profile.contactLinks || [])]
    newLinks[index] = { ...newLinks[index], [key]: value }
    updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
  }

  const handleAddSocial = () => {
    const current = profile.contactLinks || []
    updateProfile((p: any) => ({
      ...p,
      contactLinks: [...current, { label: 'LinkedIn', url: '' }]
    }))
  }

  const handleRemoveSocial = (index: number) => {
    const newLinks = [...(profile.contactLinks || [])]
    newLinks.splice(index, 1)
    updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
  }

  const langMode = 'en'
  const showEn = true
  const showAr = false

  // Project page handlers
  const projectPages = useMemo(() => {
    return [...(profile.projectPages || [])].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [profile.projectPages])

  const selectedProjectPage = useMemo(() => {
    if (activePage === 'home') return null
    return projectPages.find((p: any) => p.id === activePage) || null
  }, [projectPages, activePage])

  const editingProjectPage = useMemo(() => {
    if (activePage === 'home') return null
    return projectPages.find((p: any) => p.id === activePage) || null
  }, [projectPages, activePage])

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
        if (window.innerWidth < 1024) {
          setLeftDrawerOpen(false)
          setRightSheetOpen(true)
        }
        toast('success', 'Project page created')
      } else {
        console.error('createProjectPage failed:', res.error)
        toast('error', res.error || 'Failed to create project page')
      }
    } catch (err) {
      console.error('Failed to create project page', err)
      toast('error', 'Failed to create project page')
    } finally {
      setCreatingProjectPage(false)
    }
  }

  const handleSelectProjectPage = (page: any) => {
    setActivePage(page.id)
    // Clear section selection
    setSelectedSectionId(null)
    setSelectedSectionType(null)
    if (window.innerWidth < 1024) {
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

  const handleDeleteProjectPage = async (pageId: string) => {
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
        toast('success', 'Project page deleted')
      } else {
        console.error('deleteProjectPage failed:', res.error)
        toast('error', res.error || 'Failed to delete project page')
      }
    } catch (err) {
      console.error('Failed to delete project page', err)
      toast('error', 'Failed to delete project page')
    }
  }

  // Render properties editor for selected section or project page
  const renderRightPanelContent = () => {
    // Project page editing
    if (activePage !== 'home' && editingProjectPage && !selectedSection) {
      const pp = editingProjectPage
      return (
        <div className="space-y-6">
          <FormCard title="Page Configuration">
            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Page Title</label>
                <Input
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
                <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">URL Slug</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--color-border)] bg-gray-50 dark:bg-gray-800 text-[var(--color-text-muted)] text-xs">
                    /u/{profile.username}/projects/
                  </span>
                  <Input
                    value={pp.slug || ''}
                    onChange={(e) => updateProjectPageField(pp.id, 'slug', e.target.value.replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, ''))}
                    className="h-[44px] min-h-[44px] text-[15px] px-[12px] py-[10px] rounded-l-none flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Back Button Label</label>
                <Input
                  value={pp.backButtonLabel || 'Back to Portfolio'}
                  onChange={(e) => updateProjectPageField(pp.id, 'backButtonLabel', e.target.value)}
                  className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                />
              </div>
            </div>
          </FormCard>

          <FormCard title="Page Header" subtitle="Cover image and description">
            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Cover Image URL</label>
                <div className="flex gap-2">
                  <Input
                    value={pp.coverImage || ''}
                    onChange={(e) => updateProjectPageField(pp.id, 'coverImage', e.target.value)}
                    className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    placeholder="https://..."
                  />
                  <div className="relative overflow-hidden shrink-0">
                    <Button variant="secondary" className="h-[44px] min-h-[44px] px-4 text-sm">
                      Upload
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const result = await uploadToCloudinary(file)
                          updateProjectPageField(pp.id, 'coverImage', result.url)
                        } catch (err) {
                          console.error(err)
                        }
                      }}
                    />
                  </div>
                </div>
                {pp.coverImage && (
                  <img src={pp.coverImage} alt="Cover Preview" className="mt-2 w-full h-28 rounded-lg object-cover border border-[var(--color-border)]" />
                )}
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Description</label>
                <textarea
                  value={pp.description || ''}
                  onChange={(e) => updateProjectPageField(pp.id, 'description', e.target.value)}
                  className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
          </FormCard>

          <FormCard title="Project Items" subtitle="Manage layout and items">
            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Display Mode</label>
                <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
                  <button
                    type="button"
                    onClick={() => updateProjectPageField(pp.id, 'displayMode', 'grid')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                      (pp.displayMode || 'grid') === 'grid'
                        ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProjectPageField(pp.id, 'displayMode', 'list')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                      pp.displayMode === 'list'
                        ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(pp.items || []).map((item: any, idx: number) => (
                  <ItemCard
                    key={item.id}
                    title={item.title || 'New Item'}
                    onRemove={() => {
                      const newItems = [...(pp.items || [])]
                      newItems.splice(idx, 1)
                      updateProjectPageField(pp.id, 'items', newItems)
                    }}
                  >
                    <div className="flex flex-col gap-4 mt-2">
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Title</label>
                        <Input
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
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Description</label>
                        <textarea
                          value={item.textContent || ''}
                          onChange={(e) => {
                            const newItems = [...(pp.items || [])]
                            newItems[idx].textContent = e.target.value
                            updateProjectPageField(pp.id, 'items', newItems)
                          }}
                          className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Image URL</label>
                        <div className="flex gap-2">
                          <Input
                            value={item.imageUrl || ''}
                            onChange={(e) => {
                              const newItems = [...(pp.items || [])]
                              newItems[idx].imageUrl = e.target.value
                              updateProjectPageField(pp.id, 'items', newItems)
                            }}
                            className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          />
                          <div className="relative overflow-hidden shrink-0">
                            <Button variant="secondary" className="h-[44px] min-h-[44px] px-3 text-xs">
                              Upload
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
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
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">External Link</label>
                        <Input
                          value={item.externalUrl || ''}
                          onChange={(e) => {
                            const newItems = [...(pp.items || [])]
                            newItems[idx].externalUrl = e.target.value
                            updateProjectPageField(pp.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </ItemCard>
                ))}
                
                {(pp.items || []).length === 0 && (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">No items in this project page.</p>
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
                  label="Add Project Item"
                  icon={Palette}
                />
              </div>
            </div>
          </FormCard>
        </div>
      )
    }

    if (!selectedSection || !selectedSectionType) {
      return <ThemeSettings profile={profile} updateProfile={updateProfile} />
    }

    const c = selectedSection.content || {}
    const loc = profile.localized || {}

    switch (selectedSectionType) {
      case 'hero':
        return (
          <div className="space-y-6">
            <FormCard title="Profile Photo" subtitle="Your avatar or portrait image">
              <div className="flex gap-2">
                <Input
                  value={profile.avatarUrl || ''}
                  onChange={e => updateProfile((p: any) => ({ ...p, avatarUrl: e.target.value }))}
                  placeholder="Image URL"
                  className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                />
                <div className="relative overflow-hidden shrink-0">
                  <Button variant="secondary" className="h-[44px] min-h-[44px] px-4 text-sm" disabled={uploadingAvatar}>
                    {uploadingAvatar ? '...' : 'Upload'}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
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
                  />
                </div>
                {profile.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => updateProfile((p: any) => ({ ...p, avatarUrl: '' }))}
                    className="h-[44px] min-h-[44px] px-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-300 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    title="Remove profile image"
                  >
                    <span>✕ Remove</span>
                  </button>
                )}
              </div>
              {profile.avatarUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={profile.avatarUrl} alt="Avatar Preview" className="w-16 h-16 rounded-full object-cover border border-[var(--color-border)] shadow-sm" />
                </div>
              )}
            </FormCard>

            <FormCard title="Background Image" subtitle="Optional backdrop image with dark overlay">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Background Image URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={c.backgroundImage || ''}
                      onChange={(e) => updateSectionContentRaw(selectedSection.id, 'backgroundImage', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    />
                    <div className="relative overflow-hidden shrink-0">
                      <Button variant="secondary" className="h-[44px] min-h-[44px] px-4 text-sm">
                        Upload
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const result = await uploadToCloudinary(file)
                            updateSectionContentRaw(selectedSection.id, 'backgroundImage', result.url)
                          } catch (err) {
                            console.error(err)
                          }
                        }}
                      />
                    </div>
                    {c.backgroundImage && (
                      <button
                        type="button"
                        onClick={() => updateSectionContentRaw(selectedSection.id, 'backgroundImage', '')}
                        className="h-[44px] min-h-[44px] px-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-300 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        title="Remove background image"
                      >
                        <span>✕ Remove</span>
                      </button>
                    )}
                  </div>
                  {c.backgroundImage && (
                    <div className="mt-2">
                      <img src={c.backgroundImage} alt="Background Preview" className="w-full h-28 rounded-lg object-cover border border-[var(--color-border)] shadow-sm" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[13px] font-semibold text-[var(--color-text-primary)]">Overlay Opacity</label>
                    <span className="text-xs font-mono font-medium text-[var(--color-text-muted)]">
                      {Math.round((c.overlayOpacity !== undefined ? Number(c.overlayOpacity) : 0.5) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={c.overlayOpacity !== undefined ? c.overlayOpacity : 0.5}
                    onChange={(e) => updateSectionContentRaw(selectedSection.id, 'overlayOpacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-surface-secondary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                  />
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
                    Darkens the background image to keep hero text readable.
                  </p>
                </div>
              </div>
            </FormCard>

            <FormCard title="Hero Content" subtitle="Display Name and Job Title">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Display Name</label>
                  <Input
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
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Job Title</label>
                  <Input
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
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>
              </div>
            </FormCard>
          </div>
        )

      case 'about':
        const aboutStats = c.stats || []
        return (
          <div className="space-y-6">
            <FormCard title="Section Content" subtitle="Icon, Heading, and Biography">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Icon</label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>
                
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Heading</label>
                  <Input
                    value={c.title?.en || 'About Me'}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'title', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Detailed Biography</label>
                  <textarea
                    value={c.biography?.en !== undefined ? c.biography.en : (c.text?.en || '')}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'biography', 'en', e.target.value)}
                    className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    placeholder="Write your comprehensive biography..."
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title="Stat Cards" subtitle="Highlight key metrics in your About section">
              <div className="space-y-4">
                {aboutStats.map((stat: any, idx: number) => (
                  <ItemCard
                    key={idx}
                    onRemove={() => {
                      const newStats = [...aboutStats]
                      newStats.splice(idx, 1)
                      updateSectionContentRaw(selectedSection.id, 'stats', newStats)
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-[var(--color-text-muted)] font-medium w-10 shrink-0">Icon</span>
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
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Value</label>
                        <Input
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...aboutStats]
                            newStats[idx] = { ...newStats[idx], value: e.target.value }
                            updateSectionContentRaw(selectedSection.id, 'stats', newStats)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          placeholder="e.g. 50+"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Label</label>
                        <Input
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...aboutStats]
                            newStats[idx] = { ...newStats[idx], label: e.target.value }
                            updateSectionContentRaw(selectedSection.id, 'stats', newStats)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          placeholder="e.g. Projects"
                        />
                      </div>
                    </div>
                  </ItemCard>
                ))}
                {aboutStats.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">No stats added yet.</p>
                  </div>
                )}
                <AddActionCard 
                  onClick={() => {
                    const newStats = [...aboutStats, { icon: 'trophy', value: '0', label: 'New Stat' }]
                    updateSectionContentRaw(selectedSection.id, 'stats', newStats)
                  }}
                  label="Add Stat Card"
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
            <FormCard title="Section Content" subtitle="Icon and Heading">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Icon</label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Heading</label>
                  <Input
                    value={c.heading?.en || 'Skills & Expertise'}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'heading', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title="Skill Groups" subtitle="Organize your skills into categories">
              <div className="space-y-4">
                {skillGroups.length > 0 ? skillGroups.map((group: any, gIdx: number) => (
                  <ItemCard
                    key={gIdx}
                    onRemove={() => {
                      const newGroups = [...skillGroups]
                      newGroups.splice(gIdx, 1)
                      updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                    }}
                  >
                    <div>
                      <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Group Name</label>
                      <Input
                        value={group.name}
                        onChange={(e) => {
                          const newGroups = [...skillGroups]
                          newGroups[gIdx] = { ...group, name: e.target.value }
                          updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                        }}
                        className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] font-semibold"
                        placeholder="e.g. Frontend, Backend..."
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2 mt-4">
                        <label className="text-xs font-semibold text-[var(--color-text-primary)]">Skills in Group</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newGroups = [...skillGroups]
                            newGroups[gIdx].skills = [...(group.skills || []), { name: 'New Skill', percentage: 80 }]
                            updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                          }}
                          className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                        >
                          + Add Skill
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(group.skills || []).map((skill: any, sIdx: number) => (
                          <div key={sIdx} className="flex items-center gap-2">
                            <Input
                              value={skill.name}
                              onChange={(e) => {
                                const newGroups = [...skillGroups]
                                newGroups[gIdx].skills[sIdx].name = e.target.value
                                updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                              }}
                              placeholder="Skill name"
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
                                className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-[12px] py-[10px] min-h-[44px] h-[44px] text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] pr-7"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] pointer-events-none">%</span>
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
                          <div className="text-center py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-[var(--color-text-muted)]">No skills in this group</div>
                        )}
                      </div>
                    </div>
                  </ItemCard>
                )) : fallbackSkills.length > 0 ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-sm text-amber-800 dark:text-amber-500">
                    Your profile has legacy skills format. Click &quot;Add Skill Group&quot; to migrate to the new structure.
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">No skill groups added yet.</p>
                  </div>
                )}
                
                <AddActionCard 
                  onClick={() => {
                    const newGroups = [...skillGroups, { name: 'New Group', skills: [] }]
                    updateSectionContentRaw(selectedSection.id, 'groups', newGroups)
                  }}
                  label="Add Skill Group"
                  icon={Layers}
                />
              </div>
            </FormCard>
          </div>
        )
      case 'experience':
        const experienceItems = c.items || []
        const expDisplayMode = c.displayMode || 'timeline'
        return (
          <div className="space-y-6">
            <FormCard title="Section Settings" subtitle="Display mode and icon">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    Display Mode
                  </label>
                  <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
                    {['timeline', 'grid', 'list'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => updateSectionContentRaw(selectedSection.id, 'displayMode', mode)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                          expDisplayMode === mode
                            ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    Section Icon
                  </label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title="Section Content" subtitle="Heading and Description">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Heading</label>
                  <Input
                    value={c.heading?.en || 'Work Experience'}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'heading', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Description (Optional)</label>
                  <textarea
                    value={c.description?.en || ''}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'description', 'en', e.target.value)}
                    className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title="Experience Items" subtitle="Your work history">
              <div className="space-y-4">
                {experienceItems.map((item: any, idx: number) => (
                  <ItemCard
                    key={item.id}
                    title={item.jobTitle || 'New Role'}
                    subtitle={item.companyName || 'Company'}
                    onRemove={() => {
                      const newItems = [...experienceItems]
                      newItems.splice(idx, 1)
                      updateSectionContentRaw(selectedSection.id, 'items', newItems)
                    }}
                  >
                    <div className="flex flex-col gap-4 mt-3">
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Job Title</label>
                        <Input
                          value={item.jobTitle || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].jobTitle = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Company Name</label>
                        <Input
                          value={item.companyName || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].companyName = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Company Logo URL</label>
                        <div className="flex gap-2">
                          <Input
                            value={item.companyLogo || ''}
                            onChange={(e) => {
                              const newItems = [...experienceItems]
                              newItems[idx].companyLogo = e.target.value
                              updateSectionContentRaw(selectedSection.id, 'items', newItems)
                            }}
                            className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                            placeholder="https://..."
                          />
                          <div className="relative overflow-hidden shrink-0">
                            <Button variant="secondary" className="h-[44px] min-h-[44px] px-3 text-xs">
                              Upload
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
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
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Start Date</label>
                        <input
                          type="month"
                          value={item.startDate || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].startDate = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">End Date</label>
                        <input
                          type="month"
                          value={item.endDate || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].endDate = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
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
                            Currently working here
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Location</label>
                        <Input
                          value={item.location || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].location = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                          placeholder="e.g. London, UK"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Work Mode</label>
                        <select
                          value={item.workMode || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].workMode = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[44px] h-[44px] rounded-lg border border-[var(--color-border)] bg-transparent px-[12px] py-[10px] text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        >
                          <option value="">Select Mode</option>
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="On-site">On-site</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Description (Bullets)</label>
                        <textarea
                          value={item.description || ''}
                          onChange={(e) => {
                            const newItems = [...experienceItems]
                            newItems[idx].description = e.target.value
                            updateSectionContentRaw(selectedSection.id, 'items', newItems)
                          }}
                          className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                          placeholder="Enter each achievement on a new line..."
                        />
                      </div>
                    </div>
                  </ItemCard>
                ))}
                
                {experienceItems.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">No experience added yet.</p>
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
                  label="Add Experience"
                  icon={Briefcase}
                />
              </div>
            </FormCard>
          </div>
        )
      case 'services':
        const services = c.services || []
        return (
          <div className="space-y-6">
            <FormCard title="Section Content" subtitle="Icon, Heading, and Description">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    Section Icon
                  </label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    Section Heading
                  </label>
                  <Input
                    value={c.title?.en || 'Services'}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'title', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    Section Description
                  </label>
                  <textarea
                    value={c.description?.en || ''}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'description', 'en', e.target.value)}
                    className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="Brief description of your services..."
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title="Services List" subtitle="What you offer">
              <div className="space-y-4">
                {services.map((service: any, idx: number) => (
                  <ItemCard
                    key={idx}
                    title={service.title || 'New Service'}
                    onRemove={() => {
                      const newServices = services.filter((_: any, i: number) => i !== idx)
                      updateSectionContentRaw(selectedSection.id, 'services', newServices)
                    }}
                  >
                    <div className="flex flex-col gap-4 mt-2">
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Service Icon</label>
                        <IconPicker
                          value={service.icon}
                          onChange={(val) => {
                            const newServices = [...services]
                            newServices[idx] = { ...newServices[idx], icon: val }
                            updateSectionContentRaw(selectedSection.id, 'services', newServices)
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Service Title</label>
                        <Input
                          value={service.title}
                          onChange={(e) => {
                            const newServices = [...services]
                            newServices[idx] = { ...newServices[idx], title: e.target.value }
                            updateSectionContentRaw(selectedSection.id, 'services', newServices)
                          }}
                          placeholder="Service title"
                          className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px] font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Service Description</label>
                        <textarea
                          value={service.description}
                          onChange={(e) => {
                            const newServices = [...services]
                            newServices[idx] = { ...newServices[idx], description: e.target.value }
                            updateSectionContentRaw(selectedSection.id, 'services', newServices)
                          }}
                          placeholder="Short description"
                          className="w-full min-h-[100px] resize-y rounded-lg border border-[var(--color-border)] bg-transparent p-3 text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-[var(--color-text-primary)]">Features</label>
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
                            + Add Feature
                          </button>
                        </div>
                        <div className="space-y-3">
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
                                placeholder="Feature text"
                                className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newServices = [...services]
                                  const features = (newServices[idx].features || []).filter((_: any, i: number) => i !== fi)
                                  newServices[idx] = { ...newServices[idx], features }
                                  updateSectionContentRaw(selectedSection.id, 'services', newServices)
                                }}
                                className="p-2 text-[var(--color-danger)] hover:opacity-80 cursor-pointer"
                                title="Remove feature"
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
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">No services added yet.</p>
                  </div>
                )}
                
                <AddActionCard 
                  onClick={() => {
                    const newServices = [...services, { icon: 'code', title: 'New Service', description: '', features: [] }]
                    updateSectionContentRaw(selectedSection.id, 'services', newServices)
                  }}
                  label="Add Service"
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
            <FormCard title="Section Settings" subtitle="Display mode and icon">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    Display Mode
                  </label>
                  <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
                    <button
                      type="button"
                      onClick={() => updateSectionContentRaw(selectedSection.id, 'displayMode', 'grid')}
                      className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${
                        displayMode === 'grid'
                          ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
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
                          ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">
                    Section Icon
                  </label>
                  <IconPicker
                    value={c.icon}
                    onChange={(val) => updateSectionContentRaw(selectedSection.id, 'icon', val)}
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title="Section Content" subtitle="Heading">
              <div>
                <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Section Heading</label>
                <Input
                  value={c.title?.en || 'Featured Projects'}
                  onChange={(e) => updateSectionContent(selectedSection.id, 'title', 'en', e.target.value)}
                  className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                />
              </div>
            </FormCard>

            <FormCard title="Project Cards" subtitle="Manage portfolio projects">
              <ProjectManager profile={profile} updateProfile={updateProfile} isCardMode={true} allProjectPages={projectPages} />
            </FormCard>
          </div>
        )

      case 'footer':
        const footerLinks = profile.contactLinks || c.links || []
        return (
          <div className="space-y-6">
            <FormCard title="Footer Content" subtitle="Headline and subheading">
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Headline</label>
                  <Input
                    value={c.headline?.en ?? (typeof c.headline === 'string' ? c.headline : 'Work with me')}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'headline', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    placeholder="e.g. Work with me"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-2 block">Subheading (Optional)</label>
                  <Input
                    value={c.subheading?.en ?? (typeof c.subheading === 'string' ? c.subheading : '')}
                    onChange={(e) => updateSectionContent(selectedSection.id, 'subheading', 'en', e.target.value)}
                    className="w-full min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    placeholder="e.g. Let's build something great together."
                  />
                </div>
              </div>
            </FormCard>

            <FormCard title="Social / Contact Links" subtitle="Add, edit, or remove your links">
              <div className="space-y-3">
                {footerLinks.map((link: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-800/30">
                    <select
                      value={link.label || link.platform || 'LinkedIn'}
                      onChange={(e) => {
                        const newLinks = [...footerLinks]
                        newLinks[idx] = { ...newLinks[idx], label: e.target.value, platform: e.target.value }
                        updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
                        updateSectionContentRaw(selectedSection.id, 'links', newLinks)
                      }}
                      className="w-32 rounded-lg border border-[var(--color-border)] bg-transparent px-3 h-[44px] min-h-[44px] text-[15px] font-medium focus:outline-none"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="GitHub">GitHub</option>
                      <option value="Twitter">Twitter / X</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Website">Website</option>
                    </select>
                    <Input
                      value={link.url || ''}
                      onChange={(e) => {
                        const newLinks = [...footerLinks]
                        newLinks[idx] = { ...newLinks[idx], url: e.target.value }
                        updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
                        updateSectionContentRaw(selectedSection.id, 'links', newLinks)
                      }}
                      placeholder="https://... or email"
                      className="flex-1 min-h-[44px] h-[44px] text-[15px] px-[12px] py-[10px]"
                    />
                    <button
                      onClick={() => {
                        const newLinks = footerLinks.filter((_: any, i: number) => i !== idx)
                        updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
                        updateSectionContentRaw(selectedSection.id, 'links', newLinks)
                      }}
                      className="p-2 text-[var(--color-danger)] hover:opacity-80 cursor-pointer"
                      title="Remove link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {footerLinks.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] text-center py-4 border border-dashed rounded-lg border-[var(--color-border)]">
                    No links added yet.
                  </p>
                )}
                <AddActionCard
                  onClick={() => {
                    const newLinks = [...footerLinks, { label: 'LinkedIn', url: '' }]
                    updateProfile((p: any) => ({ ...p, contactLinks: newLinks }))
                    updateSectionContentRaw(selectedSection.id, 'links', newLinks)
                  }}
                  label="Add Social / Contact Link"
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

  return (
    <div className={`flex h-screen w-full flex-col overflow-hidden bg-[var(--color-page)] select-none ${builderDarkMode ? 'dark' : ''}`}>
      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 space-y-3">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Newer changes found
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                This portfolio was saved elsewhere (another tab or device) after you started
                editing. Reloading discards your unsaved edits; overwriting keeps them and
                saves on top of the latest version.
              </p>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" className="flex-1" onClick={handleConflictReload}>
                  Reload latest
                </Button>
                <Button variant="primary" className="flex-1" onClick={handleConflictOverwrite}>
                  Overwrite with mine
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BAR (Height: 52px, border-b, bg white / dark card)
      ────────────────────────────────────────────────────────────── */}
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white dark:bg-[#1f2937] px-3 sm:px-4 z-30">
        {/* Left: Back Link & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setLeftDrawerOpen(true)}
            className="lg:hidden p-1.5 rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link
            href={`/u/${profile.username}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View Live Portfolio</span>
          </Link>
          <div className="h-3.5 w-px bg-[var(--color-border)]" />
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
              Portfolio Builder
            </h1>
          </div>
        </div>

        {/* Center: Undo / Redo & Save Status */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
            <button
              type="button"
              title="Undo"
              className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Redo"
              className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-[11px] font-medium">Saving...</span>
              </span>
            ) : isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-text-muted)]">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[11px] font-medium">Unsaved changes</span>
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Saved</span>
              </span>
            ) : saveStatus === 'error' ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-danger)]">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Save failed</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: Device Switcher & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ProfileMenu
            displayName={profile.displayName || profile.username || 'User'}
            lang={lang}
            onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            dark={builderDarkMode}
            onToggleDark={() => setBuilderDarkMode(!builderDarkMode)}
            onLogout={handleLogout}
          />
          <div className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`rounded p-1.5 transition-colors cursor-pointer ${
                previewMode === 'desktop'
                  ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Desktop View"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`rounded p-1.5 transition-colors cursor-pointer ${
                previewMode === 'mobile'
                  ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Mobile View"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          {activePage !== 'home' &&
          editingProjectPage &&
          (editingProjectPage.slug?.startsWith('new-') ||
            editingProjectPage.slug?.startsWith('project-new-') ||
            editingProjectPage.id?.startsWith('new-')) ? (
            <span
              title="Save first"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-transparent px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed select-none"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View Live</span>
            </span>
          ) : (
            <a
              href={
                profile.username
                  ? activePage !== 'home' && editingProjectPage?.slug
                    ? `/u/${profile.username}/projects/${editingProjectPage.slug}`
                    : `/u/${profile.username}`
                  : '#'
              }
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-transparent px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View Live</span>
            </a>
          )}

          <NotificationBell />
          <Button
            variant="primary"
            size="sm"
            className="h-8 px-3 text-xs gap-1.5 font-medium"
            onClick={handlePublish}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{profile.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</span>
          </Button>

          <button
            onClick={() => setRightSheetOpen(true)}
            className="lg:hidden p-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] cursor-pointer"
            aria-label="Open settings"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN 3-PANEL BODY
      ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ─────────────────────────────────────────────────────────────
            2. LEFT PANEL (~200px, pill tabs: Sections / Pages)
        ────────────────────────────────────────────────────────────── */}
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-[200px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[#F8F9FA] dark:bg-[#1a1f2e] overflow-hidden">
          {renderLeftPanelContent()}
        </aside>

        {/* Mobile slide-over drawer */}
        {leftDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setLeftDrawerOpen(false)} />
            <div className="relative w-72 max-w-[80vw] bg-[#F8F9FA] dark:bg-[#1a1f2e] shadow-2xl flex flex-col h-full z-10">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Navigation</span>
                <button onClick={() => setLeftDrawerOpen(false)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {renderLeftPanelContent()}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. CENTER CANVAS (Canvas area bg #F1F3F5 / #0f1117)
        ────────────────────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#F1F3F5] dark:bg-[#0f1117] relative overflow-hidden flex items-center justify-center p-3 lg:p-4">
          <div
            className={`transition-all duration-300 ease-in-out bg-white dark:bg-[#121212] overflow-hidden flex flex-col ${
              previewMode === 'mobile'
                ? 'w-[390px] h-[780px] max-h-full rounded-[36px] shadow-2xl border-[8px] border-[#1e293b] dark:border-[#334155] relative shrink-0'
                : 'w-full h-full max-w-[1080px] rounded-[12px] shadow-md border border-black/5 dark:border-white/10'
            }`}
          >
            {previewMode === 'mobile' && (
              <div className="h-5 w-full bg-[#1e293b] dark:bg-[#334155] flex items-center justify-center shrink-0 z-20">
                <div className="h-3 w-20 bg-black/60 rounded-full" />
              </div>
            )}
            <div className="flex-1 w-full min-h-0 overflow-hidden relative">
              {activePage !== 'home' && editingProjectPage && !selectedSection ? (
                <ProjectPagePreview profile={profile} projectPage={editingProjectPage} />
              ) : (
                <LivePreview profile={profile} />
              )}
            </div>
          </div>
        </main>

        {/* ─────────────────────────────────────────────────────────────
            4. RIGHT PANEL (~470px, Edit | [Section Name], Save button)
        ────────────────────────────────────────────────────────────── */}
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-[470px] min-w-[470px] shrink-0 flex-col border-l border-[var(--color-border)] bg-white dark:bg-[#1f2937] overflow-hidden">
          {renderRightPanelWrapper()}
        </aside>

        {/* Mobile bottom sheet */}
        {rightSheetOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            <div className="fixed inset-0 bg-black/50" onClick={() => setRightSheetOpen(false)} />
            <div className="relative w-full max-h-[85vh] bg-white dark:bg-[#1f2937] rounded-t-2xl shadow-2xl flex flex-col z-10 overflow-hidden">
              <div className="h-1.5 w-10 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-2 shrink-0" />
              <div className="flex-1 overflow-hidden flex flex-col">
                {renderRightPanelWrapper(() => setRightSheetOpen(false))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Sub-component rendering Left Panel contents
  function renderLeftPanelContent() {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Pill Tabs at Top - only show on home page */}
        {activePage === 'home' && (
          <div className="p-3 border-b border-[var(--color-border)] bg-transparent">
            <div className="flex rounded-full bg-[var(--color-surface-secondary)] p-1 border border-[var(--color-border)]/60">
              <button
                onClick={() => setLeftTab('sections')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all text-center cursor-pointer ${
                  leftTab === 'sections'
                    ? 'bg-white dark:bg-[#374151] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Sections
              </button>
              <button
                onClick={() => setLeftTab('pages')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all text-center cursor-pointer ${
                  leftTab === 'pages'
                    ? 'bg-white dark:bg-[#374151] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Pages
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
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Home
              </button>

              {/* Active page card (highlighted) */}
              {editingProjectPage && (
                <div className="rounded-xl border border-[var(--color-primary)] bg-white dark:bg-[#262f45] p-3 shadow-sm space-y-2">
                  <div className="aspect-[16/9] w-full rounded-md border border-[var(--color-border)] bg-[#F1F3F5] dark:bg-[#111827] flex items-center justify-center">
                    <FileText className="h-8 w-8 text-[var(--color-primary)] opacity-60" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">{editingProjectPage.title || 'Untitled'}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-mono">/projects/{editingProjectPage.slug}</p>
                    </div>
                    <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                      Editing
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
                Portfolio Sections
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
                      let isVisible = true
                      if (sec.visible === false) {
                        isVisible = false
                      } else if (sec.visible === true) {
                        isVisible = true
                      } else if (sec.settings) {
                        try {
                          const parsed = typeof sec.settings === 'string' ? JSON.parse(sec.settings) : sec.settings
                          isVisible = parsed?.isVisible !== false
                        } catch {
                          isVisible = true
                        }
                      }
                      return (
                        <SortableSectionItem
                          key={sec.id}
                          sec={sec}
                          isSelected={isSelected}
                          isVisible={isVisible}
                          onSelect={() => handleSelectSection(sec)}
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
                Site Pages
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
                    ? 'border-[var(--color-primary)] bg-white dark:bg-[#262f45]'
                    : 'border-[var(--color-border)] bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10'
                }`}
              >
                <div className="aspect-[16/9] w-full rounded-md border border-[var(--color-border)] bg-[#F1F3F5] dark:bg-[#111827] flex flex-col p-1.5 overflow-hidden">
                  <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full mb-1" />
                  <div className="h-5 w-full rounded bg-gradient-to-r from-blue-400 to-indigo-500 mb-1 opacity-70" />
                  <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="bg-white/80 dark:bg-white/10 rounded" />
                    <div className="bg-white/80 dark:bg-white/10 rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">Home</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono">/</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </div>
              </div>

              {/* Project Pages */}
              {projectPages.map((pp: any) => {
                const isSelected = activePage === pp.id
                return (
                  <div
                    key={pp.id}
                    onClick={() => handleSelectProjectPage(pp)}
                    className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#262f45] border-[var(--color-primary)] shadow-sm text-[var(--color-primary)] font-semibold'
                        : 'border-transparent bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-[var(--color-border)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-3.5 w-3.5 text-[var(--color-text-muted)] opacity-60 group-hover:opacity-100 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs truncate block">{pp.title || 'Untitled'}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono">/projects/{pp.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {pp.isPublished && (
                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mr-1">
                          Live
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProjectPage(pp.id)
                        }}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* New Project Page Button */}
              <button
                onClick={handleCreateProjectPage}
                disabled={creatingProjectPage}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-[var(--color-primary)] border border-dashed border-[var(--color-primary)]/40 rounded-lg hover:bg-[var(--color-primary)]/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {creatingProjectPage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {creatingProjectPage ? 'Creating...' : 'New Project Page'}
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
                Insights
              </span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            <Link
              href="/profile/builder/analytics"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-[#2d3748] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{(profile?.appearance as any)?.defaultLanguage === 'ar' ? 'الإحصائيات' : 'Analytics'}</span>
            </Link>
            <button
              onClick={() => {
                setSelectedSectionId(null)
                setSelectedSectionType(null)
                if (window.innerWidth < 1024) setRightSheetOpen(true)
              }}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedSectionId === null
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-white dark:bg-[#2d3748] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)]'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Theme & Bio Settings</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // Sub-component wrapping Right Panel contents
  function renderRightPanelWrapper(onCloseMobile?: () => void) {
    const titleLabel = activePage !== 'home' && editingProjectPage && !selectedSection
      ? editingProjectPage.title || 'Project Page'
      : selectedSection
        ? selectedSection.sectionType.charAt(0).toUpperCase() + selectedSection.sectionType.slice(1)
        : 'Theme & Bio'

    return (
      <div className="flex flex-col h-full overflow-hidden bg-gray-50/50 dark:bg-[#111827]">
        {/* Panel Header: "Edit | [Section Name]" */}
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 bg-white dark:bg-[#1f2937]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Edit
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
                className="text-[11px] font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer mr-1"
                title="Back to Theme"
              >
                <Palette className="h-3 w-3" />
                <span className="hidden sm:inline">Theme</span>
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
                <span className="text-[11px] font-medium">Unsaved changes</span>
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                <Check className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Saved</span>
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
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }
}
