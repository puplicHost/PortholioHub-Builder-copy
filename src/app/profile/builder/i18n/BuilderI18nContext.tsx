'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useToast } from '@/components/ui/Toast'
import {
  BUILDER_LOCALE_COOKIE,
  builderDir,
  isBuilderLocale,
  translate,
  type BuilderDir,
  type BuilderLocale,
} from './dictionaries'
import { setBuilderLocale as persistBuilderLocale } from '@/lib/actions/builder-locale'

export interface BuilderI18nContextValue {
  locale: BuilderLocale
  dir: BuilderDir
  t: (key: string, vars?: Record<string, string | number>) => string
  setLocale: (next: BuilderLocale) => void
  toggleLocale: () => void
}

const BuilderI18nContext = createContext<BuilderI18nContextValue | null>(null)

function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function getStoredLocale(): string | null {
  try {
    return window.localStorage.getItem(BUILDER_LOCALE_COOKIE)
  } catch {
    return null
  }
}

// Hydration always starts from the server-resolved locale; the stored value is
// applied by useSyncExternalStore after hydration (no effect, no mismatch).
function getServerStoredLocale(): null {
  return null
}

export function BuilderI18nProvider({
  initialLocale,
  hasStoredPreference = false,
  children,
}: {
  initialLocale: BuilderLocale
  hasStoredPreference?: boolean
  children: ReactNode
}) {
  // Explicit choice in this session (cookie/localStorage/DB are its mirrors).
  const [selected, setSelected] = useState<BuilderLocale | null>(null)
  const stored = useSyncExternalStore(
    subscribeToStorage,
    getStoredLocale,
    getServerStoredLocale,
  )
  const locale: BuilderLocale =
    selected ??
    (hasStoredPreference ? initialLocale : isBuilderLocale(stored) ? stored : initialLocale)
  const { setDir } = useToast()

  const dir = builderDir(locale)

  // Toasts live at the root layout (outside the builder), so push the builder
  // direction into the shared toaster while mounted and restore the app
  // default (LTR) on unmount — RTL must never leak onto public pages.
  useEffect(() => {
    setDir(dir)
    return () => setDir('ltr')
  }, [dir, setDir])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )

  const setLocale = useCallback((next: BuilderLocale) => {
    setSelected(next)
    try {
      window.localStorage.setItem(BUILDER_LOCALE_COOKIE, next)
    } catch {
      // storage unavailable — cookie still persists the choice
    }
    document.cookie = `${BUILDER_LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    // Cross-device sync is best-effort: never block the UI on it.
    void persistBuilderLocale(next).catch(() => {})
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar')
  }, [locale, setLocale])

  const value = useMemo(
    () => ({ locale, dir, t, setLocale, toggleLocale }),
    [locale, dir, t, setLocale, toggleLocale],
  )

  return <BuilderI18nContext.Provider value={value}>{children}</BuilderI18nContext.Provider>
}

export function useBuilderI18n(): BuilderI18nContextValue {
  const ctx = useContext(BuilderI18nContext)
  if (!ctx) throw new Error('useBuilderI18n must be used within BuilderI18nProvider')
  return ctx
}
