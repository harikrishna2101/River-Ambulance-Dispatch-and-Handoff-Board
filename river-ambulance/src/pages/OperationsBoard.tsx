import { useQuery } from '@tanstack/react-query'
import { getBoats } from '@/services/boats'
import { getOpenDispatches } from '@/services/dispatch'
import { BoatCard } from '@/components/boats/BoatCard'
import { BoatCardSkeleton } from '@/components/ui/Skeleton'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DispatchStatusBadge } from '@/components/ui/StatusBadge'
import { useFleetRealtime } from '@/hooks/useFleetRealtime'
import { timeAgo } from '@/utils'
import { AlertTriangle, AlertCircle, Radio, Anchor, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

export function OperationsBoard() {
  // Subscribe to Supabase Realtime changes on boats and dispatches
  useFleetRealtime()

  const { data: boats = [], isLoading: loadingBoats, error: boatsError } = useQuery({
    queryKey: ['boats'],
    queryFn: getBoats,
  })

  const { data: requests = [], isLoading: loadingRequests, error: requestsError } = useQuery({
    queryKey: ['dispatches', 'open'],
    queryFn: getOpenDispatches,
  })

  const isLoading = loadingBoats || loadingRequests
  const error = boatsError || requestsError

  // Ensure BA-01 through BA-05 are sorted consistently
  const sortedBoats = [...boats].sort((a, b) => a.boat_number.localeCompare(b.boat_number))

  const urgencyWeight: Record<string, number> = { CRITICAL: 1, HIGH: 2, NORMAL: 3 }
  const openRequests = requests
    .filter(r => r.status === 'OPEN')
    .sort((a, b) => {
      if (urgencyWeight[a.urgency] !== urgencyWeight[b.urgency]) {
        return urgencyWeight[a.urgency] - urgencyWeight[b.urgency]
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  const criticalOpen = openRequests.filter(r => r.urgency === 'CRITICAL')
  const availableCount = boats.filter(b => b.status === 'AVAILABLE').length

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <div>
          <p className="text-red-300 font-medium">Failed to load operations data</p>
          <p className="text-sm text-red-300/60 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Top Summary Cards (Desktop: 4 cols, Tablet: 2 cols, Mobile: 2/1 cols) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Available Boats */}
        <div className="glass-card rounded-xl p-3.5 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Anchor className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-300 block leading-tight">
              {availableCount}
            </span>
            <span className="text-xs text-blue-200/60 font-medium">Available Boats</span>
          </div>
        </div>

        {/* Open Requests */}
        <div className="glass-card rounded-xl p-3.5 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className={`text-2xl font-black block leading-tight ${openRequests.length > 0 ? 'text-amber-300' : 'text-blue-100'}`}>
              {openRequests.length}
            </span>
            <span className="text-xs text-blue-200/60 font-medium">Open Requests</span>
          </div>
        </div>

        {/* Critical Requests */}
        <div className={`glass-card rounded-xl p-3.5 border flex items-center gap-3 transition ${
          criticalOpen.length > 0 
            ? 'bg-red-500/15 border-red-500/40 animate-pulse-critical' 
            : 'border-white/10'
        }`}>
          <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <span className={`text-2xl font-black block leading-tight ${criticalOpen.length > 0 ? 'text-red-300' : 'text-blue-200/40'}`}>
              {criticalOpen.length}
            </span>
            <span className="text-xs text-blue-200/60 font-medium">Critical Requests</span>
          </div>
        </div>

        {/* Realtime Live */}
        <div className="glass-card rounded-xl p-3.5 border border-emerald-500/30 bg-emerald-950/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              ● Realtime Live
            </span>
            <span className="text-[11px] text-emerald-200/60 font-medium">Connected to Supabase</span>
          </div>
        </div>
      </div>

      {/* ─── Fleet Status Board Section ─── */}
      <section className="space-y-3">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-white/10 pb-2">
          <div>
            <h1 className="text-xl font-black text-blue-100 tracking-tight">
              Fleet Status Board
            </h1>
            <p className="text-xs text-blue-200/60 font-semibold tracking-wider uppercase">
              BA-01 — BA-05
            </p>
          </div>
          <span className="text-xs font-bold text-blue-300 bg-blue-500/15 border border-blue-400/30 px-3 py-1 rounded-full">
            5 Boats Active
          </span>
        </div>

        {/* Responsive Grid for 5-boat Status Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <BoatCardSkeleton key={i} />)
            : sortedBoats.map(boat => {
                const activeReq = requests.find(
                  r => r.assigned_boat_id === boat.id && (r.status === 'ASSIGNED' || r.status === 'ON_TRIP')
                )
                return (
                  <BoatCard
                    key={boat.id}
                    boat={boat}
                    activeRequest={activeReq ?? null}
                  />
                )
              })
          }
        </div>
      </section>

      {/* ─── Open Requests Quick View ─── */}
      {openRequests.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-200/70">
              Active Open Requests ({openRequests.length})
            </h2>
            <Link
              to="/captain"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View captain queue →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {openRequests.map(req => (
              <div
                key={req.id}
                className="glass-card rounded-xl p-3.5 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <UrgencyBadge urgency={req.urgency} pulse className="shrink-0" />
                    <span className="font-bold text-sm text-blue-100 truncate">
                      {req.pickup_location}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/60 truncate">{req.patient_condition}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <DispatchStatusBadge status={req.status} />
                  <span className="text-[10px] text-blue-200/40">{timeAgo(req.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
