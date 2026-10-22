import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Never rewrite/redirect static files (public/ assets like
  // /logo-mark.png, /hero.jpeg, /opengraph.png). Otherwise the subdomain
  // rewrite below turns them into /u/<host>/... and they 404 whenever the
  // Host header isn't exactly the base domain (127.0.0.1, LAN IP, alias).
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next()
  }

  const hostname = request.headers.get('host') || ''

  // Compare hosts without ports: dev often runs on a different port than
  // NEXT_PUBLIC_APP_URL (3001 vs 3000), and that must not trigger the
  // portfolio-subdomain rewrite (it turned every route into a 404).
  // localhost / 127.0.0.1 / ::1 are treated as the same local host.
  const hostOnly = hostname.split(':')[0].toLowerCase()
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const baseDomain = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : (isLocalhost ? 'localhost:3000' : 'portfolio-hub.online')
  const baseHostOnly = baseDomain.split(':')[0].toLowerCase()
  const isLocalHostOnly = (h: string) => h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]'
  const isBaseHost = hostOnly === baseHostOnly || (isLocalHostOnly(hostOnly) && isLocalHostOnly(baseHostOnly))

  // Extract subdomain if it exists and is not 'www' or the base domain itself
  if (!isBaseHost && hostOnly !== `www.${baseHostOnly}` && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const subdomain = hostOnly.replace(`.${baseHostOnly}`, '')
    const rewrittenPath = `/u/${subdomain}${pathname === '/' ? '' : pathname}`
    // Rewrite to /u/[subdomain]
    return withSecurityHeaders(
      NextResponse.rewrite(new URL(rewrittenPath, request.url)),
      rewrittenPath,
    )
  }

  return withSecurityHeaders(NextResponse.next(), pathname)
}

function withSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  // Baseline hardening. No script-src tightening here: Cloudinary and
  // Google Fonts must keep working (visual freeze); tighten to report-only
  // in a later pass after auditing every inline script.
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // X-Frame-Options: same-origin framing is granted only to the public
  // portfolio page (opt-in embedding). The builder preview is rendered inline
  // now, so it no longer needs a frame exception. Every other route keeps the
  // strict `DENY`.
  const frameable = pathname.startsWith('/u/')
  response.headers.set('X-Frame-Options', frameable ? 'SAMEORIGIN' : 'DENY')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
