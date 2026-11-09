import { getPortfolioAnalytics } from '@/lib/actions/portfolio'
import { AnalyticsDashboard } from '@/components/portfolio/analytics/AnalyticsDashboard'

export const metadata = {
  title: 'Portfolio Analytics | PortfolioHub',
}

export default async function PortfolioAnalyticsPage() {
  const data = await getPortfolioAnalytics()

  return <AnalyticsDashboard data={data} />
}
