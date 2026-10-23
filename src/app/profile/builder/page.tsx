import { cookies } from 'next/headers'
import { getOrCreateProfile } from '@/lib/actions/portfolio'
import { BuilderClient } from './BuilderClient'
import { BuilderI18nProvider } from './i18n/BuilderI18nContext'
import { ConfirmProvider } from './ui/ConfirmModal'
import { BUILDER_LOCALE_COOKIE } from './i18n/dictionaries'
import { resolveBuilderLocale } from '@/lib/actions/builder-locale'
import { requireUser } from '@/lib/guards'
import { getSubscriptionState } from '@/lib/subscriptions'
import { getSetting } from '@/lib/settings'

export const metadata = {
  title: 'Portfolio Builder | PortfolioHub',
}

export default async function PortfolioBuilderPage() {
  const user = await requireUser()

  const [profile, sub, whatsapp, cookieStore] = await Promise.all([
    getOrCreateProfile(),
    getSubscriptionState(user.id).catch(() => null),
    getSetting('contact.whatsapp').catch(() => ''),
    cookies(),
  ])

  // Builder UI language is independent from the app language: cookie first,
  // then the per-user preference, then English.
  const { locale, stored } = await resolveBuilderLocale(
    cookieStore.get(BUILDER_LOCALE_COOKIE)?.value,
  )

  return (
    <BuilderI18nProvider initialLocale={locale} hasStoredPreference={stored}>
      <ConfirmProvider>
        <BuilderClient
          initialProfile={profile}
          initialSubscriptionState={sub?.state ?? 'NONE'}
          whatsappNumber={typeof whatsapp === 'string' ? whatsapp : ''}
        />
      </ConfirmProvider>
    </BuilderI18nProvider>
  )
}
