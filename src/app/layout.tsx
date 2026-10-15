import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ToastProvider, Toaster } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { PlatformProvider } from '@/components/PlatformProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { getPlatformName } from '@/lib/platform'
import { getServerLang } from '@/lib/i18n/server'
import { getAppUrl } from '@/lib/urls'
import './globals.css'

export const dynamic = 'force-dynamic'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

export async function generateMetadata(): Promise<Metadata> {
  const name = await getPlatformName()
  const tagline = 'Build your professional portfolio'
  const title = `${name} — ${tagline}`
  const description = 'منصة البورتفوليو وتنظيم الشغل للفريلانسر المصري'

  return {
    metadataBase: new URL(getAppUrl()),
    title: {
      default: title,
      template: `%s | ${name}`,
    },
    description,
    openGraph: {
      title,
      description,
      url: getAppUrl(),
      siteName: name,
      type: 'website',
      images: '/opengraph.png',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: '/opengraph.png',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const platformName = await getPlatformName()
  const initialLang = await getServerLang()
  const initialDir = initialLang === 'ar' ? 'rtl' : 'ltr'

  return (
    <html
      lang={initialLang}
      dir={initialDir}
      className={`${inter.variable} ${display.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem('portfoliohub-lang');if(l==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr';document.cookie='portfoliohub-lang=en; path=/; max-age=31536000; samesite=lax'}else{document.documentElement.lang='ar';document.documentElement.dir='rtl';document.cookie='portfoliohub-lang=ar; path=/; max-age=31536000; samesite=lax'}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--color-page)] text-[var(--color-text-primary)] font-sans">
        <ThemeProvider>
          <ToastProvider position="top-center" visibleToasts={1} duration={3000}>
            <Toaster position="top-center" visibleToasts={1} duration={3000} />
            <ErrorBoundary>
              <I18nProvider>
                <PlatformProvider name={platformName}>{children}</PlatformProvider>
              </I18nProvider>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
