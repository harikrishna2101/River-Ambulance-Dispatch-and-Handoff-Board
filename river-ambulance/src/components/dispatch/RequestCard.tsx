import { MapPin, Clock, User, Check } from 'lucide-react'
import type { DispatchRequest } from '@/types'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DispatchStatusBadge } from '@/components/ui/StatusBadge'
import { timeAgo } from '@/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface RequestCardProps {
  request: DispatchRequest
  showClaimButton?: boolean
  showStartButton?: boolean
  showCompleteButton?: boolean
  onClaim?: (requestId: string) => void
  onStart?: (requestId: string) => void
  onComplete?: (requestId: string) => void
  claiming?: boolean
  starting?: boolean
  completing?: boolean
}

export function RequestCard({
  request,
  showClaimButton,
  showStartButton,
  showCompleteButton,
  onClaim,
  onStart,
  onComplete,
  claiming,
  starting,
  completing
}: RequestCardProps) {
  const isCritical = request.urgency === 'CRITICAL'

  return (
    <div
      className={cn(
        'glass rounded-xl p-4 space-y-3 animate-slide-up',
        'border transition-all duration-150',
        isCritical
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-transparent'
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <UrgencyBadge urgency={request.urgency} pulse={request.status === 'OPEN'} />
          <DispatchStatusBadge status={request.status} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-blue-200/40 shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(request.created_at)}
          </span>
          <span className="text-xs font-mono text-blue-200/30 mt-1">{request.id.split('-')[0]}</span>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-1.5 text-sm">
        <MapPin className="w-4 h-4 text-blue-300/60 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-blue-100">{request.pickup_location.split(' - ')[0]}</span>
          <span className="text-blue-200/60"> — {request.pickup_location.split(' - ').slice(1).join(' - ') || request.pickup_location}</span>
        </div>
      </div>

      {/* Condition + requester */}
      <div className="flex items-center justify-between text-xs text-blue-200/50">
        <span>
          Patient: <span className="text-blue-200/80 font-medium">{request.patient_condition}</span>
        </span>
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {request.requested_by}
        </span>
      </div>

      {/* Notes */}
      {request.notes && (
        <p className="text-xs text-blue-200/60 italic line-clamp-2">{request.notes}</p>
      )}

      {/* Captain info if claimed */}
      {request.assigned_boat_id && (
        <p className="text-xs text-cyan-300/80">
          Assigned to Boat <span className="font-semibold">{request.assigned_boat_id}</span>
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        {showClaimButton && request.status === 'OPEN' && onClaim && (
          <Button
            type="button"
            disabled={claiming}
            loading={claiming}
            onClick={() => onClaim(request.id)}
            variant={isCritical ? 'danger' : 'primary'}
            className="w-full"
          >
            CLAIM JOB
          </Button>
        )}
        
        {showStartButton && request.status === 'ASSIGNED' && onStart && (
          <Button
            type="button"
            disabled={starting}
            loading={starting}
            onClick={() => onStart(request.id)}
            variant="primary"
            className="w-full"
          >
            START TRIP
          </Button>
        )}
        
        {showCompleteButton && request.status === 'ON_TRIP' && onComplete && (
          <Button
            type="button"
            disabled={completing}
            loading={completing}
            onClick={() => {
              if (window.confirm('Are you sure you want to complete this job?')) {
                onComplete(request.id)
              }
            }}
            variant="success"
            className="w-full"
          >
            <Check className="w-4 h-4 mr-2" />
            COMPLETE JOB
          </Button>
        )}
      </div>
    </div>
  )
}
