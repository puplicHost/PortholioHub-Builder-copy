import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { dictionaries, type Lang, type TranslationKey } from '@/lib/i18n/dictionary'
import { getPlatformName } from '@/lib/platform'
import { getAppUrl } from '@/lib/urls'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export interface PublicPlan {
  id: string
  name: unknown
  priceEgp: number
  durationDays: number | null
}

// Server-rendered landing (works without JS). Real features and live
// plans only — no fake numbers, testimonials, or screenshots.
export async function LandingPage({ lang }: { lang: Lang }) {
  const t = (key: TranslationKey): string => dictionaries[lang][key] ?? key
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const name = await getPlatformName().catch(() => 'PortfolioHub')

  const plans = await prisma.plan
    .findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, nameI18n: true, priceEgp: true, durationDays: true },
    })
    .catch(() => [])

  const planName = (p: (typeof plans)[number]): string => {
    const i18n = (p.nameI18n ?? {}) as Record<string, unknown>
    const localized = i18n[lang]
    if (typeof localized === 'string' && localized) return localized
    return typeof p.name === 'string' ? p.name : p.id
  }

  const features = [
    { title: t('landing.f1t'), body: t('landing.f1d') },
    { title: t('landing.f2t'), body: t('landing.f2d') },
    { title: t('landing.f3t'), body: t('landing.f3d') },
    { title: t('landing.f4t'), body: t('landing.f4d') },
  ]
  const steps = [
    { title: t('landing.s1t'), body: t('landing.s1d') },
    { title: t('landing.s2t'), body: t('landing.s2d') },
    { title: t('landing.s3t'), body: t('landing.s3d') },
  ]
  const faq = [
    { q: t('landing.q1'), a: t('landing.a1') },
    { q: t('landing.q2'), a: t('landing.a2') },
    { q: t('landing.q3'), a: t('landing.a3') },
    { q: t('landing.q4'), a: t('landing.a4') },
  ]

  return (
    <div dir={dir} className="min-h-screen bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <header className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-black text-[var(--color-primary)]">{name}</span>
        <div className="flex items-center gap-3">
          <Link
            href={lang === 'ar' ? '/en' : '/'}
            className="text-xs font-medium text-[var(--color-text-secondary)] hover:underline"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </Link>
          <Link href="/login">
            <Button variant="secondary">{lang === 'ar' ? 'تسجيل الدخول' : 'Log in'}</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 space-y-16">
        <section className="pt-12 text-center space-y-5">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">{t('landing.heroTitle')}</h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">{t('landing.heroSubtitle')}</p>
          <div className="flex justify-center gap-3">
            <Link href="/register">
              <Button variant="primary">{t('landing.startBuilding')}</Button>
            </Link>
            <a href="#plans">
              <Button variant="secondary">{t('landing.viewPlans')}</Button>
            </a>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-bold text-center">{t('landing.featuresTitle')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {features.map((f) => (
              <Card key={f.title} className="p-4 space-y-1">
                <p className="font-bold text-sm">{f.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-bold text-center">{t('landing.howTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {steps.map((s, i) => (
              <Card key={s.title} className="p-4 space-y-1">
                <p className="text-xs font-bold text-[var(--color-primary)]">{i + 1}</p>
                <p className="font-bold text-sm">{s.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="plans" className="space-y-5">
          <h2 className="text-2xl font-bold text-center">{t('landing.plansTitle')}</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-center text-[var(--color-text-muted)]">{t('landing.noPlans')}</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-4 space-y-1">
                  <p className="font-bold text-sm">{planName(plan)}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {plan.priceEgp} EGP · {plan.durationDays || 30} days
                  </p>
                  <Link href="/register">
                    <Button variant="secondary">{t('landing.startBuilding')}</Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-center">{t('landing.faqTitle')}</h2>
          {faq.map((item) => (
            <Card key={item.q} className="p-4 space-y-1">
              <p className="font-bold text-sm">{item.q}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{item.a}</p>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-text-muted)]">
        {t('landing.footerNote')} · {getAppUrl()}
      </footer>
    </div>
  )
}
