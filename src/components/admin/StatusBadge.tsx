import React from 'react'

export type StatusType =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELED'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'HIDDEN'
  | 'confirmed'
  | 'failed'
  | 'pending'
  | 'active'
  | 'inactive'
  | string

interface StatusBadgeProps {
  status: StatusType
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

type Variant = 'success' | 'warning' | 'danger' | 'neutral'

function getVariant(status: string): Variant {
  const s = status.toUpperCase().trim()
  switch (s) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'PUBLISHED':
    case 'CONFIRMED':
    case 'SUCCESS':
      return 'success'

    case 'PENDING':
    case 'DRAFT':
    case 'GRACE':
    case 'WARNING':
      return 'warning'

    case 'SUSPENDED':
    case 'REJECTED':
    case 'CANCELED':
    case 'FAILED':
    case 'HIDDEN':
    case 'INACTIVE':
      return 'danger'

    default:
      return 'neutral'
  }
}

const variantStyles: Record<Variant, { badge: string; dot: string }> = {
  success: {
    badge: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25',
    dot: 'bg-[var(--color-success)]',
  },
  warning: {
    badge: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/25',
    dot: 'bg-[var(--color-warning)]',
  },
  danger: {
    badge: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25',
    dot: 'bg-[var(--color-danger)]',
  },
  neutral: {
    badge: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
    dot: 'bg-[var(--color-text-muted)]',
  },
}

function formatLabel(status: string): string {
  if (!status) return ''
  return status
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function StatusBadge({ status, label, className = '', size = 'sm' }: StatusBadgeProps) {
  const variant = getVariant(status)
  const styles = variantStyles[variant]
  const displayLabel = label || formatLabel(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${styles.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${styles.dot}`} aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  )
}
