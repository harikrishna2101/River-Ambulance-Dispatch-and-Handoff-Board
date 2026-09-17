import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-white/5',
        className
      )}
    />
  )
}

export function BoatCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-3.5 flex flex-col justify-between h-[210px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="h-7 w-full rounded-lg" />
      </div>
      <Skeleton className="h-3 w-32 pt-1" />
    </div>
  )
}


export function RequestCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}
