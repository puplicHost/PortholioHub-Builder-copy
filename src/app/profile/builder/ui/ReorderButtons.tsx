'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

// Shared drag-handle styling for the sortable row lists (Projects, Experience).
// Rows spread {...attributes} {...listeners} onto a div carrying this class.
export const sortableRowHandleClass =
  'cursor-grab active:cursor-grabbing p-1 -ms-1 rounded hover:bg-black/5 dark:hover:bg-white/10 touch-none flex items-center justify-center shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]'

// Stacked up/down chevrons for keyboard-accessible reordering. Bundles the
// index/total/callbacks that always travel together on a sortable row.
export function ReorderButtons({
  index,
  total,
  upLabel,
  downLabel,
  onMoveUp,
  onMoveDown,
}: {
  index: number
  total: number
  upLabel: string
  downLabel: string
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      <button
        type="button"
        aria-label={upLabel}
        title={upLabel}
        disabled={index === 0}
        onClick={onMoveUp}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={downLabel}
        title={downLabel}
        disabled={index === total - 1}
        onClick={onMoveDown}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
