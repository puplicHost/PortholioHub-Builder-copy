'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink, ShieldAlert, Globe } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { ClassicTemplate } from '@/components/portfolio/templates/ClassicTemplate'

interface BuilderPreviewClientProps {
  userId: string
  userName: string
  userEmail: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any
}

export function BuilderPreviewClient({
  userId,
  userName,
  userEmail,
  profile,
}: BuilderPreviewClientProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const isAr = profile?.appearance?.defaultLanguage === 'ar'

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-page)] text-[var(--color-text-primary)]">
      {/* Sticky top support toolbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/admin/users/${userId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            <span>Back to user</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold truncate">{userName || userEmail}</span>
              {profile && (
                <StatusBadge
                  status={profile.adminHidden ? 'HIDDEN' : profile.status}
                  size="sm"
                />
              )}
            </div>
            {profile?.username && (
              <span className="text-[11px] text-[var(--color-text-muted)] truncate block">
                /u/{profile.username}
              </span>
            )}
          </div>
        </div>

        {/* Device Mode Switcher */}
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-1">
          <button
            onClick={() => setDevice('desktop')}
            title="Desktop view"
            aria-label="Desktop view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
              device === 'desktop'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            title="Tablet view"
            aria-label="Tablet view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
              device === 'tablet'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            title="Mobile view"
            aria-label="Mobile view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
              device === 'mobile'
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right side status & action */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)] px-2 py-1 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
            <ShieldAlert className="h-3 w-3 text-[var(--color-warning)]" />
            Support mode (read-only)
          </span>

          {profile?.username && (
            <Link
              href={`/u/${profile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Live site</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Link>
          )}
        </div>
      </header>

      {/* Main Preview Workspace */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 bg-[var(--color-page)] flex justify-center">
        {!profile ? (
          <div className="m-auto text-center max-w-sm p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Globe className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">No portfolio created</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              This user has not yet initialized a public or draft portfolio profile.
            </p>
          </div>
        ) : (
          <div
            className={`transition-all duration-300 ease-in-out bg-[var(--color-surface)] ${
              device === 'desktop'
                ? 'w-full rounded-2xl border border-[var(--color-border)] shadow-xs overflow-hidden'
                : device === 'tablet'
                ? 'w-[768px] rounded-2xl border-2 border-[var(--color-border)] shadow-2xl overflow-hidden my-4'
                : 'w-[390px] rounded-3xl border-4 border-[var(--color-border)] shadow-2xl overflow-hidden my-4'
            }`}
          >
            <div dir={isAr ? 'rtl' : 'ltr'} className="w-full h-full min-h-[700px]">
              <ClassicTemplate profile={profile} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
