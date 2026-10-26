/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, X, Check } from 'lucide-react'
import { PORTFOLIO_ICONS, PORTFOLIO_ICON_MAP } from '@/lib/portfolio-icons'
import { useBuilderI18n } from '../i18n/BuilderI18nContext'

export interface IconPickerProps {
  value?: string | null
  onChange: (key: string | undefined) => void
  className?: string
}

export function IconPicker({ value, onChange, className = '' }: IconPickerProps) {
  const { t, locale } = useBuilderI18n()
  const isAr = locale === 'ar'
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Resolve current active icon
  const currentKey = value ? value.toLowerCase().trim() : ''
  const currentClean = currentKey.replace(/[^a-z0-9]/g, '')
  const CurrentIcon = currentKey ? (PORTFOLIO_ICON_MAP[currentClean] || PORTFOLIO_ICON_MAP[currentKey]) : null
  const currentDefinition = useMemo(() => {
    if (!currentKey) return null
    return PORTFOLIO_ICONS.find(
      (item) => item.key.toLowerCase() === currentKey || item.key.toLowerCase().replace(/[^a-z0-9]/g, '') === currentClean
    ) || null
  }, [currentKey, currentClean])

  const noIconLabel = isAr ? 'بدون أيقونة' : 'No icon'
  const searchPlaceholder = isAr ? 'بحث عن أيقونة...' : 'Search icons...'

  // Close on click outside or Escape
  useEffect(() => {
    if (!open) return
    const handleDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // Focus search input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearch('')
    }
  }, [open])

  // Filtered icons — deduplicated by key
  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase()
    const seen = new Set<string>()
    const deduped: typeof PORTFOLIO_ICONS = []
    for (const item of PORTFOLIO_ICONS) {
      const k = item.key.toLowerCase().trim()
      if (!seen.has(k)) {
        seen.add(k)
        deduped.push(item)
      }
    }

    if (!q) return deduped
    const normQ = q.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    return deduped.filter((item) => {
      const k = item.key.toLowerCase()
      const n = item.name.toLowerCase()
      const na = item.nameAr.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      const cat = item.category.toLowerCase()
      return k.includes(normQ) || n.includes(normQ) || na.includes(normQ) || cat.includes(normQ)
    })
  }, [search])

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-[42px] min-h-[42px] w-full items-center justify-between gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-start text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-primary)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {CurrentIcon ? (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <CurrentIcon className="h-4 w-4" aria-hidden="true" />
            </div>
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          )}
          <span className="truncate">
            {currentDefinition
              ? (isAr ? currentDefinition.nameAr : currentDefinition.name)
              : (currentKey ? currentKey : noIconLabel)}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Popover */}
      {open && (
        <div
          role="dialog"
          aria-label={t('field.sectionIcon') || 'Icons'}
          className="absolute z-50 mt-1.5 w-full min-w-[280px] sm:min-w-[340px] max-w-[380px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          style={{ [isAr ? 'right' : 'left']: 0 }}
        >
          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-2.5 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] pe-8 ps-8 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute top-1/2 -translate-y-1/2 end-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-0.5 cursor-pointer"
                title={isAr ? 'مسح' : 'Clear'}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick No-Icon Action */}
          <div className="mb-2 pb-2 border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => {
                onChange(undefined)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                !currentKey
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-[var(--color-border)]">
                  <X className="h-3 w-3" />
                </span>
                <span>{noIconLabel}</span>
              </div>
              {!currentKey && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Scrollable Icon Grid */}
          <div className="max-h-56 overflow-y-auto p-0.5 scrollbar-thin">
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-1">
                {filteredIcons.map(({ key, name, nameAr, category, icon: Icon }) => {
                  const isSelected = currentKey === key.toLowerCase()
                  const title = `${name} (${nameAr})`
                  const uniqueKey = `${category}-${key}`
                  return (
                    <button
                      key={uniqueKey}
                      type="button"
                      onClick={() => {
                        onChange(isSelected ? undefined : key)
                        setOpen(false)
                      }}
                      title={title}
                      aria-label={title}
                      aria-pressed={isSelected}
                      className={`group flex h-9 w-9 items-center justify-center rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm'
                          : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-[var(--color-text-muted)]">
                {isAr ? 'لم يتم العثور على أيقونات مطابقة' : 'No matching icons found'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
