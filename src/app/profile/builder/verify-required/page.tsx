import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { requireUser } from '@/lib/guards'
import { resolveBuilderLocale } from '@/lib/actions/builder-locale'
import { BuilderI18nProvider } from '../i18n/BuilderI18nContext'
import { BUILDER_LOCALE_COOKIE } from '../i18n/dictionaries'
import { VerifyRequiredCard } from './VerifyRequiredCard'

export async function generateMetadata() {
  const cookieStore = await cookies()
  const isArabic = cookieStore.get(BUILDER_LOCALE_COOKIE)?.value === 'ar'
  return {
    title: isArabic
      ? 'تأكيد الإيميل مطلوب | PortfolioHub'
      : 'Email verification required | PortfolioHub',
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const first = local.charAt(0) || ''
  return `${first}***@${domain}`
}

export default async function VerifyRequiredPage() {
  const user = await requireUser()

  if (user.emailVerified) {
    redirect('/profile/builder')
  }

  const cookieStore = await cookies()
  const { locale, stored } = await resolveBuilderLocale(
    cookieStore.get(BUILDER_LOCALE_COOKIE)?.value,
  )

  return (
    <BuilderI18nProvider initialLocale={locale} hasStoredPreference={stored}>
      <VerifyRequiredCard maskedEmail={maskEmail(user.email)} />
    </BuilderI18nProvider>
  )
}
