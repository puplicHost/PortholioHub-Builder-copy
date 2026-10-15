'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface PlanItem {
  id: string
  name: string
  priceEgp: number
  durationDays: number | null
}

interface SubscriptionState {
  state: string
  daysRemaining: number
  current: { id: string; status: string; startedAt: string; expiresAt: string | null; plan: { name: string } } | null
  pending: { id: string; code: string; status: string; createdAt: string; plan: { name: string } } | null
}

// /profile/subscription — plan status, pending request (code + WhatsApp),
// plans grid, cancel, history. Same card styling as the rest of the app.
export function SubscriptionClient() {
  const [state, setState] = useState<SubscriptionState | null>(null)
  const [plans, setPlans] = useState<PlanItem[]>([])
  const [history, setHistory] = useState<
    { id: string; status: string; startedAt: string; expiresAt: string | null; plan: { name: string } }[]
  >([])
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = async () => {
    const [sRes, pRes, hRes] = await Promise.all([
      fetch('/api/me/subscription'),
      fetch('/api/me/plans'),
      fetch('/api/me/subscription/history?pageSize=10'),
    ])
    const sData = await sRes.json().catch(() => null)
    const pData = await pRes.json().catch(() => null)
    const hData = await hRes.json().catch(() => null)
    if (sData?.ok) setState(sData)
    if (pData?.ok) setPlans(pData.items || [])
    if (hData?.ok) setHistory(hData.items || [])
    if (!sData?.ok || !pData?.ok) setError('Failed to load subscription info')
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [sRes, pRes, hRes] = await Promise.all([
          fetch('/api/me/subscription'),
          fetch('/api/me/plans'),
          fetch('/api/me/subscription/history?pageSize=10'),
        ])
        const sData = await sRes.json().catch(() => null)
        const pData = await pRes.json().catch(() => null)
        const hData = await hRes.json().catch(() => null)
        if (cancelled) return
        if (sData?.ok) setState(sData)
        if (pData?.ok) setPlans(pData.items || [])
        if (hData?.ok) setHistory(hData.items || [])
        if (!sData?.ok || !pData?.ok) setError('Failed to load subscription info')
      } catch {
        if (!cancelled) setError('Failed to load subscription info')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const request = async (planId: string) => {
    setBusy(planId)
    setError(null)
    setWhatsappUrl(null)
    try {
      const res = await fetch('/api/me/subscription-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.message || 'Request failed')
        return
      }
      setWhatsappUrl(data.whatsappUrl || null)
      await load()
    } catch {
      setError('Request failed')
    } finally {
      setBusy(null)
    }
  }

  const cancel = async () => {
    setBusy('cancel')
    setError(null)
    try {
      const res = await fetch('/api/me/subscription-requests', { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.message || 'Cancel failed')
        return
      }
      await load()
    } catch {
      setError('Cancel failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-bold">Subscription</h1>
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      {!state ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : (
        <>
          <Card className="p-4 space-y-1 text-sm">
            <p>
              Status: <strong>{state.state}</strong>
              {state.state === 'ACTIVE' && <> · {state.daysRemaining} days left</>}
              {state.state === 'GRACE' && <> · grace period</>}
            </p>
            {state.current && (
              <p className="text-[var(--color-text-muted)]">
                Current: {state.current.plan?.name} · ends{' '}
                {state.current.expiresAt ? new Date(state.current.expiresAt).toLocaleDateString() : '—'}
              </p>
            )}
            {state.pending && (
              <div className="pt-2 space-y-2">
                <p>
                  Pending request <code className="font-mono font-bold">{state.pending.code}</code> (
                  {state.pending.plan?.name})
                </p>
                <div className="flex gap-2">
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      <Button variant="primary">Open WhatsApp</Button>
                    </a>
                  )}
                  <Button variant="secondary" disabled={busy !== null} onClick={cancel}>
                    {busy === 'cancel' ? '…' : 'Cancel request'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
          <h2 className="text-sm font-semibold">Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-4 space-y-2">
                <p className="font-bold">{typeof plan.name === 'string' ? plan.name : plan.id}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {plan.priceEgp} EGP · {plan.durationDays || 30} days
                </p>
                <Button
                  variant="secondary"
                  disabled={busy !== null || !!state.pending}
                  onClick={() => request(plan.id)}
                >
                  {busy === plan.id ? '…' : state.pending ? 'Request pending' : 'Request subscription'}
                </Button>
              </Card>
            ))}
          </div>
          <h2 className="text-sm font-semibold">History</h2>
          {history.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">No past subscriptions.</p>
          ) : (
            <Card className="p-4 space-y-2 text-sm">
              {history.map((h) => (
                <p key={h.id} className="flex justify-between gap-2">
                  <span>
                    {h.plan?.name} · {h.status}
                  </span>
                  <span className="text-[var(--color-text-muted)]">
                    {new Date(h.startedAt).toLocaleDateString()} →{' '}
                    {h.expiresAt ? new Date(h.expiresAt).toLocaleDateString() : '—'}
                  </span>
                </p>
              ))}
            </Card>
          )}
          <Link href="/profile/builder" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
            ← Back to builder
          </Link>
        </>
      )}
    </div>
  )
}
