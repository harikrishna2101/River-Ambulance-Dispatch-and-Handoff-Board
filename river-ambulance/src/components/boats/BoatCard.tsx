import { Link } from 'react-router-dom'
import { Wind, Clock, Navigation, Anchor, AlertOctagon } from 'lucide-react'
import type { Boat, DispatchRequest } from '@/types'
import { BoatStatusBadge } from '@/components/ui/StatusBadge'
import { FuelBar } from '@/components/ui/FuelBar'
import { timeAgo, getOxygenLevel, resourceLevelInfo } from '@/utils'
import { cn } from '@/lib/utils'

interface BoatCardProps {
  boat: Boat
  activeRequest?: DispatchRequest | null
  activeRequestId?: string | null
}

export function BoatCard({ boat, activeRequest, activeRequestId }: BoatCardProps) {
  const o2Level = getOxygenLevel(boat.oxygen_tanks)
  const o2Info = resourceLevelInfo(o2Level)
  const activeReqId = activeRequest?.id || activeRequestId

  const isMaintenance = boat.status === 'MAINTENANCE'

  return (
    <Link
      to={`/handoff?boat=${boat.id}`}
      className={cn(
        'block glass-card rounded-xl p-4 transition-all duration-200',
        'hover:border-blue-400/40 hover:bg-blue-500/10 hover:shadow-xl active:scale-[0.99]',
        'border border-white/10 flex flex-col justify-between h-full min-h-[360px]',
        isMaintenance && 'opacity-80 bg-red-950/20 border-red-500/20'
      )}
      aria-label={`${boat.boat_number} (${boat.boat_name}) — Status: ${boat.status}. View or edit handoff`}
    >
      <div className="space-y-4">
        {/* 1. Header Section */}
        <div className="border-b border-white/10 pb-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-blue-100 font-extrabold text-lg tracking-tight">
              {boat.boat_number}
            </span>
            <BoatStatusBadge status={boat.status} />
          </div>
          <p className="text-blue-200/60 text-xs font-medium truncate">
            {boat.boat_name}
          </p>
        </div>

        {/* Maintenance State Banner */}
        {isMaintenance ? (
          <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 text-center space-y-1 my-4">
            <div className="flex items-center justify-center gap-1.5 text-red-400 font-bold text-xs uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Maintenance Mode</span>
            </div>
            <p className="text-[11px] text-red-200/70">Unavailable for dispatch</p>
          </div>
        ) : (
          <>
            {/* 2. Fuel Section */}
            <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-2">
              <FuelBar pct={boat.fuel_percentage} />
            </div>

            {/* 3. Oxygen Section */}
            <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-blue-200/70 font-medium">Oxygen</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('font-bold text-sm', boat.oxygen_tanks === 0 ? 'text-red-400 animate-pulse' : 'text-blue-100')}>
                  {boat.oxygen_tanks} {boat.oxygen_tanks === 1 ? 'tank' : 'tanks'}
                </span>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 shrink-0', o2Info.badgeClass)}>
                  <span>{o2Info.icon}</span>
                  <span>{o2Info.label}</span>
                </span>
              </div>
            </div>
          </>
        )}

        {/* 4. Current Assignment Section */}
        <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/50 block">
            Current Assignment
          </span>
          {activeReqId ? (
            <div className="flex items-center gap-2 text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-md p-2">
              <Navigation className="w-3.5 h-3.5 shrink-0 text-cyan-400 animate-pulse" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-xs">
                  {activeRequest ? activeRequest.pickup_location : `Req #${activeReqId}`}
                </p>
                {activeRequest?.urgency && (
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide block">
                    {activeRequest.urgency}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-200/40 bg-white/5 rounded-md p-2">
              <Anchor className="w-3.5 h-3.5 shrink-0 opacity-40" />
              <span className="text-xs font-medium">Unassigned</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Last Updated Section */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-blue-200/50 mt-3">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-300/60 shrink-0" />
          <span>Last updated</span>
        </div>
        <span className="font-semibold text-blue-100">{timeAgo(boat.updated_at)}</span>
      </div>
    </Link>
  )
}
