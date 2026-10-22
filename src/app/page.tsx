import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { HomePage } from '@/components/home/HomePage'
import { getAppUrl } from '@/lib/urls'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { getPlatformName } from '@/lib/platform'
import { getUser } from '@/lib/guards'

export async function generateMetadata(): Promise<Metadata> {
  const base = getAppUrl()
  return {
    title: 'PortfolioHub — ابنِ بورتفوليو احترافي في دقائق',
    description: 'بيلدر بورتفوليو بالعربي بالسحب والإفلات — من غير كود، من غير ديزاينر. انشر بورتفوليو على لينك واحد في دقائق.',
    alternates: {
      canonical: base,
      languages: { ar: base, en: `${base}/en`, 'x-default': base },
    },
    icons: {
      icon: [
        { url: '/favicon.png', type: 'image/png' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      shortcut: '/favicon.ico',
    },
    openGraph: {
      title: 'PortfolioHub',
      description: 'بورتفوليو احترافي بالعربي تعمله بنفسك — جاهز في دقائق.',
      url: base,
      siteName: 'PortfolioHub',
      type: 'website',
      images: [{ url: `${base}/og?title=PortfolioHub&subtitle=${encodeURIComponent('بورتفوليو احترافي تعمله بنفسك')}`, width: 1200, height: 630 }],
      locale: 'ar_EG',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PortfolioHub',
      description: 'بورتفوليو احترافي بالعربي تعمله بنفسك — جاهز في دقائق.',
      images: [`${base}/og?title=PortfolioHub&subtitle=${encodeURIComponent('بورتفوليو احترافي تعمله بنفسك')}`],
    },
  }
}

export default async function ArabicLandingPage() {
  if (await getUser()) redirect('/profile/builder')

  const [name, plans, settings] = await Promise.all([
    getPlatformName().catch(() => 'PortfolioHub'),
    prisma.plan
      .findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { priceEgp: true, durationDays: true },
      })
      .catch(() => [] as Array<{ priceEgp: number; durationDays: number | null }>),
    getSettings(['contact.whatsapp'] as never[])
      .catch(() => ({} as Record<string, unknown>)),
  ])

  const monthly = plans.find((p) => (p.durationDays ?? 0) === 30)?.priceEgp
  const annual = plans.find((p) => (p.durationDays ?? 0) === 365)?.priceEgp
  const whatsapp = typeof settings['contact.whatsapp'] === 'string' ? (settings['contact.whatsapp'] as string) : ''

  return (
    <HomePage
      name={name}
      whatsapp={whatsapp}
      monthlyPrice={monthly ?? 150}
      annualPrice={annual ?? 1000}
    />
  )
}
