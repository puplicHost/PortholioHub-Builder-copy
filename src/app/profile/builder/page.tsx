import { getOrCreateProfile } from '@/lib/actions/portfolio'
import { BuilderClient } from './BuilderClient'
import { requireUser } from '@/lib/guards'

export const metadata = {
  title: 'Portfolio Builder | PortfolioHub',
}

export default async function PortfolioBuilderPage() {
  await requireUser()

  const profile = await getOrCreateProfile()

  return <BuilderClient initialProfile={profile} />
}
