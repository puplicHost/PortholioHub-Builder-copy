interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={`animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] ${className}`}
        />
      ))}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] p-6 space-y-4">
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}
