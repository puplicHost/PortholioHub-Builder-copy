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

export function RegisterForm() {
  const { t, lang } = useI18n()
  const brand = usePlatformName()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <AuthShell
      brand={brand}
      heading={t('auth.createAccount')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link href="/login">{t('auth.signIn')}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="register-name" className="auth-label">{t('auth.displayName')}</label>
          <input
            id="register-name"
            className="auth-input"
            type="text"
            autoComplete="name"
            placeholder={t('auth.displayNamePlaceholder')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="register-email" className="auth-label">{t('auth.email')}</label>
          <input
            id="register-email"
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
          <label htmlFor="register-phone" className="auth-label">{t('auth.phone')}</label>
          <input
            id="register-phone"
            className="auth-input"
            type="tel"
            required
            autoComplete="tel"
            placeholder={t('auth.phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="register-password" className="auth-label">{t('auth.password')}</label>
          <div className="relative">
            <input
              id="register-password"
              className="auth-input"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder={t('auth.newPasswordPlaceholder')}
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
          {loading ? '…' : t('auth.createAccountBtn')}
        </button>
      </form>
    </AuthShell>
  )
}
