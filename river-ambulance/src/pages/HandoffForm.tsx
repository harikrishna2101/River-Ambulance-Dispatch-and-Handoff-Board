import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BoatStatusBadge } from '@/components/ui/StatusBadge'
import { FuelBar } from '@/components/ui/FuelBar'
import { Button } from '@/components/ui/Button'
import { useFleetRealtime } from '@/hooks/useFleetRealtime'
import { timeAgo, getOxygenLevel, resourceLevelInfo } from '@/utils'
import { useSession } from '@/hooks/useSession'
import { getBoats } from '@/services/boats'
import { getHandoffs, recordHandoff } from '@/services/handoffs'
import type { HandoffPayload } from '@/types'
import { CheckCircle2, Wind, Clock, AlertCircle, UserCheck, ClipboardList, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HandoffForm() {
  useFleetRealtime()
  const [searchParams] = useSearchParams()
  const { user } = useSession()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLDivElement>(null)

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: boats = [], isLoading: loadingBoats, error: boatsError } = useQuery({
    queryKey: ['boats'],
    queryFn: getBoats,
  })

  const { data: handoffs = [], isLoading: loadingHandoffs, error: handoffsError } = useQuery({
    queryKey: ['handoffs'],
    queryFn: getHandoffs,
  })

  const sortedBoats = [...boats].sort((a, b) => a.boat_number.localeCompare(b.boat_number))

  const initialBoatId = searchParams.get('boat')
  const [selectedBoatId, setSelectedBoatId] = useState<string | null>(initialBoatId)

  const activeBoatId = selectedBoatId || (sortedBoats[0]?.id ?? null)
  const boat = sortedBoats.find(b => b.id === activeBoatId) || sortedBoats[0]

  // Form State
  const [outgoingCaptain, setOutgoingCaptain] = useState(user?.display_name || 'Captain')
  const [incomingCaptain, setIncomingCaptain] = useState('Incoming Captain')
  const [fuel, setFuel] = useState('')
  const [o2, setO2] = useState('')
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState(false)
  const [submittedHandoff, setSubmittedHandoff] = useState<{ boatNumber: string; fuel: number; o2: number } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize input fields when boat or user changes
  const [prevBoatId, setPrevBoatId] = useState<string | null>(null)
  const [prevUser, setPrevUser] = useState(user?.display_name)

  if (boat && boat.id !== prevBoatId && !success) {
    setPrevBoatId(boat.id)
    setFuel(String(boat.fuel_percentage))
    setO2(String(boat.oxygen_tanks))
  }

  if (user?.display_name && user.display_name !== prevUser) {
    setPrevUser(user.display_name)
    setOutgoingCaptain(user.display_name)
  }


  // ─── Mutation ──────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (payload: HandoffPayload) => recordHandoff(payload),
    onSuccess: (_, variables) => {
      setSuccess(true)
      setSubmittedHandoff({
        boatNumber: boat?.boat_number || '',
        fuel: variables.fuel_percentage,
        o2: variables.oxygen_tanks,
      })
      queryClient.invalidateQueries({ queryKey: ['boats'] })
      queryClient.invalidateQueries({ queryKey: ['handoffs'] })
      queryClient.invalidateQueries({ queryKey: ['dispatches'] })
    },
    onError: (err: Error) => {
      console.error(err)
      setErrors({ submit: err.message || 'Failed to record handoff.' })
    }
  })

  // ─── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {}
    
    // Outgoing & Incoming captain
    if (!outgoingCaptain.trim()) e.outgoingCaptain = 'Outgoing captain name is required.'
    if (!incomingCaptain.trim()) e.incomingCaptain = 'Incoming captain name is required.'

    // Fuel percentage: 0 - 100
    const fuelNum = Number(fuel)
    if (fuel.trim() === '' || isNaN(fuelNum)) {
      e.fuel = 'Fuel percentage is required.'
    } else if (fuelNum < 0 || fuelNum > 100) {
      e.fuel = 'Fuel percentage must be between 0 and 100.'
    }

    // Oxygen tanks: 0 - 20
    const o2Num = Number(o2)
    if (o2.trim() === '' || isNaN(o2Num) || !Number.isInteger(o2Num)) {
      e.o2 = 'Oxygen tanks must be a whole number.'
    } else if (o2Num < 0 || o2Num > 20) {
      e.o2 = 'Oxygen tanks must be between 0 and 20.'
    }

    // Notes max 500 characters
    if (notes.length > 500) {
      e.notes = 'Notes cannot exceed 500 characters.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !boat) return
    if (mutation.isPending) return

    const payload: HandoffPayload = {
      boat_id: boat.id,
      outgoing_captain: outgoingCaptain.trim(),
      incoming_captain: incomingCaptain.trim(),
      fuel_percentage: Number(fuel),
      oxygen_tanks: Number(o2),
      notes: notes.trim() || undefined,
    }

    mutation.mutate(payload)
  }

  function handleSelectBoat(bId: string) {
    setSelectedBoatId(bId)
    setSuccess(false)
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const isLoading = loadingBoats || loadingHandoffs
  const error = boatsError || handoffsError

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-red-300 font-medium">Failed to load handoff data</p>
        <p className="text-xs text-red-300/60">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-blue-50 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-400" />
          Shift Handoff Board
        </h1>
        <p className="text-xs text-blue-200/50 mt-1">
          Review five-boat status & record shift handoffs for fuel and oxygen supplies.
        </p>
      </div>

      {/* ─── 1. Five Boats Overview Board ───────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-200/50">
          Five-Boat Status & Latest Handoffs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-48 glass rounded-xl animate-pulse" />
            ))
          ) : (
            sortedBoats.map(b => {
              const latestHandoff = handoffs.find(h => h.boat_id === b.id)
              const o2Level = getOxygenLevel(b.oxygen_tanks)
              const o2Info = resourceLevelInfo(o2Level)

              return (
                <div
                  key={b.id}
                  className={cn(
                    'glass rounded-xl p-4 space-y-3.5 flex flex-col justify-between transition-all border',
                    selectedBoatId === b.id ? 'border-blue-400/50 bg-blue-500/10' : 'border-white/5'
                  )}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-100 font-extrabold text-base">{b.boat_number}</span>
                        <span className="text-blue-200/40 text-xs truncate max-w-[100px]">{b.boat_name}</span>
                      </div>
                      <BoatStatusBadge status={b.status} />
                    </div>

                    {/* Fuel & Oxygen Snapshot */}
                    <FuelBar pct={b.fuel_percentage} />

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-blue-200/70 font-medium">Oxygen</span>
                        <span className="font-bold text-blue-100">{b.oxygen_tanks} tanks</span>
                      </div>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border flex items-center gap-1', o2Info.badgeClass)}>
                        <span>{o2Info.icon}</span>
                        <span>{o2Info.label}</span>
                      </span>
                    </div>

                    {/* Latest Handoff Info */}
                    <div className="bg-white/5 rounded-lg p-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-blue-200/50 text-[11px]">
                        <span className="font-semibold text-blue-200/70 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          Latest Handoff
                        </span>
                        <span>{latestHandoff ? timeAgo(latestHandoff.created_at) : 'None'}</span>
                      </div>

                      {latestHandoff ? (
                        <div className="space-y-1 text-[11px] text-blue-200/80">
                          <p className="truncate">
                            <span className="text-blue-300">Captains:</span> {latestHandoff.outgoing_captain} → {latestHandoff.incoming_captain}
                          </p>
                          <p>
                            <span className="text-blue-300">Logged:</span> {latestHandoff.fuel_percentage}% Fuel · {latestHandoff.oxygen_tanks} O₂ tanks
                          </p>
                          {latestHandoff.notes && (
                            <p className="italic text-blue-200/50 truncate">"{latestHandoff.notes}"</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-blue-200/40 italic">No previous handoffs recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant={selectedBoatId === b.id ? 'primary' : 'outline'}
                    className="w-full text-xs"
                    onClick={() => handleSelectBoat(b.id)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Record Handoff ({b.boat_number})
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* ─── 2. Shift Handoff Form ─────────────────────────────────────────── */}
      <section ref={formRef} className="pt-4 border-t border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-blue-100 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-400" />
            Record Shift Handoff Form
          </h2>
          {boat && (
            <span className="text-xs text-blue-300 font-semibold bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-400/20">
              Selected: {boat.boat_number}
            </span>
          )}
        </div>

        {success ? (
          <div className="glass rounded-xl p-6 text-center space-y-3 animate-slide-up border border-emerald-500/30">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-emerald-300">Handoff Recorded Successfully!</h3>
            {submittedHandoff && (
              <div className="text-xs text-blue-200/80 space-y-1 bg-white/5 p-3 rounded-lg max-w-sm mx-auto">
                <p className="font-semibold text-blue-100">{submittedHandoff.boatNumber} updated in database</p>
                <p>New Fuel Level: <span className="font-bold text-emerald-400">{submittedHandoff.fuel}%</span></p>
                <p>New Oxygen Tanks: <span className="font-bold text-cyan-400">{submittedHandoff.o2} tanks</span></p>
              </div>
            )}
            <Button
              className="mt-4"
              onClick={() => {
                setSuccess(false)
                setNotes('')
              }}
            >
              Record Another Handoff
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-xl p-5 space-y-5 animate-slide-up" noValidate>
            
            {/* Boat Selector Pills */}
            <div>
              <label className="block text-xs font-semibold text-blue-200 mb-2">
                1. Select Boat <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {sortedBoats.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBoatId(b.id)
                      setErrors({})
                    }}
                    className={cn(
                      'h-11 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5',
                      selectedBoatId === b.id
                        ? 'bg-blue-500/20 border-blue-400/50 text-blue-100 ring-2 ring-blue-400/20'
                        : 'glass border-white/10 text-blue-200/50 hover:border-white/20'
                    )}
                  >
                    <span>{b.boat_number}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Captain Names Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="outgoing-captain" className="block text-xs font-semibold text-blue-200 mb-1.5">
                  Outgoing Captain <span className="text-red-400">*</span>
                </label>
                <input
                  id="outgoing-captain"
                  type="text"
                  value={outgoingCaptain}
                  onChange={e => {
                    setOutgoingCaptain(e.target.value)
                    setErrors(p => ({ ...p, outgoingCaptain: '' }))
                  }}
                  className="w-full glass rounded-lg px-3.5 h-10 text-sm text-blue-50 border border-white/10 focus:border-blue-400/50 focus:outline-none transition"
                />
                {errors.outgoingCaptain && <p className="text-red-400 text-xs mt-1">{errors.outgoingCaptain}</p>}
              </div>

              <div>
                <label htmlFor="incoming-captain" className="block text-xs font-semibold text-blue-200 mb-1.5">
                  Incoming Captain <span className="text-red-400">*</span>
                </label>
                <input
                  id="incoming-captain"
                  type="text"
                  value={incomingCaptain}
                  onChange={e => {
                    setIncomingCaptain(e.target.value)
                    setErrors(p => ({ ...p, incomingCaptain: '' }))
                  }}
                  className="w-full glass rounded-lg px-3.5 h-10 text-sm text-blue-50 border border-white/10 focus:border-blue-400/50 focus:outline-none transition"
                />
                {errors.incomingCaptain && <p className="text-red-400 text-xs mt-1">{errors.incomingCaptain}</p>}
              </div>
            </div>

            {/* Fuel & Oxygen Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fuel Percentage (0 - 100) */}
              <div>
                <label htmlFor="fuel-percentage" className="block text-xs font-semibold text-blue-200 mb-1.5">
                  Fuel Percentage (0–100%) <span className="text-red-400">*</span>
                </label>
                <input
                  id="fuel-percentage"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0 - 100"
                  value={fuel}
                  onChange={e => {
                    setFuel(e.target.value)
                    setErrors(p => ({ ...p, fuel: '' }))
                  }}
                  className={cn(
                    'w-full glass rounded-lg px-3.5 h-10 text-sm text-blue-50 border transition',
                    errors.fuel ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-blue-400/50'
                  )}
                />
                {errors.fuel && <p className="text-red-400 text-xs mt-1 font-medium">{errors.fuel}</p>}
              </div>

              {/* Oxygen Tanks (0 - 20) */}
              <div>
                <label htmlFor="oxygen-tanks" className="block text-xs font-semibold text-blue-200 mb-1.5">
                  Oxygen Tanks (0–20 tanks) <span className="text-red-400">*</span>
                </label>
                <input
                  id="oxygen-tanks"
                  type="number"
                  min={0}
                  max={20}
                  step={1}
                  placeholder="0 - 20"
                  value={o2}
                  onChange={e => {
                    setO2(e.target.value)
                    setErrors(p => ({ ...p, o2: '' }))
                  }}
                  className={cn(
                    'w-full glass rounded-lg px-3.5 h-10 text-sm text-blue-50 border transition',
                    errors.o2 ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-blue-400/50'
                  )}
                />
                {errors.o2 && <p className="text-red-400 text-xs mt-1 font-medium">{errors.o2}</p>}
              </div>
            </div>

            {/* Notes Field (max 500 characters) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="handoff-notes" className="text-xs font-semibold text-blue-200">
                  Handoff Notes <span className="text-blue-200/40">(optional)</span>
                </label>
                <span className={cn('text-[11px]', notes.length > 500 ? 'text-red-400 font-bold' : 'text-blue-200/40')}>
                  {notes.length} / 500 characters
                </span>
              </div>
              <textarea
                id="handoff-notes"
                rows={3}
                maxLength={500}
                placeholder="Shift summary, maintenance observations, equipment updates..."
                value={notes}
                onChange={e => {
                  setNotes(e.target.value)
                  setErrors(p => ({ ...p, notes: '' }))
                }}
                className={cn(
                  'w-full glass rounded-lg px-3.5 py-2.5 text-sm text-blue-50 border transition resize-none',
                  errors.notes ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-blue-400/50'
                )}
              />
              {errors.notes && <p className="text-red-400 text-xs mt-1">{errors.notes}</p>}
            </div>

            {errors.submit && <p className="text-red-400 text-xs text-center font-medium">{errors.submit}</p>}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={mutation.isPending}
            >
              Submit Shift Handoff ({boat?.boat_number || 'BA-01'})
            </Button>
          </form>
        )}
      </section>
    </div>
  )
}

