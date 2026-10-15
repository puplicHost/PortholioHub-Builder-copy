'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useI18n } from '@/components/I18nProvider'

export function LoginForm() {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Login failed, please try again')
        return
      }
      router.push('/profile/builder')
      router.refresh()
    } catch {
      setError('Login failed, please try again')
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
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('nav.login')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('auth.loginSubtitle')}</p>
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
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">{t('auth.password')}</label>
          <Input
            type="password"
            required
            autoComplete="current-password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? '…' : t('auth.signIn')}
        </Button>
        <p className="text-center text-sm text-[var(--color-text-muted)]">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="font-medium text-[var(--color-primary)] hover:underline">
            {t('auth.createOne')}
          </Link>
        </p>
      </form>
    </div>
  )
}
