'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  FolderOpen,
  MessageCircle,
  Globe,
  BarChart3,
  Clock,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  Share2,
  ChevronDown,
  Zap,
  Users,
  Download,
} from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import type { PortfolioAnalytics } from '@/lib/actions/portfolio'
import dynamic from 'next/dynamic'
import { ViewsChart } from './ViewsChart'

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={`${label} loading`}
      className="w-full animate-pulse rounded-[28px] border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#161b26]"
    >
      <div className="h-4 w-1/3 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="mt-4 h-[200px] w-full rounded-2xl bg-slate-100 md:h-[300px] dark:bg-slate-800/60" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

// Below-the-fold charts load on the client only, so the mobile first paint
// stays fast on low-end devices. Desktop rendering is unchanged.
const LazyRadialGaugeCard = dynamic(
  () => import('./RadialGaugeCard').then((m) => ({ default: m.RadialGaugeCard })),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Engagement" />,
  },
)
const LazyProjectViews = dynamic(
  () => import('./ProjectViews').then((m) => ({ default: m.ProjectViews })),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Projects" />,
  },
)
const LazyTopCountries = dynamic(
  () => import('./TopLists').then((m) => ({ default: m.TopCountries })),
  {
    ssr: false,
    loading: () => <ChartSkeleton label="Countries" />,
  },
)

function DeltaPill({ current, previous, isHero = false }: { current: number; previous: number; isHero?: boolean }) {
  if (previous <= 0) {
    if (current <= 0) {
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
            isHero ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          0.0%
        </span>
      )
    }
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
          isHero ? 'bg-white/25 text-white' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
        }`}
      >
        ↑ new
      </span>
    )
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
        isHero
          ? 'bg-white/20 text-white'
          : up
            ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
      }`}
    >
      {up ? '↑' : '↓'}{Math.abs(pct)}%
    </span>
  )
}

type Range = 7 | 30
type ActiveTab = 'overview' | 'traffic' | 'projects' | 'countries'

