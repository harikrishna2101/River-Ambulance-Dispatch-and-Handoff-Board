import { cn } from '@/lib/utils'
import type { BoatStatus, DispatchStatus } from '@/types'
import { boatStatusLabel, dispatchStatusLabel } from '@/utils'

interface BoatStatusBadgeProps {
  status: BoatStatus
  className?: string
}

const BOAT_STATUS_STYLES: Record<BoatStatus, { class: string; icon: string }> = {
  AVAILABLE:   { class: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30', icon: '●' },
  ASSIGNED:    { class: 'text-blue-300 bg-blue-500/15 border-blue-500/30', icon: '●' },
  ON_TRIP:     { class: 'text-amber-300 bg-amber-500/15 border-amber-500/30', icon: '●' },
  MAINTENANCE: { class: 'text-red-300 bg-red-500/15 border-red-500/30', icon: '🔧' },
}

export function BoatStatusBadge({ status, className }: BoatStatusBadgeProps) {
  const style = BOAT_STATUS_STYLES[status] || BOAT_STATUS_STYLES.AVAILABLE
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0',
        style.class,
        className
      )}
    >
      <span className="text-[10px] leading-none">{style.icon}</span>
      <span>{boatStatusLabel(status)}</span>
    </span>
  )
}

interface DispatchStatusBadgeProps {
  status: DispatchStatus
  className?: string
}

const DISPATCH_STATUS_STYLES: Record<DispatchStatus, string> = {
  OPEN:       'text-amber-300 bg-amber-500/10 border-amber-500/30',
  ASSIGNED:   'text-blue-300 bg-blue-500/10 border-blue-500/30',
  ON_TRIP:    'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  COMPLETED:  'text-green-300 bg-green-500/10 border-green-500/30',
  CANCELLED:  'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

export function DispatchStatusBadge({ status, className }: DispatchStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0',
        DISPATCH_STATUS_STYLES[status],
        className
      )}
    >
      {dispatchStatusLabel(status)}
    </span>
  )
}
