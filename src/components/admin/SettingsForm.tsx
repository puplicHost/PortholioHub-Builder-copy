'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, CreditCard, MessageSquare, Save, RotateCcw, Tags, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

interface SettingItem {
  key: string
  value: unknown
}

interface PlanItem {
  id: string
  name: string
  priceEgp: number
  durationDays: number
  isActive: boolean
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(', ')
  return ''
}

function fromText(key: string, raw: string): unknown {
  if (key === 'subscription.reminderDays') {
    return raw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
  }
  if (key === 'subscription.graceDays') return Number(raw)
  return raw
}

const CONTACT_FIELDS: Array<{ key: string; label: string; placeholder: string; dir?: 'ltr' }> = [
  { key: 'contact.whatsapp', label: 'رقم الواتساب', placeholder: '+201001234567', dir: 'ltr' },
  { key: 'contact.email', label: 'الإيميل', placeholder: 'support@example.com', dir: 'ltr' },
  { key: 'contact.facebook', label: 'فيسبوك URL', placeholder: 'https://facebook.com/...', dir: 'ltr' },
  { key: 'contact.instagram', label: 'إنستجرام URL', placeholder: 'https://instagram.com/...', dir: 'ltr' },
  { key: 'contact.linkedin', label: 'لينكدإن URL', placeholder: 'https://linkedin.com/...', dir: 'ltr' },
  { key: 'contact.twitter', label: 'تويتر/X URL', placeholder: 'https://x.com/...', dir: 'ltr' },
]

const PLATFORM_FIELDS: Array<{ key: string; label: string; placeholder: string; hint: string }> = [
  { key: 'platform.name', label: 'اسم المنصة', placeholder: 'PortfolioHub', hint: 'يظهر في الموقع والبيانات' },
  { key: 'subscription.graceDays', label: 'فترة السماح (أيام)', placeholder: '7', hint: 'أيام السماح بعد انتهاء الاشتراك (الافتراضي 7)' },
]

