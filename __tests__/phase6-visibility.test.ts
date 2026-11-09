import { describe, expect, it } from 'vitest'
import { isPortfolioHomeVisible, isPortfolioVisible } from '@/lib/visibility'

describe('portfolio visibility contract (F-35)', () => {
  it('publish-gates the home portfolio without requiring a subscription', () => {
    expect(isPortfolioHomeVisible({ status: 'PUBLISHED' })).toBe(true)
    expect(isPortfolioHomeVisible({ status: 'DRAFT' })).toBe(false)
    expect(isPortfolioHomeVisible({ status: 'PUBLISHED', adminHidden: true })).toBe(false)
  })

  it('keeps project pages subscription-gated', () => {
    expect(isPortfolioVisible({ status: 'PUBLISHED' }, 'ACTIVE')).toBe(true)
    expect(isPortfolioVisible({ status: 'PUBLISHED' }, 'GRACE')).toBe(true)
    expect(isPortfolioVisible({ status: 'PUBLISHED' }, 'EXPIRED')).toBe(false)
    expect(isPortfolioVisible({ status: 'PUBLISHED' }, 'SUSPENDED')).toBe(false)
  })
})
