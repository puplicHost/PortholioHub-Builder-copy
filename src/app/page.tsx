import type { Metadata } from 'next'
import { LandingPage, type LandingSocial } from '@/components/landing/LandingPage'
import { getAppUrl } from '@/lib/urls'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { getPlatformName } from '@/lib/platform'

export async function generateMetadata(): Promise<Metadata> {
  const base = getAppUrl()
  return {
    title: 'PortfolioHub — ابنِ بروتفوليو احترافي في دقائق',
    description: 'ابنِ بروتفوليو بصريًا وانشر على رابطك الخاص، بدون كود. عربي وإنجليزي.',
    alternates: {
      canonical: base,
      languages: { ar: base, en: `${base}/en`, 'x-default': base },
    },
    openGraph: {
      title: 'PortfolioHub',
      description: 'ابنِ بروتفوليو احترافي في دقائق.',
      url: base,
      siteName: 'PortfolioHub',
      type: 'website',
      images: [{ url: `${base}/og?title=PortfolioHub&subtitle=${encodeURIComponent('ابني بورتفوليو احترافي بنفسك')}`, width: 1200, height: 630 }],
      locale: 'ar_EG',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PortfolioHub',
      description: 'ابنِ بروتفوليو احترافي في دقائق.',
      images: [`${base}/og?title=PortfolioHub&subtitle=${encodeURIComponent('ابني بورتفوليو احترافي بنفسك')}`],
    },
  }
}

// Server component: reads platform settings + active plan prices and passes
// them to the client landing shell as serializable props.
export default async function ArabicLandingPage() {
  const [name, plans, settings] = await Promise.all([
    getPlatformName().catch(() => 'PortfolioHub'),
    prisma.plan
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { priceEgp: true, durationDays: true },
      })
      .catch(() => [] as Array<{ priceEgp: number; durationDays: number | null }>),
    getSettings(['contact.whatsapp', 'contact.facebook', 'contact.instagram', 'contact.linkedin', 'contact.twitter'] as never[])
      .catch(() => ({} as Record<string, unknown>)),
  ])

  const monthly = plans.find((p) => (p.durationDays ?? 0) === 30)?.priceEgp
  const annual = plans.find((p) => (p.durationDays ?? 0) === 365)?.priceEgp
  const whatsapp = typeof settings['contact.whatsapp'] === 'string' ? (settings['contact.whatsapp'] as string) : ''

  const socials = ([
    { label: 'Facebook', href: settings['contact.facebook'] },
    { label: 'Instagram', href: settings['contact.instagram'] },
    { label: 'LinkedIn', href: settings['contact.linkedin'] },
    { label: 'X', href: settings['contact.twitter'] },
  ] as Array<{ label: string; href: unknown }>).filter(
    (s): s is LandingSocial => typeof s.href === 'string' && s.href.trim() !== '',
  )

  return (
    <LandingPage
      lang="ar"
      name={name}
      whatsapp={whatsapp}
      monthlyPrice={monthly ?? 150}
      annualPrice={annual ?? 1000}
      socials={socials}
    />
  )
}
