import { getPortfolioAnalytics } from '@/lib/actions/portfolio'
import { requireUser } from '@/lib/guards'
import { AnalyticsDashboard } from '@/components/portfolio/analytics/AnalyticsDashboard'

export const metadata = {
  title: 'Portfolio Analytics | PortfolioHub',
}

export default async function PortfolioAnalyticsPage() {
  await requireUser()

  const data = await getPortfolioAnalytics()

  return <AnalyticsDashboard data={data} />
}
