import { cookies } from 'next/headers'
import type { Lang } from './dictionary'
import { lookupPhrase } from './phrases'

const COOKIE_KEY = 'portfoliohub-lang'

/** Read the active language from the cookie (mirrored by the client provider). */
export async function getServerLang(): Promise<Lang> {
  try {
    const store = await cookies()
    return store.get(COOKIE_KEY)?.value === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

/** Pick the correct message variant for the active language. */
export function pick(lang: Lang, en: string, ar: string): string {
  return lang === 'ar' ? ar : en
}

/**
 * Build a translate function for server components/actions. Uses the same
 * English-source phrase map as the client, driven by the language cookie.
 */
export function makeServerT(lang: Lang) {
  return (source: string): string => (lang === 'ar' ? lookupPhrase(source) ?? source : source)
}
