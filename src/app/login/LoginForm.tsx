'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useI18n } from '@/components/I18nProvider'
import { usePlatformName } from '@/components/PlatformProvider'
import { AuthShell } from '@/components/auth/AuthShell'
import { getFriendlyErrorMessage } from '@/lib/validations/error-messages'
import { getSafeRedirect } from '@/lib/urls'

export function LoginForm() {
  const { t, lang } = useI18n()
  const brand = usePlatformName()
  const router = useRouter()
  const searchParams = useSearchParams()
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
        setError(getFriendlyErrorMessage(data?.code ?? data?.message ?? 'LOGIN_FAILED', lang))
        return
      }
      if (data?.mustChangePassword) {
        router.push('/change-password')
      } else if (data?.isAdmin) {
        router.push('/admin')
      } else {
        router.push(getSafeRedirect(searchParams.get('redirect'), '/profile/builder'))
      }
      router.refresh()
    } catch {
      setError(getFriendlyErrorMessage('NETWORK_ERROR', lang))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      brand={brand}
      heading={t('nav.login')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link href="/register">{t('auth.createOne')}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="login-email" className="auth-label">{t('auth.email')}</label>
          <input
            id="login-email"
            className="auth-input"
            type="email"
            required
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password" className="auth-label">{t('auth.password')}</label>
          <input
            id="login-password"
            className="auth-input"
            type="password"
            required
            autoComplete="current-password"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? '…' : t('auth.signIn')}
        </button>
      </form>
    </AuthShell>
  )
}
