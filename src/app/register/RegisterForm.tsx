'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
          <input
            id="register-password"
            className="auth-input"
            type="password"
            required
            autoComplete="new-password"
            placeholder={t('auth.newPasswordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? '…' : t('auth.createAccountBtn')}
        </button>
      </form>
    </AuthShell>
  )
}
