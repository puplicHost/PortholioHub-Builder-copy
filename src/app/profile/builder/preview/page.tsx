import { requireUser } from '@/lib/guards'
import { getOrCreateProfile } from '@/lib/actions/portfolio'
import { getSubscriptionState } from '@/lib/subscriptions'
import { stripLockedSectionsForFree } from '@/lib/free-sections'
import { ClassicTemplate } from '@/components/portfolio/templates/ClassicTemplate'

// Owner-only live preview rendered inside the builder's 390px mobile iframe.
// Same data the canvas LivePreview uses, so WYSIWYG matches the device.
export const metadata = {
  title: 'Preview | PortfolioHub',
  robots: { index: false, follow: false },
}

export default async function BuilderPreviewPage() {
  const user = await requireUser()
  const [profile, sub] = await Promise.all([
    getOrCreateProfile(),
    getSubscriptionState(user.id).catch(() => null),
  ])
  const isFree = !sub || (sub.state !== 'ACTIVE' && sub.state !== 'GRACE')
  const viewProfile = isFree ? stripLockedSectionsForFree(profile) : profile
  return <ClassicTemplate profile={viewProfile} isFree={isFree} />
}
