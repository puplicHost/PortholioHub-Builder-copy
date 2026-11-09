import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Second-template (Editorial Marketing) — resolver, entitlement guard and the
// updatePortfolio save choke point. Pure node tests (no browser renderer) so
// they run in the project's vitest node environment.
// ─────────────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const tx = {
    userProfile: {
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
    profilePage: { findFirst: vi.fn() },
    pageSection: { findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    projectPage: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
    projectItem: { deleteMany: vi.fn(), createMany: vi.fn() },
  }
  const prisma = {
    userProfile: { findUnique: vi.fn() },
    $transaction: vi.fn(async (fn: (client: unknown) => Promise<unknown>) => fn(tx)),
  }
  return { tx, prisma }
})

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn(async () => ({ id: 'user-1' })) }))
vi.mock('@/lib/workspaces', () => ({ ensurePersonalWorkspace: vi.fn() }))
vi.mock('@/lib/subscriptions', () => ({
  getSubscriptionState: vi.fn(async () => ({ state: 'ACTIVE' })),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server', () => ({ after: (fn: () => void) => fn() }))

import { updatePortfolio } from '@/lib/actions/portfolio'
import { getEntitlements, canUseTemplate, isProTemplate } from '@/lib/entitlements'
import { DEFAULT_TEMPLATE_ID, EDITORIAL_TEMPLATE_ID, resolveTemplateId, resolveTemplateFromAppearance } from '@/lib/templates'
import { validateProfileExtras } from '@/lib/portfolio-schema'

// Subscription state used by updatePortfolio / getEntitlements. Rewritable
// per test through the mocked module above; typed loosely for brevity.
const subState = await import('@/lib/subscriptions')
const setSubState = (state: string, reject = false) =>
  (subState.getSubscriptionState as ReturnType<typeof vi.fn>).mockImplementation(
    reject ? vi.fn(async () => { throw new Error('DB down') }) : vi.fn(async () => ({ state })),
  )

beforeEach(() => {
  vi.clearAllMocks()
  mocks.prisma.userProfile.findUnique.mockResolvedValue({
    id: 'profile-1',
    username: 'tester',
    version: 1,
  })
  mocks.prisma.$transaction.mockImplementation(
    async (fn: (client: unknown) => Promise<unknown>) => fn(mocks.tx),
  )
  setSubState('ACTIVE')
})

describe('template identity resolver', () => {
  it('falls back to classic for missing or unknown values', () => {
    expect(resolveTemplateId(undefined)).toBe('classic')
    expect(resolveTemplateId(null)).toBe('classic')
    expect(resolveTemplateId('')).toBe('classic')
    expect(resolveTemplateId('Editorial Marketing Template X')).toBe('classic')
    expect(resolveTemplateId('  ')).toBe('classic')
    expect(resolveTemplateId(42)).toBe('classic')
  })

  it('resolves the editorial alias family case-insensitively', () => {
    expect(resolveTemplateId('editorial-marketing')).toBe('editorial-marketing')
    expect(resolveTemplateId('Editorial-Marketing')).toBe('editorial-marketing')
    expect(resolveTemplateId('editorialmarketing')).toBe('editorial-marketing')
    expect(resolveTemplateId('EDITORIAL')).toBe('editorial-marketing')
  })

  it('resolves the saved appearance key and keeps classic as default', () => {
    expect(resolveTemplateFromAppearance(undefined)).toBe('classic')
    expect(resolveTemplateFromAppearance({})).toBe('classic')
    expect(resolveTemplateFromAppearance({ template: 'unknown-junk' })).toBe('classic')
    expect(resolveTemplateFromAppearance({ template: 'editorial-marketing' })).toBe('editorial-marketing')
    expect(resolveTemplateFromAppearance({ template: null })).toBe('classic')
  })

  it('treats legacy color themes as Classic (never a hidden template switch)', () => {
    // `theme: 'warm'` is a live Classic color theme; it must not silently
    // change an existing customer's public layout.
    expect(resolveTemplateFromAppearance({ theme: 'warm' })).toBe('classic')
    expect(resolveTemplateFromAppearance({ theme: 'dark' })).toBe('classic')
    expect(resolveTemplateFromAppearance({ theme: 'warm', template: 'classic' })).toBe('classic')
  })
})

describe('Pro-only template entitlement', () => {
  it('allows classic for every plan', () => {
    expect(canUseTemplate({ state: 'NONE', isFree: true }, 'classic')).toBe(true)
    expect(canUseTemplate({ state: 'ACTIVE', isFree: false }, 'classic')).toBe(true)
    expect(canUseTemplate({ state: 'NONE', isFree: true }, 'definitely-not-a-template')).toBe(true)
  })

  it('allows editorial only for paid states', () => {
    expect(canUseTemplate({ state: 'ACTIVE', isFree: false }, 'editorial-marketing')).toBe(true)
    expect(canUseTemplate({ state: 'GRACE', isFree: false }, 'editorial-marketing')).toBe(true)
    expect(canUseTemplate({ state: 'NONE', isFree: true }, 'editorial-marketing')).toBe(false)
    expect(canUseTemplate({ state: 'EXPIRED', isFree: true }, 'editorial-marketing')).toBe(false)
  })

  it('flags only the editorial family as Pro', () => {
    expect(isProTemplate('editorial')).toBe(true)
    expect(isProTemplate('editorial-marketing')).toBe(true)
    expect(isProTemplate('classic')).toBe(false)
    expect(isProTemplate('warm-but-typo-free')).toBe(false)
  })

  it('propagates subscription lookup failures instead of granting or revoking silently', async () => {
    setSubState('ACTIVE', true)
    await expect(getEntitlements('user-1')).rejects.toThrow('DB down')
  })
})

describe('appearance schema template key hygiene', () => {
  it('keeps accepted template ids', () => {
    const out = validateProfileExtras({
      appearance: { defaultColorMode: 'light', template: 'editorial-marketing' },
    })
    expect((out.appearance as Record<string, unknown>)['template']).toBe('editorial-marketing')
  })

  it('drops crafted/invalid template strings so no junk key is stored', () => {
    const out = validateProfileExtras({
      appearance: { defaultColorMode: 'light', template: '<script>alert(1)</script>' },
    })
    expect((out.appearance as Record<string, unknown>)['template']).toBeUndefined()
    // Everything else still passes through for legacy safety.
    expect((out.appearance as Record<string, unknown>)['defaultColorMode']).toBe('light')
  })
})

describe('updatePortfolio template guard (server-side enforcement)', () => {
  const saveAppearance = async (template: unknown, sub = 'ACTIVE') => {
    setSubState(sub)
    const appearance: Record<string, unknown> = { defaultColorMode: 'light', accentColor: '#8b5cf6' }
    if (template !== undefined) appearance.template = template
    return updatePortfolio({ id: 'profile-1', appearance })
  }

  it('rejects a Free plan selecting the editorial template — nothing is written', async () => {
    const res = await saveAppearance('editorial-marketing', 'NONE')
    expect(res.success).toBe(false)
    expect((res as { code?: string }).code).toBe('PRO_TEMPLATE_REQUIRED')
    expect(String((res as { error?: string }).error).toLowerCase()).toContain('pro')
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
    expect(mocks.tx.userProfile.update).not.toHaveBeenCalled()
  })

  it('rejects crafted casing bypass attempts from a Free plan', async () => {
    const res = await saveAppearance('EDITORIAL-MARKETING', 'EXPIRED')
    expect(res.success).toBe(false)
    expect((res as { code?: string }).code).toBe('PRO_TEMPLATE_REQUIRED')
  })

  it('lets junk template values pass the guard and drops the key server-side', async () => {
    mocks.tx.userProfile.update.mockResolvedValue({ version: 2 })
    const res = await saveAppearance('attacker-controlled-string')
    expect(res.success).toBe(true)
    expect(mocks.tx.userProfile.update).toHaveBeenCalledTimes(1)
    const data = mocks.tx.userProfile.update.mock.calls[0][0].data as Record<string, any>
    expect((data.appearance as Record<string, unknown>)['template']).toBeUndefined()
  })

  it('persists the editorial template with every other appearance key preserved', async () => {
    mocks.tx.userProfile.update.mockResolvedValue({ version: 2 })
    const res = await saveAppearance('editorial-marketing', 'ACTIVE')
    expect(res.success).toBe(true)
    const data = mocks.tx.userProfile.update.mock.calls[0][0].data as Record<string, any>
    const appearance = data.appearance as Record<string, unknown>
    expect(appearance['template']).toBe('editorial-marketing')
    expect(appearance['defaultColorMode']).toBe('light')
    expect(appearance['accentColor']).toBe('#8b5cf6')
  })

  it('switching back to classic keeps other appearance keys and enforces no plan', async () => {
    mocks.tx.userProfile.update.mockResolvedValue({ version: 2 })
    const res = await saveAppearance('classic', 'NONE')
    expect(res.success).toBe(true)
    const data = mocks.tx.userProfile.update.mock.calls[0][0].data as Record<string, any>
    const appearance = data.appearance as Record<string, unknown>
    expect(appearance['template']).toBe('classic')
    expect(appearance['accentColor']).toBe('#8b5cf6')
  })

  it('fails the whole save safely when subscription lookup throws (no silent template change)', async () => {
    setSubState('ACTIVE', true)
    const res = await updatePortfolio({
      id: 'profile-1',
      appearance: { template: 'editorial-marketing' },
      sections: [{ id: 's1', sectionType: 'hero', sectionOrder: 1, content: { title: { en: 'x' } } }],
      expectedVersion: 1,
    })
    expect(res.success).toBe(false)
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('saves sections/projects payloads untouched beside the template change', async () => {
    mocks.tx.userProfile.update.mockResolvedValue({ version: 2 })
    mocks.tx.userProfile.updateMany.mockResolvedValue({ count: 1 })
    mocks.tx.profilePage.findFirst.mockResolvedValue({ id: 'page-1' })
    mocks.tx.pageSection.findMany.mockResolvedValue([
      { id: 's1', sectionOrder: 1, content: {}, settings: {} },
    ])
    const section = { id: 's1', sectionType: 'hero', sectionOrder: 1, content: { title: { en: 'Hi' } } }
    const res = await updatePortfolio({
      id: 'profile-1',
      appearance: { template: 'editorial-marketing' },
      sections: [section],
      expectedVersion: 1,
    })
    expect(res.success).toBe(true)
    // Section rows are written for the caller — the template path never
    // rewrites or deletes customer content.
    expect(mocks.tx.pageSection.updateMany).toHaveBeenCalled()
    mocks.tx.pageSection.updateMany.mock.calls.forEach((call) => {
      expect((call[0].data as Record<string, unknown>).content).toEqual(section.content)
    })
  })

  it('applies with expectedVersion without any destructive writes', async () => {
    mocks.tx.userProfile.updateMany.mockResolvedValue({ count: 1 })
    mocks.tx.userProfile.findUnique
      .mockResolvedValueOnce({ version: 2 })
      .mockResolvedValueOnce({ version: 2 })
    const res = await updatePortfolio({
      id: 'profile-1',
      appearance: { template: 'editorial-marketing' },
      expectedVersion: 1,
    })
    expect(res.success).toBe(true)
    expect(mocks.tx.userProfile.updateMany).toHaveBeenCalledTimes(1)
    const data = mocks.tx.userProfile.updateMany.mock.calls[0][0].data as Record<string, any>
    expect(data.version).toEqual({ increment: 1 })
    expect((data.appearance as Record<string, unknown>)['template']).toBe('editorial-marketing')
  })
})

describe('localized direction contract (RTL/LTR baseline)', () => {
  it('resolves Arabic and falls back to English', async () => {
    const { getPortfolioLang } = await import('@/lib/portfolio-language')
    expect(getPortfolioLang({ n: 'ar' })).toBe('ar')
    expect(getPortfolioLang({ defaultLanguage: 'ar' })).toBe('ar')
    expect(getPortfolioLang({ n: 'en' })).toBe('en')
    expect(getPortfolioLang({})).toBe('en')
    expect(getPortfolioLang(undefined)).toBe('en')
  })
})

describe('template ids', () => {
  it('exposes exactly the classic default and the editorial Pro template', () => {
    expect(DEFAULT_TEMPLATE_ID).toBe('classic')
    expect(EDITORIAL_TEMPLATE_ID).toBe('editorial-marketing')
  })
})

describe('downgrade compatibility (F-07)', () => {
  it('lets a Free owner save while keeping an already-selected Pro template', async () => {
    mocks.prisma.userProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      username: 'tester',
      version: 1,
      appearance: { template: 'editorial-marketing', primaryColor: '#38BDF8' },
    })
    mocks.tx.userProfile.update.mockResolvedValue({ version: 2 })
    setSubState('NONE')
    const res = await updatePortfolio({
      id: 'profile-1',
      appearance: { template: 'editorial-marketing', primaryColor: '#123456' },
      expectedVersion: 1,
    })
    expect(res.success).toBe(true)
  })
})
