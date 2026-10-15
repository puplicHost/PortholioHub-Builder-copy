'use client'

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { dictionaries, type Lang, type TranslationKey } from '@/lib/i18n/dictionary'
import { lookupPhrase } from '@/lib/i18n/phrases'

const STORAGE_KEY = 'portfoliohub-lang'

let currentLang: Lang = 'ar'
const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getSnapshot(): Lang {
  return currentLang
}

function getServerSnapshot(): Lang {
  return 'ar'
}

function applyDocumentLang(lang: Lang) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    // Mirror to a cookie so server actions / server components can read the
    // active language and localize their own messages.
    document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`
  }
}

function setExternalLang(lang: Lang) {
  currentLang = lang
  applyDocumentLang(lang)
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // storage unavailable — keep in-memory only
  }
  listeners.forEach((listener) => listener())
}

interface I18nContextValue {
  lang: Lang
  dir: 'ltr' | 'rtl'
  t: (input: string, vars?: Record<string, string | number>) => string
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      stored = null
    }
    const initial = stored === 'en' ? 'en' : 'ar'
    setExternalLang(initial)
  }, [])

  const setLang = useCallback((next: Lang) => {
    setExternalLang(next)
  }, [])

  const t = useCallback(
    (input: string, vars?: Record<string, string | number>) => {
      // 1) Named dictionary keys (landing/auth pages) take precedence.
      let out: string = dictionaries[lang][input as TranslationKey] ?? input
      if (out === input && lang === 'ar') {
        // 2) English-source phrase map for the dashboard/admin.
        out = lookupPhrase(input) ?? input
      }
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          out = out.replaceAll(`{${name}}`, String(value))
        }
      }
      return out
    },
    [lang],
  )

  return (
    <I18nContext.Provider value={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', t, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/**
 * Non-hook translation for module-scope callbacks (e.g. dynamic() loading
 * placeholders) where hooks are not allowed. Reads the current language
 * directly; not reactive — fine for transient loading UI.
 */
export function tStatic(input: string): string {
  if (currentLang !== 'ar') return input
  const keyed = dictionaries.ar[input as TranslationKey]
  return keyed ?? lookupPhrase(input) ?? input
}
