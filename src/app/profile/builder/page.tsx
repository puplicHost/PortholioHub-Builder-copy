import { getOrCreateProfile } from '@/lib/actions/portfolio'
import { BuilderClient } from './BuilderClient'
import { requireUser } from '@/lib/guards'
import { getSubscriptionState } from '@/lib/subscriptions'
import { getSetting } from '@/lib/settings'

export const metadata = {
  title: 'Portfolio Builder | PortfolioHub',
}

export default async function PortfolioBuilderPage() {
  const user = await requireUser()

  const [profile, sub, whatsapp] = await Promise.all([
    getOrCreateProfile(),
    getSubscriptionState(user.id).catch(() => null),
    getSetting('contact.whatsapp').catch(() => ''),
  ])

  return (
    <BuilderClient
      initialProfile={profile}
      initialSubscriptionState={sub?.state ?? 'NONE'}
      whatsappNumber={typeof whatsapp === 'string' ? whatsapp : ''}
    />
  )
}