export function SettingsForm({ items, plans }: { items: SettingItem[]; plans: PlanItem[] }) {
  const router = useRouter()
  const { toast } = useToast()

  const byKey = Object.fromEntries(items.map((i) => [i.key, i.value]))
  const initialValues = Object.fromEntries(
    [...CONTACT_FIELDS, ...PLATFORM_FIELDS].map((f) => [f.key, toText(byKey[f.key])])
  )
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [saving, setSaving] = useState(false)

  const [planEdits, setPlanEdits] = useState<Record<string, { name: string; price: string; duration: string; isActive: boolean }>>(() =>
    Object.fromEntries(
      plans.map((p) => [p.id, { name: p.name, price: String(p.priceEgp), duration: String(p.durationDays), isActive: p.isActive }])
    )
  )
  const [planBusy, setPlanBusy] = useState<string | null>(null)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [key]: e.target.value }))

  // Compute dirty keys
  const dirtyKeys = Object.keys(initialValues).filter(
    (key) => (values[key] ?? '') !== (initialValues[key] ?? '')
  )
  const hasDirty = dirtyKeys.length > 0

  const handleDiscard = () => {
    setValues(initialValues)
    toast('info', 'تم التراجع عن التغييرات')
  }

  const handleSaveAll = async () => {
    if (!hasDirty) return
    setSaving(true)
    try {
      let failedCount = 0
      for (const key of dirtyKeys) {
        const raw = values[key] ?? ''
        const value = fromText(key, raw)
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.ok) failedCount++
      }
      if (failedCount === 0) {
        toast('success', `تم حفظ ${dirtyKeys.length} ${dirtyKeys.length === 1 ? 'إعداد' : 'إعدادات'} بنجاح`)
        router.refresh()
      } else {
        toast('error', `فشل حفظ بعض الإعدادات (${failedCount})`)
      }
    } catch {
      toast('error', 'خطأ في الشبكة أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const savePlan = async (planId: string) => {
    const edit = planEdits[planId]
    if (!edit) return
    const price = Number(edit.price)
    const duration = Number(edit.duration)
    if (!edit.name.trim()) {
      toast('error', 'اسم الباقة مطلوب')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      toast('error', 'السعر يجب أن يكون رقمًا موجبًا')
      return
    }
    if (!Number.isFinite(duration) || duration < 1) {
      toast('error', 'المدة يجب أن تكون يومًا واحدًا على الأقل')
      return
    }
    setPlanBusy(planId)
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: edit.name.trim(), priceEgp: Math.floor(price), durationDays: Math.floor(duration) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'فشل حفظ الباقة')
        return
      }
      toast('success', 'تم حفظ الباقة')
      router.refresh()
    } catch {
      toast('error', 'خطأ في الشبكة')
    } finally {
      setPlanBusy(null)
    }
  }

  const togglePlanActive = async (planId: string, next: boolean) => {
    setPlanBusy(planId)
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'فشل تحديث حالة الباقة')
        return
      }
      setPlanEdits((prev) => ({ ...prev, [planId]: { ...prev[planId], isActive: next } }))
      toast('success', next ? 'تم تفعيل الباقة' : 'تم إيقاف الباقة')
      router.refresh()
    } catch {
      toast('error', 'خطأ في الشبكة')
    } finally {
      setPlanBusy(null)
    }
  }

  const editPlan = (planId: string, field: 'name' | 'price' | 'duration', value: string) =>
    setPlanEdits((prev) => ({ ...prev, [planId]: { ...prev[planId], [field]: value } }))

  const renderField = (f: { key: string; label: string; placeholder: string; hint?: string; dir?: 'ltr' }) => (
    <div key={f.key} className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`setting-${f.key}`} className="text-xs font-semibold text-[var(--color-text-secondary)]">
          {f.label}
        </label>
        {f.hint && <span className="text-[11px] text-[var(--color-text-muted)]">{f.hint}</span>}
      </div>
      <Input
        id={`setting-${f.key}`}
        value={values[f.key] ?? ''}
        onChange={set(f.key)}
        placeholder={f.placeholder}
        dir={f.dir}
        className={(values[f.key] ?? '') !== (initialValues[f.key] ?? '') ? 'border-[var(--color-warning)] focus:ring-[var(--color-warning)]' : ''}
      />
    </div>
  )

  return (
    <div className="space-y-6 pb-20">
      {/* Section 1 — معلومات التواصل */}
      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3 border-b border-[var(--color-border)] pb-3.5">
          <span className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
            <MessageSquare className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">معلومات التواصل</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">قنوات التواصل العامة وروابط السوشيال ميديا.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CONTACT_FIELDS.map(renderField)}
        </div>
      </Card>

      {/* Section 2 — الباقات */}
      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3 border-b border-[var(--color-border)] pb-3.5">
          <span className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
            <Tags className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">الباقات</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">الخطتان المتاحتان: تعديل الاسم والسعر والمدة والحالة.</p>
          </div>
        </div>
        {plans.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">لا توجد باقات. أنشئها من صفحة الخطط.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((p) => {
            const edit = planEdits[p.id]
            if (!edit) return null
            const dirty =
              edit.name !== p.name ||
              edit.price !== String(p.priceEgp) ||
              edit.duration !== String(p.durationDays)
            return (
              <div key={p.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                    <CreditCard className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                    {p.name}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={edit.isActive}
                    aria-label={edit.isActive ? 'إيقاف الباقة' : 'تفعيل الباقة'}
                    disabled={planBusy === p.id}
                    onClick={() => togglePlanActive(p.id, !edit.isActive)}
                    className={`relative h-7 min-h-[28px] w-12 min-w-[48px] shrink-0 rounded-full transition-colors cursor-pointer ${
                      edit.isActive ? 'bg-emerald-500' : 'bg-[var(--color-border)]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                        edit.isActive ? 'start-5 rtl:start-auto rtl:end-0.5' : 'start-0.5'
                      }`}
                    />
                  </button>
                </div>
                <Input label="اسم الباقة" value={edit.name} onChange={(e) => editPlan(p.id, 'name', e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="السعر بالجنيه" type="number" min={0} value={edit.price} onChange={(e) => editPlan(p.id, 'price', e.target.value)} dir="ltr" />
                  <Input label="المدة بالأيام" type="number" min={1} value={edit.duration} onChange={(e) => editPlan(p.id, 'duration', e.target.value)} dir="ltr" />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant={dirty ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={!dirty || planBusy === p.id}
                    loading={planBusy === p.id}
                    onClick={() => savePlan(p.id)}
                    className="min-h-[44px]"
                  >
                    {dirty ? <Save className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {dirty ? 'حفظ الباقة' : 'محفوظة'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Section 3 — إعدادات المنصة */}
      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3 border-b border-[var(--color-border)] pb-3.5">
          <span className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
            <Globe className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">إعدادات المنصة</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">اسم المنصة وفترة السماح للاشتراكات.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLATFORM_FIELDS.map(renderField)}
        </div>
      </Card>

      {/* Sticky Save Bar — one bar for all settings fields */}
      <div
        className={`fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-30 transition-all duration-200 ${
          hasDirty ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-warning)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--color-text-primary)]">
              {dirtyKeys.length} تغييرات غير محفوظة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={handleDiscard} className="min-h-[44px]">
              <RotateCcw className="h-3.5 w-3.5" />
              تراجع
            </Button>
            <Button type="button" variant="primary" size="sm" loading={saving} onClick={handleSaveAll} className="min-h-[44px]">
              <Save className="h-3.5 w-3.5" />
              حفظ التغييرات
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
