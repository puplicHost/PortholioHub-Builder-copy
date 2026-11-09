/**
 * Phase 1 design-system regression tests.
 *
 * Guards four invariants from the Phase 1 color-system work:
 *   1. App-shell semantic tokens meet WCAG AA contrast in light + dark mode.
 *   2. The customer portfolio token family stays isolated from globals.css
 *      (appearance-driven colors must never be overridden by app tokens).
 *   3. The default-only portfolio palette fix is consistent across all four
 *      definition sites (template fallback, project page fallback, creation
 *      defaults, builder reset button).
 *   4. RTL direction-sensitive utilities were migrated to logical ones.
 *
 * Contrast ratios are recomputed at test time (WCAG 2.2 relative luminance),
 * so any future token drift that breaks AA fails here.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateProfileExtras } from '@/lib/portfolio-schema'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

const globals = read('src/app/globals.css')

/** WCAG 2.2 relative luminance for a 3/6/8-digit hex color. */
function luminance(hex: string): number {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** WCAG 2.2 contrast ratio between two hex colors. */
function ratio(fg: string, bg: string): number {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

const AA_TEXT = 4.5

describe('light-theme app shell tokens', () => {
  it('muted/secondary text passes AA on white and the page background', () => {
    expect(ratio('#6b6b70', '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#6b6b70', '#f5f5f7')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(globals).toContain('--ph-gray-text: #6b6b70')
    expect(globals).toContain('--color-text-muted: #6b6b70')
    expect(globals).not.toContain('--ph-gray-text: #7a7a7a')
  })

  it('semantic fills keep white labels readable (button/toast fills)', () => {
    expect(globals).toContain('--color-success: #15803D')
    expect(globals).toContain('--color-warning: #b45309')
    expect(globals).toContain('--color-danger: #DC2626')
    expect(ratio('#ffffff', '#15803d')).toBeGreaterThanOrEqual(AA_TEXT) // success
    expect(ratio('#ffffff', '#b45309')).toBeGreaterThanOrEqual(AA_TEXT) // warning
    expect(ratio('#ffffff', '#dc2626')).toBeGreaterThanOrEqual(AA_TEXT) // danger
    expect(ratio('#ffffff', '#0066cc')).toBeGreaterThanOrEqual(AA_TEXT) // primary (unchanged brand)
  })

  it('defines light on-color tokens for all semantic fills', () => {
    expect(globals).toContain('--on-primary: #ffffff')
    expect(globals).toContain('--on-success: #ffffff')
    expect(globals).toContain('--on-warning: #ffffff')
    expect(globals).toContain('--on-danger: #ffffff')
  })

  it('solid toast fills pass AA in light mode', () => {
    expect(globals).toContain('--color-toast-success-bg: #15803d')
    expect(globals).toContain('--color-toast-warning-bg: #b45309')
    expect(globals).toContain('--color-toast-error-bg: #dc2626')
  })
})

describe('dark-theme app shell tokens', () => {
  it('keeps the bright dark fills (visual identity unchanged)', () => {
    expect(globals).toContain('--color-success: #4ADE80')
    expect(globals).toContain('--color-warning: #EFA820')
    expect(globals).toContain('--color-danger: #F87171')
    expect(globals).toContain('--color-primary: #2997ff')
  })

  it('on-color labels become dark ink on the bright fills (white failed 1.74–3.02:1)', () => {
    expect(globals).toContain('--on-primary: #0e0e10')
    expect(globals).toContain('--on-success: #052e16')
    expect(globals).toContain('--on-warning: #1f1f23')
    expect(globals).toContain('--on-danger: #1f1f23')
    expect(ratio('#0e0e10', '#2997ff')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#052e16', '#4ade80')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#1f1f23', '#EFA820')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#1f1f23', '#F87171')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#0e0e10', '#4aa3ff')).toBeGreaterThanOrEqual(AA_TEXT) // hover fill
  })

  it('dark text tokens still pass AA on the dark page background', () => {
    expect(ratio('#f5f5f7', '#0e0e10')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#a1a1a6', '#0e0e10')).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe('landing page system', () => {
  it('light mode uses the AA-passing muted ink and white on-primary labels', () => {
    expect(globals).toContain('--ink-muted: #6b6b70')
    expect(ratio('#6b6b70', '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#6b6b70', '#f5f5f7')).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('dark mode switches on-primary labels from white (3.02:1) to dark ink', () => {
    const lightBlock = globals.slice(globals.indexOf('.landing-page {'), globals.indexOf(".landing-page[data-theme='dark']"))
    const darkBlock = globals.slice(globals.indexOf(".landing-page[data-theme='dark']"), globals.indexOf(".landing-page[lang='ar']"))
    expect(lightBlock).toContain('--on-primary: #ffffff')
    expect(darkBlock).toContain('--on-primary: #0e0e10')
    expect(ratio('#0e0e10', '#2997ff')).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe('customer appearance isolation', () => {
  it('globals.css never defines the portfolio token family', () => {
    // The template-scoped family: --color-bg / --color-text / --color-muted /
    // --color-on-* are resolved per-profile inside ClassicTemplate and
    // ProjectPageView. Defining any of them globally could alter published
    // portfolios, so their absence here is a hard invariant.
    expect(globals).not.toMatch(/--color-bg\s*:/)
    expect(globals).not.toMatch(/--color-text\s*:/)
    expect(globals).not.toMatch(/--color-muted\s*:/)
    expect(globals).not.toMatch(/--color-on-primary\s*:/)
    expect(globals).not.toContain('.template-root')
  })

  it('public templates still own their on-primary token', () => {
    const template = read('src/components/portfolio/templates/ClassicTemplate.tsx')
    const projectPage = read('src/app/u/[username]/projects/[slug]/ProjectPageView.tsx')
    expect(template).toContain("'--color-on-primary': onPrimary")
    expect(projectPage).toMatch(/'--color-on-primary'/)
  })

  it('validateProfileExtras preserves legacy saved colors verbatim', () => {
    const legacyAppearance = {
      colorMode: 'dark',
      theme: 'classic-dark',
      font: 'cairo',
      primaryColor: '#38BDF8',
      accentColor: '#818CF8',
      bgColorLight: '#F0F9FF',
      bgColorDark: '#111827',
      mutedText: '#64748B', // old default saved by real profiles
      borderColor: '#BAE6FD',
      unknownFutureField: '#ff00ff', // tolerated via catchall
    }
    const out = validateProfileExtras({ appearance: legacyAppearance })
    expect(out.appearance).toEqual(legacyAppearance)
  })
})

describe('default-only palette fix (category B) is consistent', () => {
  const sites = [
    'src/components/portfolio/templates/ClassicTemplate.tsx',
    'src/app/u/[username]/projects/[slug]/ProjectPageView.tsx',
    'src/lib/actions/portfolio.ts',
    'src/app/profile/builder/ThemeSettings.tsx',
  ]

  it('uses the same new default muted value in all four definition sites', () => {
    for (const file of sites) {
      expect(read(file), file).toContain('#54647A')
    }
  })

  it('removes the old marginally-failing default everywhere (4.46:1)', () => {
    for (const file of sites) {
      expect(read(file), file).not.toMatch(/'#64748B'/)
    }
    expect(ratio('#54647A', '#F0F9FF')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#54647A', '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT)
    expect(ratio('#858688', '#111827')).toBeGreaterThanOrEqual(AA_TEXT) // dark default unaffected
  })
})

describe('RTL / logical-property migration', () => {
  it('builder mode toggles use margin-inline-start, not physical margins', () => {
    const theme = read('src/app/profile/builder/ThemeSettings.tsx')
    expect(theme).not.toMatch(/mr-1\.5/)
    expect(theme.match(/ms-1\.5/g)?.length).toBe(6)
  })

  it('analytics tables and inputs use logical padding and alignment', () => {
    const views = read('src/components/portfolio/analytics/ProjectViews.tsx')
    expect(views).toContain('ps-9 pe-4')
    expect(views).not.toMatch(/pl-9/)
    expect(views).not.toMatch(/text-left/)
    const chart = read('src/components/portfolio/analytics/ViewsChart.tsx')
    expect(chart).toContain('ps-10 pe-2')
    expect(chart).not.toMatch(/pl-10/)
    expect(chart).not.toMatch(/text-left/)
  })
})

describe('toast component uses tokens, not hardcoded fills', () => {
  const toast = read('src/components/ui/Toast.tsx')

  it('resolves solid fills from global tokens', () => {
    expect(toast).toContain('var(--color-toast-success-bg)')
    expect(toast).toContain('var(--color-toast-warning-bg)')
    expect(toast).toContain('var(--color-toast-error-bg)')
  })

  it('no hardcoded green/amber fills or blanket white text remain', () => {
    expect(toast).not.toContain('#16a34a')
    expect(toast).not.toContain('#d97706')
    expect(toast).not.toContain('text-white')
  })
})

describe('admin/shared components migrated to on-color tokens', () => {
  const cases: Array<[string, RegExp]> = [
    ['src/components/ui/Button.tsx', /text-\[var\(--on-primary\)\]/],
    ['src/app/not-found.tsx', /text-\[var\(--on-primary\)\]/],
    ['src/app/admin/page.tsx', /bg-\[var\(--color-warning\)\] text-\[var\(--on-warning\)\]/],
    ['src/components/admin/AdminLayoutShell.tsx', /text-\[var\(--on-warning\)\]/],
    ['src/components/notifications/NotificationBell.tsx', /text-\[var\(--on-danger\)\]/],
    ['src/components/portfolio/analytics/AnalyticsDashboard.tsx', /bg-\[var\(--color-primary\)/],
  ]

  it.each(cases)('%s uses semantic on-colors on semantic fills', (file, re) => {
    expect(read(file), file).toMatch(re)
  })

  it('no text-white remains directly on token semantic fills outside templates', () => {
    const subject = read('src/app/admin/page.tsx')
    expect(subject).not.toMatch(/bg-\[var\(--color-warning\)\] text-white/)
    expect(subject).not.toMatch(/bg-\[var\(--color-primary\)\] text-white/)
    expect(subject).not.toMatch(/bg-\[var\(--color-danger\)\] text-white/)
  })

  it('marketing pages keep their identity but adopt the AA muted ink', () => {
    const home = read('src/components/home/HomePage.tsx')
    expect(home).toContain('--text-muted:#6b6b70')
    expect(home).toContain('--warning:#b45309')
  })
})
