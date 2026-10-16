'use client'

import React from 'react'
import {
  UserPlus,
  CreditCard,
  Receipt,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Key,
} from 'lucide-react'
import { StatusBadge } from './StatusBadge'

export interface TimelineEvent {
  id: string
  timestamp: string | Date
  type: 'user' | 'subscription' | 'payment' | 'portfolio' | 'audit'
  title: string
  description?: string | null
  status?: string | null
  actor?: string | null
  metadata?: Record<string, unknown>
}

interface UserTimelineProps {
  events: TimelineEvent[]
}

function getEventIcon(event: TimelineEvent) {
  switch (event.type) {
    case 'user':
      return <UserPlus className="h-4 w-4 text-[var(--color-primary)]" />
    case 'subscription':
      return <CreditCard className="h-4 w-4 text-emerald-500" />
    case 'payment':
      return <Receipt className="h-4 w-4 text-amber-500" />
    case 'portfolio':
      return <Globe className="h-4 w-4 text-blue-500" />
    case 'audit':
      if (event.title.includes('email') || event.title.includes('EMAIL')) {
        return <Mail className="h-4 w-4 text-purple-500" />
      }
      if (event.title.includes('password') || event.title.includes('PASSWORD')) {
        return <Key className="h-4 w-4 text-amber-500" />
      }
      return <Shield className="h-4 w-4 text-rose-500" />
    default:
      return <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
  }
}

function formatDate(val: string | Date) {
  const d = new Date(val)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UserTimeline({ events }: UserTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[var(--color-text-muted)]">
        No recorded events in this user timeline.
      </div>
    )
  }

  // Sort descending
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="relative pl-6 rtl:pl-0 rtl:pr-6 space-y-6 before:absolute before:left-[11px] rtl:before:left-auto rtl:before:right-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--color-border)]">
      {sorted.map((ev) => (
        <div key={ev.id} className="relative group">
          {/* Timeline node dot */}
          <div className="absolute -left-6 rtl:-left-auto rtl:-right-6 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
            {getEventIcon(ev)}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50 p-3 hover:bg-[var(--color-surface-secondary)] transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {ev.title}
                </span>
                {ev.status && <StatusBadge status={ev.status} size="sm" />}
              </div>
              <time className="text-[11px] font-mono text-[var(--color-text-muted)]">
                {formatDate(ev.timestamp)}
              </time>
            </div>

            {ev.description && (
              <p className="mt-1 text-xs text-[var(--color-text-secondary)] whitespace-pre-line">
                {ev.description}
              </p>
            )}

            {ev.actor && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                <span>By:</span>
                <span className="font-medium text-[var(--color-text-primary)]">{ev.actor}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
