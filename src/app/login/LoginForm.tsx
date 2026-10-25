'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)
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
          <div className="relative">
            <input
              id="login-password"
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingInlineEnd: '2.75rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? lang === 'ar' ? 'إخفاء كلمة المرور' : 'Hide password'
                  : lang === 'ar' ? 'إظهار كلمة المرور' : 'Show password'
              }
              aria-pressed={showPassword}
              className="absolute inset-y-0 end-0 flex w-11 cursor-pointer items-center justify-center rounded-e-[10px] text-[var(--c-muted)] transition-colors hover:text-[var(--c-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? '…' : t('auth.signIn')}
        </button>
      </form>
    </AuthShell>
  )
}
