import { cn } from '@/lib/utils'
import type { UrgencyLevel } from '@/types'
import { urgencyLabel, urgencyClass } from '@/utils'

interface UrgencyBadgeProps {
  urgency: UrgencyLevel
  className?: string
  pulse?: boolean
}

export function UrgencyBadge({ urgency, className, pulse }: UrgencyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide',
        urgencyClass(urgency),
        pulse && urgency === 'CRITICAL' && 'animate-pulse-critical',
        className
      )}
    >
      {urgency === 'CRITICAL' && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {urgencyLabel(urgency)}
    </span>
  )
}
