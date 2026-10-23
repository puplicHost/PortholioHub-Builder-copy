'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Globe,
  History,
  CreditCard,
  ShieldAlert,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
  CalendarClock,
  RefreshCw,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { StatusBadge } from './StatusBadge'
import { AdminModal, AdminConfirmModal } from './AdminModal'

interface OverviewPlan {
  id: string
  name: unknown
  priceEgp: number
  durationDays: number | null
}

interface OverviewSubscription {
  id: string
  state: 'ACTIVE' | 'GRACE' | 'EXPIRED' | 'NONE'
  graceDaysLeft: number
  planId: string
  planName: string
  startedAt: string
  expiresAt: string | null
  graceEndsAt: string | null
}

interface OverviewEvent {
  id: string
  timestamp: string
  title: string
  description?: string
}

interface OverviewData {
  user: {
    id: string
    email: string
    displayName: string | null
    phone: string | null
    isAdmin: boolean
    status: string
    createdAt: string
  }
  subscription: OverviewSubscription | null
  plans: { monthly: OverviewPlan | null; annual: OverviewPlan | null }
  portfolio: { username: string; status: string; adminHidden: boolean } | null
  events: OverviewEvent[]
}

function fmtDate(iso: string | null): string {
  if (!iso) return 'لا يوجد'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'لا يوجد'
  return d.toLocaleDateString('en-GB')
}

