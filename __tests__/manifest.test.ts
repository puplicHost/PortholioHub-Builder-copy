import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { ROUTES_MANIFEST } from '@/routes.manifest'

const APP_DIR = path.resolve(__dirname, '../src/app')

function discoverRoutes(dir: string, base: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...discoverRoutes(full, `${base}/${entry.name}`))
    } else if (entry.name === 'route.ts') {
      out.push(base || '/')
    } else if (entry.name === 'page.tsx') {
      out.push(base || '/')
    } else if (entry.name === 'sitemap.ts') {
      out.push('/sitemap.xml')
    } else if (entry.name === 'robots.ts') {
      out.push('/robots.txt')
    }
  }
  return out
}

describe('routes manifest (plan Phase 1 §33)', () => {
  it('declares every route file exactly once', () => {
    const discovered = discoverRoutes(APP_DIR, '').sort()
    const declared = ROUTES_MANIFEST.map((r) => r.path).sort()
    const missing = discovered.filter((d) => !declared.includes(d))
    const extra = declared.filter((d) => !discovered.includes(d))
    expect({ missing, extra }).toEqual({ missing: [], extra: [] })
  })

  it('has no duplicate paths', () => {
    const paths = ROUTES_MANIFEST.map((r) => r.path)
    expect(new Set(paths).size).toBe(paths.length)
  })
})
