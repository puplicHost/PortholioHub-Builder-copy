import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/guards'
import { VerifyRequiredCard } from './VerifyRequiredCard'

export const metadata = {
  title: 'تأكيد الإيميل مطلوب | PortfolioHub',
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const first = local.charAt(0) || ''
  return `${first}***@${domain}`
}

export default async function VerifyRequiredPage() {
  const user = await requireUser()

  if (user.emailVerified) {
    redirect('/profile/builder')
  }

  return <VerifyRequiredCard maskedEmail={maskEmail(user.email)} />
}
