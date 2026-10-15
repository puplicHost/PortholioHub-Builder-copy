import { getAppUrl } from '@/lib/urls'

// Same-origin check for mutating API routes (plan Phase 1 §20).
// Compares Origin against the request's OWN Host header, so legitimate
// traffic is never rejected because of configured-URL/port drift
// (dev on :3001, 127.0.0.1, preview deployments).
// Falls back to APP_URL only when no Host header is present (stripping
// proxies — rare); if neither source exists, the request is rejected.
// Requests without Origin (curl/server-to-server/cron) pass: CSRF is a
// browser-cookie attack and such clients carry no cookies to steal.
// NOTE: no Sec-Fetch-Site branch — it was dead weight (decided nothing
// whenever Origin was present, trusted a spoofable header when absent).
export function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true

  let originHost: string
  try {
    originHost = new URL(origin).host.toLowerCase()
  } catch {
    return false
  }

  const requestHost = req.headers.get('host')?.toLowerCase()
  const expected = requestHost || safeAppHost()
  if (!expected) return false
  return originHost === expected
}

function safeAppHost(): string | null {
  try {
    return new URL(getAppUrl()).host.toLowerCase()
  } catch {
    return null
  }
}
