import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RequestCard } from '@/components/dispatch/RequestCard'
import { RequestCardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useSession } from '@/hooks/useSession'
import { useFleetRealtime } from '@/hooks/useFleetRealtime'
import { getOpenDispatches, claimDispatch, startDispatch, completeDispatch } from '@/services/dispatch'
import { getDispatchHistory } from '@/services/history'
import { getBoats } from '@/services/boats'
import { URGENCY_ORDER, timeAgo } from '@/utils'
import { Anchor, AlertCircle, CheckCircle2, Navigation, Ship } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CaptainQueue() {
  useFleetRealtime()
  const { user } = useSession()
  const queryClient = useQueryClient()
  const [selectedBoatId, setSelectedBoatId] = useState<string | null>(null)
  const [conflictError, setConflictError] = useState<string | null>(null)
  
  // Track mutating states individually
  const [startingId, setStartingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: boats = [], isLoading: loadingBoats } = useQuery({
    queryKey: ['boats'],
    queryFn: getBoats,
  })

  const { data: requests = [], isLoading: loadingRequests, error } = useQuery({
    queryKey: ['dispatches', 'open'],
    queryFn: getOpenDispatches,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['dispatches', 'history'],
    queryFn: getDispatchHistory,
  })


  // ─── Auto-select boat ───────────────────────────────────────────────────
  // If no boat is selected, default to the first one available or assigned to this captain (if we had a mapping)
  if (!selectedBoatId && boats.length > 0) {
    setSelectedBoatId(boats[0].id)
  }

  const selectedBoat = boats.find(b => b.id === selectedBoatId)

  // ─── Filter & Sort ───────────────────────────────────────────────────────
  const activeAssignment = useMemo(() => {
    if (!selectedBoatId) return null
    return requests.find(r => r.assigned_boat_id === selectedBoatId && (r.status === 'ASSIGNED' || r.status === 'ON_TRIP')) || null
  }, [requests, selectedBoatId])

  const openRequests = useMemo(() => {
    return requests
      .filter(r => r.status === 'OPEN')
      .sort((a, b) => {
        const uDiff = (URGENCY_ORDER?.[a.urgency] ?? 0) - (URGENCY_ORDER?.[b.urgency] ?? 0)
        if (uDiff !== 0) return uDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() // newest first for equal urgency
      })
  }, [requests])

  const completedJobs = useMemo(() => {
    if (!selectedBoatId) return []
    return history.filter(r => r.assigned_boat_id === selectedBoatId && r.status === 'COMPLETED').slice(0, 5)
  }, [history, selectedBoatId])

  // ─── Mutations ───────────────────────────────────────────────────────────
  const claimMutation = useMutation({
    mutationFn: ({ requestId, boatId }: { requestId: string; boatId: string }) =>
      claimDispatch(requestId, boatId, user?.display_name || 'Captain'),
    onSuccess: (data) => {
      if (data && 'success' in data && data.success === false) {
        setConflictError("This request was just claimed by another captain.")
      } else {
        setConflictError(null)
      }
      queryClient.invalidateQueries({ queryKey: ['dispatches'] })
      queryClient.invalidateQueries({ queryKey: ['boats'] })
    }
  })

  const startMutation = useMutation({
    mutationFn: ({ requestId, boatId }: { requestId: string; boatId: string }) =>
      startDispatch(requestId, boatId, user?.display_name || 'Captain'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] })
      queryClient.invalidateQueries({ queryKey: ['boats'] })
    },
    onSettled: () => setStartingId(null)
  })

  const completeMutation = useMutation({
    mutationFn: ({ requestId, boatId }: { requestId: string; boatId: string }) =>
      completeDispatch(requestId, boatId, user?.display_name || 'Captain'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] })
      queryClient.invalidateQueries({ queryKey: ['boats'] })
    },
    onSettled: () => setCompletingId(null)
  })

  // ─── Handlers ────────────────────────────────────────────────────────────
  function handleClaim(requestId: string) {
    if (!selectedBoatId || claimMutation.isPending) return
    if (activeAssignment) {
      setConflictError("You already have an active assignment. Complete it before claiming another.")
      return
    }
    setConflictError(null)
    claimMutation.mutate({ requestId, boatId: selectedBoatId })
  }

  function handleStart(requestId: string) {
    if (!selectedBoatId) return
    setStartingId(requestId)
    startMutation.mutate({ requestId, boatId: selectedBoatId })
  }

  function handleComplete(requestId: string) {
    if (!selectedBoatId) return
    setCompletingId(requestId)
    completeMutation.mutate({ requestId, boatId: selectedBoatId })
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-red-300 font-medium">Failed to load requests</p>
      </div>
    )
  }

  const isLoading = loadingRequests || loadingBoats

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* 1. Boat Selection */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-blue-100 flex items-center gap-2">
          <Ship className="w-4 h-4 text-blue-400" />
          Select Your Boat
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-24 h-12 rounded-xl glass border-white/5 animate-pulse" />
            ))
          ) : (
            boats.map(boat => (
              <button
                key={boat.id}
                onClick={() => { setSelectedBoatId(boat.id); setConflictError(null) }}
                className={cn(
                  'shrink-0 h-12 px-4 rounded-xl text-sm font-bold border transition-all',
                  selectedBoatId === boat.id
                    ? 'bg-blue-500/20 border-blue-400/50 text-blue-100 ring-2 ring-blue-400/20'
                    : 'glass border-white/10 text-blue-200/50 hover:text-blue-200/80 hover:bg-white/5'
                )}
              >
                {boat.boat_number}
              </button>
            ))
          )}
        </div>
        {selectedBoat && (
          <p className="text-xs text-blue-200/50">
            Currently operating as: <span className="font-semibold text-blue-200">{selectedBoat.boat_name}</span> ({selectedBoat.status})
          </p>
        )}
      </section>

      {/* Conflict banner */}
      {conflictError && (
        <div role="alert" className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-300 font-medium animate-slide-up">
          ⚡ {conflictError}
        </div>
      )}

      {/* 2. Current Assignment */}
      {activeAssignment && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-blue-100 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            Current Assignment
          </h2>
          <div className="ring-2 ring-emerald-500/30 rounded-xl">
            <RequestCard
              request={activeAssignment}
              showStartButton
              showCompleteButton
              onStart={handleStart}
              onComplete={handleComplete}
              starting={startingId === activeAssignment.id}
              completing={completingId === activeAssignment.id}
            />
          </div>
        </section>
      )}

      {/* 3. Open Dispatch Queue */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-blue-100 flex items-center gap-2">
            <Anchor className="w-4 h-4 text-blue-400" />
            Open Dispatches
          </h2>
          <span className="text-xs text-blue-200/40 font-medium">
            {openRequests.length} available
          </span>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <RequestCardSkeleton key={i} />)
          ) : openRequests.length === 0 ? (
            <EmptyState
              icon={<Anchor />}
              title="No open requests"
              description="The queue is clear. Wait for new emergency requests."
            />
          ) : (
            openRequests.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                showClaimButton
                onClaim={handleClaim}
                claiming={claimMutation.variables?.requestId === req.id && claimMutation.isPending}
              />
            ))
          )}
        </div>
      </section>

      {/* 4. Completed Jobs */}
      {completedJobs.length > 0 && (
        <section className="space-y-3 pt-6 border-t border-white/5">
          <h2 className="text-sm font-bold text-blue-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            Recent Completed Jobs
          </h2>
          <div className="space-y-2">
            {completedJobs.map(job => (
              <div key={job.id} className="glass px-4 py-3 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-blue-50 truncate">{job.pickup_location}</span>
                  <span className="text-xs text-blue-200/50">
                    Patient: {job.patient_condition}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono text-blue-200/30">
                    {job.id.split('-')[0]}
                  </span>
                  <span className="text-xs text-emerald-400/80 mt-1">
                    {job.completed_at ? timeAgo(job.completed_at) : 'Done'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
