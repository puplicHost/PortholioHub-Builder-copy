import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'
import { getAppUrl } from '@/lib/urls'
import { getUser } from '@/lib/guards'

export async function generateMetadata(): Promise<Metadata> {
  const base = getAppUrl()
  return {
    title: 'PortfolioHub — Build a professional portfolio in minutes',
    description: 'Build visually and publish on your own link, no code. Arabic and English.',
    alternates: {
      canonical: `${base}/en`,
      languages: { ar: base, en: `${base}/en`, 'x-default': base },
    },
    openGraph: {
      title: 'PortfolioHub',
      description: 'Build a professional portfolio in minutes.',
      url: `${base}/en`,
      siteName: 'PortfolioHub',
      type: 'website',
      images: [{ url: `${base}/og?title=PortfolioHub&subtitle=${encodeURIComponent('Build a professional portfolio in minutes')}`, width: 1200, height: 630 }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PortfolioHub',
      description: 'Build a professional portfolio in minutes.',
      images: [`${base}/og?title=PortfolioHub&subtitle=${encodeURIComponent('Build a professional portfolio in minutes')}`],
    },
  }
}

export default async function EnglishLandingPage() {
  // Logged-in visitors skip the marketing page and land in their builder.
  if (await getUser()) redirect('/profile/builder')

  return <LandingPage lang="en" />
}
