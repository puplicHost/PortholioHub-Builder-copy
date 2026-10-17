import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'
import { getAppUrl } from '@/lib/urls'

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

export default async function ArabicLandingPage() {
  return <LandingPage lang="ar" />
}
