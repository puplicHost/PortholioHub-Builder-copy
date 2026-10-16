'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useI18n } from '@/components/I18nProvider'
import { getFriendlyErrorMessage } from '@/lib/validations/error-messages'
import { getSafeRedirect } from '@/lib/urls'

export function RegisterForm() {
  const { t, lang } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, phone }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(getFriendlyErrorMessage(data?.code ?? data?.message ?? 'REGISTER_FAILED', lang))
        return
      }
      router.push(getSafeRedirect(searchParams.get('redirect'), '/profile/builder'))
      router.refresh()
    } catch {
      setError(getFriendlyErrorMessage('NETWORK_ERROR', lang))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('auth.createAccount')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('auth.registerSubtitle')}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t('auth.displayName')}</label>
          <Input
            type="text"
            autoComplete="name"
            placeholder={t('auth.displayNamePlaceholder')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t('auth.email')}</label>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t('auth.phone')}</label>
          <Input
            type="tel"
            required
            autoComplete="tel"
            placeholder={t('auth.phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t('auth.password')}</label>
          <Input
            type="password"
            required
            autoComplete="new-password"
            placeholder={t('auth.newPasswordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? '…' : t('auth.createAccountBtn')}
        </Button>
        <p className="text-center text-sm text-[var(--color-text-muted)]">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </form>
    </div>
  )
}
