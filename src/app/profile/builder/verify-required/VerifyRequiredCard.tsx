'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MailWarning } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useBuilderI18n } from '../i18n/BuilderI18nContext'
import { resendVerificationEmail } from '@/lib/actions/resend-verification'

export function VerifyRequiredCard({ maskedEmail }: { maskedEmail: string }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [failed, setFailed] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const { toast } = useToast()
  const { locale, dir, t } = useBuilderI18n()

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const handleSend = useCallback(async () => {
    if (sending || cooldown > 0) return
    setSending(true)
    setFailed(false)
    try {
      const res = await resendVerificationEmail()
      if (res?.error) {
        setFailed(true)
        toast('error', res.error)
      } else {
        setSent(true)
        setCooldown(60)
      }
    } catch {
      setFailed(true)
      toast('error', t('verify.error'))
    } finally {
      setSending(false)
    }
  }, [sending, cooldown, toast, t])

  return (
    <div lang={locale} dir={dir} className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
            <MailWarning className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t('verify.title')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {t('verify.description')}
          </p>
          <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]" dir="ltr">
            {maskedEmail}
          </p>

          {sent ? (
            <p role="status" className="mt-5 text-sm font-medium text-[var(--color-success)]">
              ✅ {t('verify.sent')}
            </p>
          ) : (
            <Button
              onClick={handleSend}
              disabled={sending || cooldown > 0}
              className="mt-5 w-full"
            >
              {sending
                ? t('verify.resending')
                : cooldown > 0
                  ? t('verify.resendCooldown', { seconds: cooldown })
                  : t('verify.resend')}
            </Button>
          )}
          {failed && !sent && (
            <p role="alert" className="mt-3 text-xs text-[var(--color-danger)]">{t('verify.error')}</p>
          )}

          <Link
            href="/profile/builder"
            className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {t('verify.backToBuilder')}
          </Link>
        </div>
      </Card>
    </div>
  )
}
