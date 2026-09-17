import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDispatchHistory } from '@/services/history'
import { ISLANDS } from '@/lib/mockData'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DispatchStatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime, timeAgo } from '@/utils'
import { History, MapPin, Clock, User, Anchor, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useFleetRealtime } from '@/hooks/useFleetRealtime'

const ALL_ISLANDS = ['All Islands', ...ISLANDS, 'Other']

export function DispatchHistory() {
  useFleetRealtime()
  const [locationFilter, setLocationFilter] = useState('All Islands')

  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['dispatches', 'history'],
    queryFn: getDispatchHistory,
  })


  const filtered = history
    .filter(r => {
      if (locationFilter === 'All Islands') return true
      if (locationFilter === 'Other') return !ISLANDS.some(isl => r.pickup_location.includes(isl))
      return r.pickup_location.includes(locationFilter) || r.pickup_location.startsWith(locationFilter)
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-red-300 font-medium">Failed to load history</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-bold text-blue-100">Dispatch History</h2>
      </div>

      {/* Island filter */}
      <div>
        <p className="text-xs text-blue-200/40 mb-2 font-medium">Filter by Island</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {ALL_ISLANDS.map(isl => (
            <button
              key={isl}
              type="button"
              onClick={() => setLocationFilter(isl)}
              className={cn(
                'shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transition-all',
                locationFilter === isl
                  ? 'bg-blue-500/20 border-blue-400/50 text-blue-200'
                  : 'glass border-white/10 text-blue-200/50 hover:text-blue-200/80'
              )}
            >
              {isl}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-blue-200/40">
        {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        {locationFilter !== 'All Locations' && ` · ${locationFilter}`}
      </p>

      {/* List */}
      <div className="space-y-3">
        {isLoading
          ? (
            <div className="flex justify-center p-12">
              <span className="inline-block w-6 h-6 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
            </div>
          )
          : filtered.length === 0
          ? (
            <EmptyState
              icon={<History />}
              title="No records found"
              description="Try a different filter."
            />
          )
          : filtered.map(req => (
            <div
              key={req.id}
              className="glass rounded-xl px-4 py-3 space-y-2 animate-slide-up"
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <UrgencyBadge urgency={req.urgency} />
                  <DispatchStatusBadge status={req.status} />
                </div>
                <span className="text-xs font-mono text-blue-200/30">{req.id.split('-')[0]}</span>
              </div>

              {/* Location */}
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="w-4 h-4 text-blue-300/50 mt-0.5 shrink-0" />
                <span className="text-blue-100 font-medium">{req.pickup_location.split(' - ')[0]}</span>
                <span className="text-blue-200/50">— {req.pickup_location.split(' - ').slice(1).join(' - ') || req.pickup_location}</span>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-200/50">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {req.requested_by}
                </span>
                {req.boat && (
                  <span className="flex items-center gap-1">
                    <Anchor className="w-3 h-3" />
                    Boat {Array.isArray(req.boat) ? (req.boat[0] as any)?.boat_number : (req.boat as any)?.boat_number}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Created: {timeAgo(req.created_at)}
                </span>
                {req.status === 'COMPLETED' && req.completed_at && (
                  <span className="text-green-300/70">
                    ✓ {formatDateTime(req.completed_at)}
                  </span>
                )}
                {req.status === 'CANCELLED' && (
                  <span className="text-red-300/70">
                    ✕ Cancelled
                  </span>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
