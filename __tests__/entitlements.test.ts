import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSubscriptionState: vi.fn(),
}))

vi.mock('@/lib/subscriptions', () => ({ getSubscriptionState: mocks.getSubscriptionState }))

import { getEntitlements } from '@/lib/entitlements'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('entitlement resolution', () => {
  it('treats ACTIVE and GRACE as paid', async () => {
    mocks.getSubscriptionState.mockResolvedValue({ state: 'ACTIVE' })
    await expect(getEntitlements('u1')).resolves.toEqual({ state: 'ACTIVE', isFree: false })

    mocks.getSubscriptionState.mockResolvedValue({ state: 'GRACE' })
    await expect(getEntitlements('u1')).resolves.toEqual({ state: 'GRACE', isFree: false })
  })

  it('treats NONE, EXPIRED and SUSPENDED as Free', async () => {
    for (const state of ['NONE', 'EXPIRED', 'SUSPENDED']) {
      mocks.getSubscriptionState.mockResolvedValue({ state })
      await expect(getEntitlements('u1')).resolves.toEqual({ state, isFree: true })
    }
  })

  it('propagates database errors instead of silently granting Free access', async () => {
    mocks.getSubscriptionState.mockRejectedValue(new Error('DB down'))
    await expect(getEntitlements('u1')).rejects.toThrow('DB down')
  })
})