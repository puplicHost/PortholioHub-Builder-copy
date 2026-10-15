import { describe, it, expect } from 'vitest'
import { digitsOnly, buildWhatsappUrl, buildSubscriptionRequestMessage } from '@/lib/whatsapp'
import { parsePagination, buildMeta, MAX_PAGE_SIZE } from '@/lib/pagination'
import { isPortfolioVisible } from '@/lib/visibility'

describe('whatsapp links', () => {
  it('keeps digits only and encodes text', () => {
    expect(digitsOnly('+20 101-234 5678')).toBe('201012345678')
    const url = buildWhatsappUrl('+201012345678', 'hello world & more')
    expect(url).toBe('https://wa.me/201012345678?text=hello%20world%20%26%20more')
  })

  it('returns null without a number (button hidden)', () => {
    expect(buildWhatsappUrl('', 'x')).toBeNull()
  })

  it('request message carries name, phone, plan, code', () => {
    const msg = buildSubscriptionRequestMessage({ displayName: 'A', phone: '+20', planName: 'Pro', code: 'ABC123' })
    expect(msg).toContain('ABC123')
    expect(msg).toContain('Pro')
  })
})

describe('pagination helper', () => {
  it('clamps pageSize and defaults page', () => {
    expect(parsePagination(new URLSearchParams(''))).toMatchObject({ page: 1, pageSize: 20 })
    expect(parsePagination(new URLSearchParams('?pageSize=500')).pageSize).toBe(MAX_PAGE_SIZE)
    expect(parsePagination(new URLSearchParams('?page=0')).page).toBe(1)
  })

  it('builds meta', () => {
    expect(buildMeta(2, 20, 45)).toEqual({ page: 2, pageSize: 20, total: 45, totalPages: 3 })
  })
})

describe('visibility gating (plan Phase 6 §13)', () => {
  it('requires PUBLISHED + visible + subscription', () => {
    expect(isPortfolioVisible({ status: 'PUBLISHED', adminHidden: false }, 'ACTIVE')).toBe(true)
    expect(isPortfolioVisible({ status: 'PUBLISHED', adminHidden: false }, 'GRACE')).toBe(true)
    expect(isPortfolioVisible({ status: 'DRAFT', adminHidden: false }, 'ACTIVE')).toBe(false)
    expect(isPortfolioVisible({ status: 'PUBLISHED', adminHidden: true }, 'ACTIVE')).toBe(false)
    expect(isPortfolioVisible({ status: 'PUBLISHED', adminHidden: false }, 'EXPIRED')).toBe(false)
    expect(isPortfolioVisible({ status: 'PUBLISHED', adminHidden: false }, 'NONE')).toBe(false)
    expect(isPortfolioVisible({ status: 'PUBLISHED', adminHidden: false }, 'SUSPENDED')).toBe(false)
  })
})