export function AnalyticsDashboard({ data }: { data: PortfolioAnalytics }) {
  const { t } = useI18n()
  const [range, setRange] = useState<Range>(30)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [copied, setCopied] = useState(false)

  const visibleDaily = range === 7 ? data.daily.slice(-7) : data.daily
  const liveUrl = data.username ? `/u/${data.username}` : null

  // Calculate engagement rate: ratio of visitors who opened a case study or clicked WhatsApp
  const totalEngagements = data.projectViews + data.whatsappClicks
  const engagementRate =
    data.totalAllTime > 0
      ? Math.min(100, Math.round((totalEngagements / data.totalAllTime) * 1000) / 10)
      : 0

  const handleCopyLink = () => {
    if (typeof window === 'undefined' || !data.username) return
    const fullUrl = `${window.location.origin}/u/${data.username}`
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleExport = () => {
    if (typeof window === 'undefined') return
    const rows: string[][] = [
      ['Metric', 'Value'],
      ['Total Views (All Time)', String(data.totalAllTime)],
      ['Total Views (30 Days)', String(data.total30d)],
      ['Weekly Visits (7 Days)', String(data.total7d)],
      ['Project Views', String(data.projectViews)],
      ['WhatsApp Inquiries', String(data.whatsappClicks)],
      ['Engagement Rate', `${engagementRate}%`],
      [],
      ['Date', 'Daily Views'],
      ...visibleDaily.map((d) => [d.date, String(d.views)]),
      [],
      ['Project Title', 'Slug', 'Total Views'],
      ...data.projects.map((p) => [p.title, p.slug || '', String(p.views)]),
      [],
      ['Country Code', 'Total Views'],
      ...data.topCountries.map((c) => [c.country, String(c.views)]),
    ]
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `portfolio-analytics-${data.username || 'export'}-${range}d.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f0f2f6] p-4 sm:p-6 lg:p-8 dark:bg-[#0b0f17]">
      <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
        {/* ── 1. Top Navbar (Clean Floating Command Bar) ──────────────── */}
        <header className="flex min-w-0 max-w-full flex-col gap-4 overflow-x-hidden rounded-[28px] border border-slate-200/80 bg-white p-3 sm:px-6 sm:py-3.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26] md:flex-row md:items-center md:justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-md shadow-blue-500/20">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#0f172a] dark:text-white">
                PortfolioHub
              </span>
              <span className="ms-1.5 rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#2563eb] dark:bg-blue-950/60 dark:text-blue-400">
                PRO
              </span>
            </div>
          </div>

          {/* Center Floating Pill Navigation — scrolls horizontally on mobile */}
          <nav
            aria-label="Analytics sections"
            className="flex w-full items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200/50 bg-[#f4f5f8] p-1 md:w-auto md:rounded-full dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#0f172a] text-white shadow-sm dark:bg-white dark:text-[#0f172a]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('Overview')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('traffic')}
              className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'traffic'
                  ? 'bg-[#0f172a] text-white shadow-sm dark:bg-white dark:text-[#0f172a]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('Traffic Performance')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('projects')}
              className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'projects'
                  ? 'bg-[#0f172a] text-white shadow-sm dark:bg-white dark:text-[#0f172a]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('Project Performance')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('countries')}
              className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'countries'
                  ? 'bg-[#0f172a] text-white shadow-sm dark:bg-white dark:text-[#0f172a]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('Geographic Reach')}
            </button>
          </nav>

          {/* Right Controls & Profile Chip */}
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Back to Builder Button */}
            <Link
              href="/profile/builder"
              aria-label="Back to builder"
              className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-slate-200/80 bg-[#f8fafc] px-3.5 text-xs font-semibold text-[#0f172a] hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{t('Back to Builder')}</span>
            </Link>

            {/* Profile Chip */}
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-[#f8fafc] p-1 pr-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563eb] text-[11px] font-bold text-white uppercase">
                {(data.username || 'U').charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <p className="font-bold text-[#0f172a] dark:text-white">{data.username || 'Creator'}</p>
                <p className="text-[10px] text-slate-400">Portfolio</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── 2. Page Title & Action Bar (Mapped to Portfolio Analytics) ─ */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl dark:text-white">
              {t('Portfolio Analytics')}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t('Your current portfolio visitor summary and activity')}
            </p>
          </div>

          {/* Right Action Controls — stacked full-width on mobile (< md: 768px) */}
          <div className="flex w-full flex-col items-stretch gap-2.5 md:w-auto md:flex-row md:flex-wrap md:items-center">
            {/* Time Range Pill Selector */}
            <div className="relative w-full md:w-auto">
              <select
                value={range}
                onChange={(e) => setRange(Number(e.target.value) as Range)}
                className="h-11 max-h-[44px] min-h-[44px] w-full cursor-pointer appearance-none rounded-full border border-slate-200/80 bg-white pl-4 pr-9 text-base font-semibold text-[#0f172a] shadow-sm hover:border-slate-300 focus:outline-none transition-all md:h-10 md:w-auto md:text-xs dark:border-slate-800 dark:bg-[#161b26] dark:text-white"
                aria-label="Filter range"
              >
                <option value={7}>{t('7 days')}</option>
                <option value={30}>{t('30 days')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Export button — icon only on mobile with aria-label */}
            <button
              type="button"
              onClick={handleExport}
              aria-label={t('Export analytics CSV')}
              title={t('Export CSV')}
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 text-xs font-semibold text-[#0f172a] shadow-sm hover:border-slate-300 transition-all md:w-auto dark:border-slate-800 dark:bg-[#161b26] dark:text-white cursor-pointer"
            >
              <Download className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="hidden md:inline">{t('Export')}</span>
            </button>

            {/* Copy / Share link pill — icon only on mobile */}
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label={copied ? t('Link copied!') : t('Copy Link')}
              title={t('Copy Link')}
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 text-xs font-semibold text-[#0f172a] shadow-sm hover:border-slate-300 transition-all md:w-auto dark:border-slate-800 dark:bg-[#161b26] dark:text-white cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 shrink-0 text-emerald-500" /> : <Share2 className="h-4 w-4 shrink-0 text-slate-500" />}
              <span className="hidden md:inline">{copied ? t('Link copied!') : t('Copy Link')}</span>
            </button>

            {/* View Live Portfolio pill — full width on mobile */}
            {liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={t('View live')}
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-[#2563eb] px-5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#1d4ed8] transition-all md:w-auto"
              >
                <span>{t('View live')}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : (
              <button
                type="button"
                aria-label={t('View live')}
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-[#2563eb] px-5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#1d4ed8] transition-all md:w-auto"
              >
                <span>{t('View live')}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* ── 3. The 4 Metric Cards (Boltshift Aesthetic) ─────────────── */}
        {/* On < md (768px): stacks vertically in 1 column */}
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 — The Hero Blue Card (Total Views) */}
          <div className="flex min-h-[80px] min-w-0 flex-col justify-between rounded-[24px] bg-[#2563eb] p-5 sm:p-6 text-white shadow-lg shadow-blue-500/20">
            {/* Icon + label on same row */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-sm">
                <Eye className="h-4 w-4" />
              </div>
              <span className="min-w-0 truncate text-xs font-semibold text-blue-100">{t('Total Views')}</span>
            </div>

            {/* Value below */}
            <div className="my-2.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono font-extrabold tracking-tight text-[clamp(1.5rem,5vw,2rem)] leading-none">
                {data.totalAllTime.toLocaleString()}
              </span>
              <DeltaPill current={data.total30d} previous={data.prev30d} isHero={true} />
            </div>

            <p className="text-xs text-blue-200">
              {t('Last 30 days')}: {data.total30d.toLocaleString()}
            </p>
          </div>

          {/* Card 2 — White Card (Weekly Visits) */}
          <div className="flex min-h-[80px] min-w-0 flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26]">
            {/* Icon + label on same row */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f172a] text-white shadow-sm">
                <Clock className="h-4 w-4" />
              </div>
              <span className="min-w-0 truncate text-xs font-semibold text-[#64748b] dark:text-slate-400">{t('Weekly Visits')}</span>
            </div>

            {/* Value below */}
            <div className="my-2.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono font-extrabold tracking-tight text-[#0f172a] text-[clamp(1.5rem,5vw,2rem)] leading-none dark:text-white">
                {data.total7d.toLocaleString()}
              </span>
              <DeltaPill current={data.total7d} previous={data.prev7d} />
            </div>

            <p className="text-xs text-slate-400">
              {t('vs previous 7 days')}: {data.prev7d.toLocaleString()}
            </p>
          </div>

          {/* Card 3 — White Card (Project Case Study Views) */}
          <div className="flex min-h-[80px] min-w-0 flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26]">
            {/* Icon + label on same row */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-sm">
                <FolderOpen className="h-4 w-4" />
              </div>
              <span className="min-w-0 truncate text-xs font-semibold text-[#64748b] dark:text-slate-400">{t('Project Views')}</span>
            </div>

            {/* Value below */}
            <div className="my-2.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono font-extrabold tracking-tight text-[#0f172a] text-[clamp(1.5rem,5vw,2rem)] leading-none dark:text-white">
                {data.projectViews.toLocaleString()}
              </span>
              <DeltaPill current={data.projectViews30d} previous={data.projectViewsPrev30d} />
            </div>

            <p className="text-xs text-slate-400">
              {t('Last 30 days')}: {data.projectViews30d.toLocaleString()}
            </p>
          </div>

          {/* Card 4 — White Card (WhatsApp Inquiries) */}
          <div className="flex min-h-[80px] min-w-0 flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26]">
            {/* Icon + label on same row */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-white shadow-sm">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="min-w-0 truncate text-xs font-semibold text-[#64748b] dark:text-slate-400">{t('WhatsApp Inquiries')}</span>
            </div>

            {/* Value below */}
            <div className="my-2.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono font-extrabold tracking-tight text-[#0f172a] text-[clamp(1.5rem,5vw,2rem)] leading-none dark:text-white">
                {data.whatsappClicks.toLocaleString()}
              </span>
              <DeltaPill current={data.whatsapp30d} previous={data.whatsappPrev30d} />
            </div>

            <p className="text-xs text-slate-400">
              {t('Last 30 days')}: {data.whatsapp30d.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── Empty State Banner (shown when total views is 0) ───────── */}
        {data.totalAllTime === 0 && (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200/90 bg-white p-6 text-center shadow-xs dark:border-slate-800 dark:bg-[#161b26]">
            <div className="mx-auto mb-3 flex h-14 w-14 max-w-[200px] items-center justify-center rounded-full bg-blue-50 text-[#2563eb] dark:bg-blue-950/60 dark:text-blue-400">
              <BarChart3 className="h-7 w-7 max-w-[200px]" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-[#0f172a] dark:text-white">
              {t('No visitor data recorded yet')}
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
              {t('Share your portfolio link to start receiving visitor views, case study reads, and client inquiries.')}
            </p>
            <div className="mt-4 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full bg-[#2563eb] px-5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#1d4ed8] transition-all sm:w-auto cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copied ? t('Link copied!') : t('Copy Portfolio Link')}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── 4. Middle Bento Section (Traffic Performance + Engagement Gauge) ─ */}
        <div className="grid min-w-0 gap-6 lg:grid-cols-12">
          {/* Traffic Performance (Bar Chart) — Col 8 */}
          <section className="min-w-0 max-w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-4 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26] lg:col-span-8">
            <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-[#0f172a] dark:text-white">
                  {t('Traffic Performance')}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {t('Daily visits')} · {range === 7 ? t('7 days') : t('30 days')}
                </p>
              </div>

              <div className="relative shrink-0">
                <select
                  value={range}
                  onChange={(e) => setRange(Number(e.target.value) as Range)}
                  aria-label="Chart range"
                  className="h-11 max-h-[44px] min-h-[44px] cursor-pointer appearance-none rounded-full border border-slate-200/80 bg-[#f8fafc] pl-3 pr-9 text-base font-semibold text-[#0f172a] focus:outline-none md:h-8 md:min-h-[32px] md:text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value={7}>{t('7 days')}</option>
                  <option value={30}>{t('30 days')}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            </div>

            {/* The Bar Chart */}
            <ViewsChart daily={visibleDaily} />
          </section>

          {/* Radial Segmented Semicircle Gauge Card — Col 4 */}
          <div className="min-w-0 lg:col-span-4">
            <LazyRadialGaugeCard
              percentage={engagementRate}
              label={t('Engagement Rate')}
              metric1={{
                label: t('Project Reads'),
                value: data.projectViews.toLocaleString(),
                badge: data.projectViews > 0 ? '+4.5%' : undefined,
              }}
              metric2={{
                label: t('WhatsApp Leads'),
                value: data.whatsappClicks.toLocaleString(),
                badge: data.whatsappClicks > 0 ? '+6.5%' : undefined,
              }}
            />
          </div>
        </div>

        {/* ── 5. Bottom Section: Project Performance & Geographic Reach ── */}
        <div className="grid min-w-0 gap-6 lg:grid-cols-12">
          {/* Project Performance Table — Col 8 */}
          <section className="min-w-0 max-w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-4 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26] lg:col-span-8">
            <div className="mb-4">
              <h2 className="text-base font-bold tracking-tight text-[#0f172a] dark:text-white">
                {t('Project Performance')}
              </h2>
            </div>
            <LazyProjectViews items={data.projects} username={data.username} />
          </section>

          {/* Geographic Distribution — Col 4 */}
          <section className="min-w-0 max-w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-4 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26] lg:col-span-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Globe className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold tracking-tight text-[#0f172a] dark:text-white">
                  {t('Top countries')}
                </h2>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {data.topCountries.length} countries
              </span>
            </div>

            <LazyTopCountries items={data.topCountries} />
          </section>
        </div>
      </div>
    </div>
  )
}
