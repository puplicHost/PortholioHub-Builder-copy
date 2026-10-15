import { Skeleton } from '@/components/ui/Skeleton'

export default function RootLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-[var(--radius-lg)] mb-2" />
      <Skeleton className="h-12 w-full rounded-[var(--radius-lg)] mb-2" />
      <Skeleton className="h-12 w-2/3 rounded-[var(--radius-lg)]" />
    </div>
  )
}