export function UserDetailsDrawer({
  userId,
  onClose,
  onChanged,
}: {
  userId: string | null
  onClose: () => void
  onChanged: () => void
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [busy, setBusy] = useState<string | null>(null)
  const [renewTarget, setRenewTarget] = useState<'monthly' | 'annual' | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [graceOpen, setGraceOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [unsuspendOpen, setUnsuspendOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  const fetchOverview = useCallback(async (id: string) => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}/overview`)
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        setLoadError(json?.message || 'تعذر تحميل بيانات المستخدم')
        return
      }
      setData(json as OverviewData)
    } catch {
      setLoadError('خطأ في الشبكة أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [])

  // The parent keys this component by user id, so per-user state (data,
  // temp password, dialogs) resets on open/close without an effect.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      if (!cancelled) await fetchOverview(userId)
    })()
    return () => {
      cancelled = true
    }
  }, [userId, fetchOverview])

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!userId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [userId, busy, onClose])

  if (!userId) return null

  const refresh = async () => {
    onChanged()
    router.refresh()
    await fetchOverview(userId)
  }

  const post = async (
    url: string,
    body: Record<string, unknown> | undefined,
    action: string,
    successMsg: string,
  ): Promise<boolean> => {
    setBusy(action)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        toast('error', json?.message || 'فشل تنفيذ العملية')
        return false
      }
      toast('success', successMsg)
      return true
    } catch {
      toast('error', 'خطأ في الشبكة')
      return false
    } finally {
      setBusy(null)
    }
  }

  const handleRenew = async () => {
    if (!renewTarget || !data) return
    const plan = renewTarget === 'monthly' ? data.plans.monthly : data.plans.annual
    if (!plan) {
      toast('error', 'الخطة غير موجودة')
      return
    }
    const ok = await post(
      `/api/admin/users/${data.user.id}/grant-subscription`,
      {
        planId: plan.id,
        durationDays: renewTarget === 'monthly' ? 30 : 365,
        note: `تجديد إداري ${renewTarget === 'monthly' ? 'شهري' : 'سنوي'} من لوحة الأدمن`,
      },
      'renew',
      `تم تجديد اشتراك ${data.user.displayName || data.user.email}`,
    )
    setRenewTarget(null)
    if (ok) refresh()
  }

  const handleCancelSub = async () => {
    if (!data?.subscription || !cancelReason.trim()) {
      toast('error', 'سبب الإلغاء مطلوب')
      return
    }
    const ok = await post(
      `/api/admin/subscriptions/${data.subscription.id}/suspend`,
      { reason: cancelReason.trim() },
      'cancel-sub',
      'تم إلغاء الاشتراك',
    )
    if (ok) {
      setCancelOpen(false)
      setCancelReason('')
      refresh()
    }
  }

  const handleExtendGrace = async () => {
    if (!data?.subscription) return
    const ok = await post(
      `/api/admin/subscriptions/${data.subscription.id}/extend`,
      { days: 7 },
      'extend-grace',
      'تم منح 7 أيام سماح إضافية',
    )
    if (ok) {
      setGraceOpen(false)
      refresh()
    }
  }

  const handleResetPassword = async () => {
    if (!data) return
    setBusy('reset-password')
    try {
      const res = await fetch(`/api/admin/users/${data.user.id}/reset-password`, { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        toast('error', json?.message || 'فشل إعادة التعيين')
        return
      }
      setTempPassword(json.tempPassword)
      toast('success', 'تم إنشاء كلمة مرور مؤقتة')
      setResetOpen(false)
      refresh()
    } catch {
      toast('error', 'خطأ في الشبكة')
    } finally {
      setBusy(null)
    }
  }

  const handleSuspendToggle = async (suspend: boolean) => {
    if (!data) return
    const ok = await post(
      `/api/admin/users/${data.user.id}/${suspend ? 'suspend' : 'unsuspend'}`,
      {},
      suspend ? 'suspend' : 'unsuspend',
      suspend ? 'تم تعليق الحساب' : 'تم إلغاء التعليق',
    )
    if (ok) {
      setSuspendOpen(false)
      setUnsuspendOpen(false)
      refresh()
    }
  }

  const handleDelete = async () => {
    if (!data || deleteInput.trim().toLowerCase() !== data.user.email.trim().toLowerCase()) {
      toast('error', 'اكتب البريد الإلكتروني بالضبط للتأكيد')
      return
    }
    setBusy('delete')
    try {
      const res = await fetch(`/api/admin/users/${data.user.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) {
        toast('error', json?.message || 'فشل حذف الحساب')
        return
      }
      toast('success', 'تم حذف الحساب نهائيًا')
      setDeleteOpen(false)
      onClose()
      onChanged()
      router.refresh()
      router.push('/admin/users')
    } catch {
      toast('error', 'خطأ في الشبكة')
    } finally {
      setBusy(null)
    }
  }

  const copyPassword = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('error', 'تعذر النسخ')
    }
  }

  const u = data?.user
  const sub = data?.subscription
  const isSuspended = u?.status === 'SUSPENDED'
  const badge = !u ? null : isSuspended
    ? { status: 'SUSPENDED', label: 'معلّق' }
    : sub?.state === 'ACTIVE'
      ? { status: 'ACTIVE', label: 'Pro' }
      : sub?.state === 'GRACE'
        ? { status: 'GRACE', label: `سماح · متبقي ${sub.graceDaysLeft} أيام` }
        : { status: 'FREE', label: 'Free' }

  return (
    <>
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="تفاصيل المستخدم">
        <div className="absolute inset-0 bg-black/60" onClick={() => !busy && onClose()} aria-hidden="true" />
        <aside className="absolute inset-y-0 end-0 flex w-full flex-col bg-[var(--color-surface)] shadow-2xl sm:w-[420px] animate-in slide-in-from-right rtl:slide-in-from-left duration-200 border-s border-[var(--color-border)]">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] p-4">
            {loading || !u || !data ? (
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--color-surface-secondary)]" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-surface-secondary)]" />
                  <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-surface-secondary)]" />
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: '#D4A017' }}
                >
                  {(u.displayName?.[0] || u.email[0] || '?').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                    {u.displayName || u.email}
                  </p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]" dir="ltr">{u.email}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {badge && <StatusBadge status={badge.status} label={badge.label} />}
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      انتهاء: {sub?.expiresAt ? fmtDate(sub.expiresAt) : 'لا يوجد'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => !busy && onClose()}
              aria-label="إغلاق"
              className="flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {loading && (
              <div className="space-y-3" role="status" aria-label="جارٍ التحميل">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-[var(--color-border)] p-4">
                    <div className="h-4 w-1/3 rounded bg-[var(--color-surface-secondary)]" />
                    <div className="mt-3 h-10 rounded bg-[var(--color-surface-secondary)]" />
                  </div>
                ))}
              </div>
            )}
            {loadError && !loading && (
              <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-center">
                <p className="text-sm text-[var(--color-danger)]">{loadError}</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => userId && fetchOverview(userId)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  إعادة المحاولة
                </Button>
              </div>
            )}

            {data && u && (
              <>
                {/* Section 1 — الاشتراك */}
                <section className="rounded-xl border border-[var(--color-border)] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                    <CreditCard className="h-4 w-4 text-[var(--color-primary)]" />
                    الاشتراك
                  </h3>
                  {sub ? (
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--color-text-muted)]">الخطة</dt>
                        <dd className="font-semibold text-[var(--color-text-primary)]">{sub.planName}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--color-text-muted)]">تاريخ البداية</dt>
                        <dd className="font-medium text-[var(--color-text-primary)]">{fmtDate(sub.startedAt)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--color-text-muted)]">تاريخ الانتهاء</dt>
                        <dd className="font-medium text-[var(--color-text-primary)]">{fmtDate(sub.expiresAt)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[var(--color-text-muted)]">الحالة</dt>
                        <dd>
                          {sub.state === 'ACTIVE' && <StatusBadge status="ACTIVE" label="نشط" />}
                          {sub.state === 'GRACE' && (
                            <StatusBadge status="GRACE" label={`سماح · متبقي ${sub.graceDaysLeft} أيام`} />
                          )}
                          {sub.state === 'EXPIRED' && <StatusBadge status="EXPIRED" label="منتهي" />}
                          {sub.state === 'NONE' && <StatusBadge status="FREE" label="لا يوجد" />}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--color-text-muted)]">لا يوجد اشتراك لهذا المستخدم.</p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy !== null || !data.plans.monthly}
                      onClick={() => setRenewTarget('monthly')}
                      className="min-h-[44px]"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      تجديد شهري
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy !== null || !data.plans.annual}
                      onClick={() => setRenewTarget('annual')}
                      className="min-h-[44px]"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      تجديد سنوي
                    </Button>
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    {sub && sub.state !== 'EXPIRED' && sub.state !== 'NONE' && (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => setCancelOpen(true)}
                        className="min-h-[44px] w-full"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        إلغاء الاشتراك
                      </Button>
                    )}
                    {sub?.state === 'GRACE' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => setGraceOpen(true)}
                        className="min-h-[44px] w-full"
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        منح فترة سماح إضافية (7 أيام)
                      </Button>
                    )}
                  </div>
                </section>

                {/* Section 2 — إجراءات الحساب */}
                <section className="rounded-xl border border-[var(--color-border)] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                    <ShieldAlert className="h-4 w-4 text-[var(--color-primary)]" />
                    إجراءات الحساب
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => {
                        setTempPassword(null)
                        setResetOpen(true)
                      }}
                      className="min-h-[44px] w-full justify-start"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      إعادة تعيين كلمة المرور
                    </Button>
                    {isSuspended ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => setUnsuspendOpen(true)}
                        className="min-h-[44px] w-full justify-start"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        إلغاء التعليق
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => setSuspendOpen(true)}
                        className="min-h-[44px] w-full justify-start"
                      >
                        <UserX className="h-3.5 w-3.5 text-[var(--color-warning)]" />
                        تعليق الحساب
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => {
                        setDeleteInput('')
                        setDeleteOpen(true)
                      }}
                      className="min-h-[44px] w-full justify-start"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      حذف الحساب
                    </Button>
                  </div>

                  {tempPassword && (
                    <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)]">
                        كلمة المرور المؤقتة (تظهر مرة واحدة):
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="flex-1 select-all rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm font-bold text-[var(--color-primary)]" dir="ltr">
                          {tempPassword}
                        </code>
                        <Button variant="secondary" size="sm" onClick={copyPassword} className="min-h-[44px]">
                          {copied ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
                          {copied ? 'تم' : 'نسخ'}
                        </Button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Section 3 — البورتفوليو */}
                <section className="rounded-xl border border-[var(--color-border)] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                    <Globe className="h-4 w-4 text-[var(--color-primary)]" />
                    البورتفوليو
                  </h3>
                  {data.portfolio ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <a
                          href={`/u/${data.portfolio.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[var(--color-primary)] hover:underline truncate"
                          dir="ltr"
                        >
                          /u/{data.portfolio.username}
                        </a>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <StatusBadge status={data.portfolio.status} />
                          {data.portfolio.adminHidden && <StatusBadge status="HIDDEN" label="مخفي" />}
                        </span>
                      </div>
                      <a
                        href={`/admin/users/${u.id}/preview`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]/70 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        معاينة البورتفوليو
                      </a>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--color-text-muted)]">لا يوجد بورتفوليو لهذا المستخدم.</p>
                  )}
                </section>

                {/* Section 4 — آخر النشاطات */}
                <section className="rounded-xl border border-[var(--color-border)] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
                    <History className="h-4 w-4 text-[var(--color-primary)]" />
                    آخر النشاطات
                  </h3>
                  {data.events.length === 0 ? (
                    <p className="mt-3 text-xs text-[var(--color-text-muted)]">لا توجد أنشطة مسجلة.</p>
                  ) : (
                    <ul className="mt-3 space-y-2.5">
                      {data.events.map((e) => (
                        <li key={e.id} className="border-s-2 border-[var(--color-primary)]/40 ps-3">
                          <p className="text-xs font-semibold text-[var(--color-text-primary)]">{e.title}</p>
                          {e.description && (
                            <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{e.description}</p>
                          )}
                          <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-muted)]" dir="ltr">
                            {new Date(e.timestamp).toLocaleDateString('en-GB')}{' '}
                            {new Date(e.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          {data && u && (
            <div className="border-t border-[var(--color-border)] p-3">
              <a
                href={`/admin/users/${u.id}`}
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                عرض الصفحة الكاملة
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </aside>
      </div>

      {/* Renew confirm */}
      <AdminConfirmModal
        isOpen={renewTarget !== null}
        onClose={() => !busy && setRenewTarget(null)}
        onConfirm={handleRenew}
        title={renewTarget === 'monthly' ? 'تجديد اشتراك شهري' : 'تجديد اشتراك سنوي'}
        description={
          renewTarget === 'monthly'
            ? `تجديد اشتراك ${u?.displayName || u?.email || ''} لمدة شهر؟`
            : `تجديد اشتراك ${u?.displayName || u?.email || ''} لسنة؟`
        }
        confirmText={renewTarget === 'monthly' ? 'تجديد شهري' : 'تجديد سنوي'}
        variant="primary"
        loading={busy === 'renew'}
      />

      {/* Cancel subscription (reason required) */}
      <AdminModal
        isOpen={cancelOpen}
        onClose={() => !busy && setCancelOpen(false)}
        title="إلغاء الاشتراك"
        description="أدخل سبب الإلغاء — سيُسجل في سجل التدقيق."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="drawer-cancel-reason" className="text-xs font-semibold text-[var(--color-text-secondary)]">
              سبب الإلغاء <span className="text-[var(--color-danger)]">*</span>
            </label>
            <textarea
              id="drawer-cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="مثال: طلب المستخدم، مخالفة الشروط…"
              className="w-full resize-none rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" disabled={busy !== null} onClick={() => setCancelOpen(false)}>
              تراجع
            </Button>
            <Button variant="danger" size="sm" loading={busy === 'cancel-sub'} onClick={handleCancelSub}>
              تأكيد الإلغاء
            </Button>
          </div>
        </div>
      </AdminModal>

      {/* Extend grace confirm */}
      <AdminConfirmModal
        isOpen={graceOpen}
        onClose={() => !busy && setGraceOpen(false)}
        onConfirm={handleExtendGrace}
        title="منح فترة سماح إضافية"
        description={`منح ${u?.displayName || u?.email || ''} فترة سماح إضافية 7 أيام؟`}
        confirmText="منح 7 أيام"
        variant="primary"
        loading={busy === 'extend-grace'}
      />

      {/* Reset password confirm */}
      <AdminConfirmModal
        isOpen={resetOpen}
        onClose={() => !busy && setResetOpen(false)}
        onConfirm={handleResetPassword}
        title="إعادة تعيين كلمة المرور"
        description="سيتم إنشاء كلمة مرور مؤقتة تظهر مرة واحدة ويُطلب من المستخدم تغييرها عند الدخول."
        confirmText="إنشاء كلمة مؤقتة"
        variant="primary"
        loading={busy === 'reset-password'}
      />

      {/* Suspend / unsuspend */}
      <AdminConfirmModal
        isOpen={suspendOpen}
        onClose={() => !busy && setSuspendOpen(false)}
        onConfirm={() => handleSuspendToggle(true)}
        title="تعليق الحساب"
        description="سيتم حظر المستخدم من تسجيل الدخول فورًا وإنهاء جلساته."
        confirmText="تعليق الحساب"
        variant="danger"
        loading={busy === 'suspend'}
      />
      <AdminConfirmModal
        isOpen={unsuspendOpen}
        onClose={() => !busy && setUnsuspendOpen(false)}
        onConfirm={() => handleSuspendToggle(false)}
        title="إلغاء التعليق"
        description="سيتمكن المستخدم من تسجيل الدخول بشكل طبيعي."
        confirmText="إلغاء التعليق"
        variant="primary"
        loading={busy === 'unsuspend'}
      />

      {/* Delete with email typing */}
      <AdminModal
        isOpen={deleteOpen}
        onClose={() => !busy && setDeleteOpen(false)}
        title="حذف الحساب"
        description="حذف نهائي لا يمكن التراجع عنه لجميع بيانات المستخدم."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            للتأكيد اكتب البريد الإلكتروني: <strong className="select-all" dir="ltr">{u?.email}</strong>
          </p>
          <Input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={u?.email ?? ''}
            className="font-mono text-xs"
            dir="ltr"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" disabled={busy !== null} onClick={() => setDeleteOpen(false)}>
              تراجع
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={busy === 'delete'}
              disabled={deleteInput.trim().toLowerCase() !== (u?.email.trim().toLowerCase() ?? '×')}
              onClick={handleDelete}
            >
              حذف نهائي
            </Button>
          </div>
        </div>
      </AdminModal>
    </>
  )
}
