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
} from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import type { PortfolioAnalytics } from '@/lib/actions/portfolio'
import { ViewsChart } from './ViewsChart'
import { RadialGaugeCard } from './RadialGaugeCard'
import { ProjectViews } from './ProjectViews'
import { TopCountries } from './TopLists'

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

  return (
    <div className="min-h-screen bg-[#f0f2f6] p-4 sm:p-6 lg:p-8 dark:bg-[#0b0f17]">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── 1. Top Navbar (Clean Floating Command Bar) ──────────────── */}
        <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-3 sm:px-6 sm:py-3.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26] md:flex-row md:items-center md:justify-between">
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

          {/* Center Floating Pill Navigation */}
          <nav className="flex items-center rounded-full bg-[#f4f5f8] p-1 border border-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
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
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
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
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
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
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'countries'
                  ? 'bg-[#0f172a] text-white shadow-sm dark:bg-white dark:text-[#0f172a]'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('Geographic Reach')}
            </button>
          </nav>

          {/* Right Controls & Profile Chip */}
          <div className="flex items-center gap-2.5">
            {/* Back to Builder Button */}
            <Link
              href="/profile/builder"
              className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200/80 bg-[#f8fafc] px-3.5 text-xs font-semibold text-[#0f172a] hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl dark:text-white">
              {t('Portfolio Analytics')}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t('Your current portfolio visitor summary and activity')}
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Range Pill Selector */}
            <div className="relative">
              <select
                value={range}
                onChange={(e) => setRange(Number(e.target.value) as Range)}
                className="h-10 cursor-pointer appearance-none rounded-full border border-slate-200/80 bg-white pl-4 pr-9 text-xs font-semibold text-[#0f172a] shadow-sm hover:border-slate-300 focus:outline-none transition-all dark:border-slate-800 dark:bg-[#161b26] dark:text-white"
                aria-label="Filter range"
              >
                <option value={7}>{t('7 days')}</option>
                <option value={30}>{t('30 days')}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Copy / Share link pill */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex h-10 items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-4 text-xs font-semibold text-[#0f172a] shadow-sm hover:border-slate-300 transition-all dark:border-slate-800 dark:bg-[#161b26] dark:text-white cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? t('Link copied!') : t('Copy Link')}</span>
            </button>

            {/* View Live Portfolio pill */}
            {liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center gap-1.5 rounded-full bg-[#2563eb] px-5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#1d4ed8] transition-all"
              >
                <span>{t('View live')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <button
                type="button"
                className="flex h-10 items-center gap-1.5 rounded-full bg-[#2563eb] px-5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#1d4ed8] transition-all"
              >
                <span>{t('View live')}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── 3. The 4 Metric Cards (Boltshift Aesthetic) ─────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 — The Hero Blue Card (Total Views) */}
          <div className="flex flex-col justify-between rounded-[24px] bg-[#2563eb] p-6 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-100">{t('Total Views')}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-sm">
                <Eye className="h-4 w-4" />
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold tracking-tight">
                {data.totalAllTime.toLocaleString()}
              </span>
              <DeltaPill current={data.total30d} previous={data.prev30d} isHero={true} />
            </div>

            <p className="text-xs text-blue-200">
              {t('Last 30 days')}: {data.total30d.toLocaleString()}
            </p>
          </div>

          {/* Card 2 — White Card (Weekly Visits) */}
          <div className="flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748b] dark:text-slate-400">{t('Weekly Visits')}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f172a] text-white shadow-sm">
                <Clock className="h-4 w-4" />
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
                {data.total7d.toLocaleString()}
              </span>
              <DeltaPill current={data.total7d} previous={data.prev7d} />
            </div>

            <p className="text-xs text-slate-400">
              {t('vs previous 7 days')}: {data.prev7d.toLocaleString()}
            </p>
          </div>

          {/* Card 3 — White Card (Project Case Study Views) */}
          <div className="flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748b] dark:text-slate-400">{t('Project Views')}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-sm">
                <FolderOpen className="h-4 w-4" />
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
                {data.projectViews.toLocaleString()}
              </span>
              <DeltaPill current={data.projectViews30d} previous={data.projectViewsPrev30d} />
            </div>

            <p className="text-xs text-slate-400">
              {t('Last 30 days')}: {data.projectViews30d.toLocaleString()}
            </p>
          </div>

          {/* Card 4 — White Card (WhatsApp Inquiries) */}
          <div className="flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#64748b] dark:text-slate-400">{t('WhatsApp Inquiries')}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10b981] text-white shadow-sm">
                <MessageCircle className="h-4 w-4" />
              </div>
            </div>

            <div className="my-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-extrabold tracking-tight text-[#0f172a] dark:text-white">
                {data.whatsappClicks.toLocaleString()}
              </span>
              <DeltaPill current={data.whatsapp30d} previous={data.whatsappPrev30d} />
            </div>

            <p className="text-xs text-slate-400">
              {t('Last 30 days')}: {data.whatsapp30d.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── 4. Middle Bento Section (Traffic Performance + Engagement Gauge) ─ */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Traffic Performance (Bar Chart) — Col 8 */}
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26] lg:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-[#0f172a] dark:text-white">
                  {t('Traffic Performance')}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {t('Daily visits')} · {range === 7 ? t('7 days') : t('30 days')}
                </p>
              </div>

              <div className="relative">
                <select
                  value={range}
                  onChange={(e) => setRange(Number(e.target.value) as Range)}
                  className="h-8 cursor-pointer appearance-none rounded-full border border-slate-200/80 bg-[#f8fafc] pl-3 pr-7 text-xs font-semibold text-[#0f172a] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
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
          <div className="lg:col-span-4">
            <RadialGaugeCard
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
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Project Performance Table — Col 8 */}
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26] lg:col-span-8">
            <div className="mb-4">
              <h2 className="text-base font-bold tracking-tight text-[#0f172a] dark:text-white">
                {t('Project Performance')}
              </h2>
            </div>
            <ProjectViews items={data.projects} username={data.username} />
          </section>

          {/* Geographic Distribution — Col 4 */}
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-[#161b26] lg:col-span-4">
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

            <TopCountries items={data.topCountries} />
          </section>
        </div>
      </div>
    </div>
  )
}
