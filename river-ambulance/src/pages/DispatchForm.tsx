import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/hooks/useSession'
import { createDispatch, getOpenDispatches } from '@/services/dispatch'
import type { UrgencyLevel, PatientCondition, CreateDispatchPayload } from '@/types'
import { CheckCircle2, MapPin, AlertTriangle, Clock } from 'lucide-react'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { DispatchStatusBadge } from '@/components/ui/StatusBadge'
import { timeAgo } from '@/utils'

const ISLANDS = ['Island A', 'Island B', 'Island C', 'Island D', 'Island E', 'Other']
const URGENCIES: UrgencyLevel[] = ['CRITICAL', 'HIGH', 'NORMAL']
const CONDITIONS: PatientCondition[] = ['CRITICAL', 'SERIOUS', 'STABLE', 'UNKNOWN']

const URGENCY_STYLE: Record<UrgencyLevel, string> = {
  CRITICAL: 'border-red-500/50 bg-red-500/15 text-red-300',
  HIGH:     'border-amber-500/40 bg-amber-500/10 text-amber-300',
  NORMAL:   'border-green-500/30 bg-green-500/10 text-green-300',
}

const URGENCY_ACTIVE: Record<UrgencyLevel, string> = {
  CRITICAL: 'ring-2 ring-red-400',
  HIGH:     'ring-2 ring-amber-400',
  NORMAL:   'ring-2 ring-green-400',
}

type FormStep = 'form' | 'success'

export function DispatchForm() {
  const { user } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<FormStep>('form')
  const [submittedId, setSubmittedId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [island, setIsland] = useState('')
  const [location, setLocation] = useState('')
  const [urgency, setUrgency] = useState<UrgencyLevel | ''>('')
  const [condition, setCondition] = useState<PatientCondition | ''>('')
  const [notes, setNotes] = useState('')

  const { data: recentRequests = [] } = useQuery({
    queryKey: ['dispatches', 'open'],
    queryFn: getOpenDispatches,
  })

  const mutation = useMutation({
    mutationFn: (payload: CreateDispatchPayload) => createDispatch(payload),
    onSuccess: (data) => {
      setSubmittedId(data.id)
      setStep('success')
      queryClient.invalidateQueries({ queryKey: ['dispatches'] })
    },
    onError: (error) => {
      console.error(error)
      setErrors({ submit: error.message })
    }
  })

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!island)    e.island    = 'Select a pickup location area.'
    if (!location.trim()) e.location = 'Enter specific pickup details.'
    if (!urgency)   e.urgency   = 'Select urgency level.'
    if (!condition) e.condition = 'Select patient condition.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (mutation.isPending) return

    const payload: CreateDispatchPayload = {
      pickup_location: `${island} - ${location.trim()}`,
      urgency: urgency as UrgencyLevel,
      patient_condition: condition as PatientCondition,
      notes: notes.trim() || undefined,
      requested_by: user?.display_name ?? 'Unknown',
    }

    mutation.mutate(payload)
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-slide-up px-4">
        <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
        <h2 className="text-2xl font-bold text-green-300 mb-2">Request Submitted</h2>
        <p className="text-blue-200/60 text-base mb-2">ID: <span className="font-mono font-bold text-blue-100">{submittedId.split('-')[0]}</span></p>
        <div className="bg-black/20 p-4 rounded-xl mb-8 w-full max-w-sm mx-auto">
          <div className="flex justify-between items-start mb-1">
            <p className="text-blue-100 text-sm">{island} - {location}</p>
            <DispatchStatusBadge status="OPEN" />
          </div>
          <p className="text-blue-200/50 text-xs text-left">Urgency: <strong className="text-blue-100">{urgency}</strong> · Condition: <strong className="text-blue-100">{condition}</strong></p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button
            size="lg"
            variant="ghost"
            onClick={() => { setStep('form'); setIsland(''); setLocation(''); setUrgency(''); setCondition(''); setNotes('') }}
            className="w-full"
          >
            New Request
          </Button>
          <Button size="lg" onClick={() => navigate('/')} className="w-full">
            Back to Board
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-slide-up pb-8">
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <div>
          <h2 className="text-xl font-bold text-blue-50 mb-1">Open Dispatch</h2>
          <p className="text-sm text-blue-200/50">Submit an emergency transport request.</p>
        </div>

        {/* Island */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-blue-200">
            Pickup Area <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ISLANDS.map(isl => (
              <button
                key={isl}
                type="button"
                onClick={() => { setIsland(isl); setErrors(p => ({ ...p, island: '' })) }}
                className={`h-14 rounded-xl text-sm font-bold border transition-all active:scale-95
                  ${island === isl
                    ? 'bg-blue-500/20 border-blue-400/50 text-blue-200 ring-2 ring-blue-400/20'
                    : 'glass border-white/10 text-blue-200/60 hover:border-white/20'}`}
              >
                <MapPin className="w-4 h-4 inline-block mr-1.5 opacity-60" />
                {isl}
              </button>
            ))}
          </div>
          {errors.island && <p className="text-red-400 text-sm font-medium">{errors.island}</p>}
        </div>

        {/* Location */}
        <div className="space-y-3">
          <label htmlFor="location" className="block text-sm font-semibold text-blue-200">
            Specific Location <span className="text-red-400">*</span>
          </label>
          <input
            id="location"
            type="text"
            placeholder="e.g. North jetty, near fish market"
            value={location}
            onChange={e => { setLocation(e.target.value); setErrors(p => ({ ...p, location: '' })) }}
            className="w-full glass rounded-xl px-4 h-14 text-base text-blue-50
              placeholder:text-blue-200/30 border border-white/10 focus:border-blue-400/50
              focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition"
          />
          {errors.location && <p className="text-red-400 text-sm font-medium">{errors.location}</p>}
        </div>

        {/* Urgency */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-blue-200">
            Urgency <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            {URGENCIES.map(u => (
              <button
                key={u}
                type="button"
                onClick={() => { setUrgency(u); setErrors(p => ({ ...p, urgency: '' })) }}
                className={`flex-1 h-14 rounded-xl text-sm font-bold uppercase tracking-wide border
                  transition-all active:scale-95 flex items-center justify-center ${URGENCY_STYLE[u]}
                  ${urgency === u ? URGENCY_ACTIVE[u] : 'opacity-60 hover:opacity-100'}`}
              >
                {u === 'CRITICAL' && <AlertTriangle className="w-4 h-4 inline mr-1.5" />}
                {u}
              </button>
            ))}
          </div>
          {errors.urgency && <p className="text-red-400 text-sm font-medium">{errors.urgency}</p>}
        </div>

        {/* Patient condition */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-blue-200">
            Patient Condition <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { setCondition(c); setErrors(p => ({ ...p, condition: '' })) }}
                className={`h-14 rounded-xl text-sm font-bold border transition-all active:scale-95
                  ${condition === c
                    ? 'bg-blue-500/20 border-blue-400/50 text-blue-200 ring-2 ring-blue-400/30'
                    : 'glass border-white/10 text-blue-200/60 hover:border-white/20'}`}
              >
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {errors.condition && <p className="text-red-400 text-sm font-medium">{errors.condition}</p>}
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <label htmlFor="notes" className="block text-sm font-semibold text-blue-200">
            Notes <span className="text-blue-200/30">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Any additional information for the captain…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full glass rounded-xl px-4 py-3 text-base text-blue-50
              placeholder:text-blue-200/30 border border-white/10 focus:border-blue-400/50
              focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition resize-none"
          />
        </div>

        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm font-medium text-center">{errors.submit}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          variant={urgency === 'CRITICAL' ? 'danger' : 'primary'}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          className="w-full h-14 text-lg font-bold shadow-lg"
        >
          {urgency === 'CRITICAL' ? '🚨 Submit Critical Request' : 'Submit Request'}
        </Button>
      </form>

      {/* Recent Requests */}
      {recentRequests.length > 0 && (
        <div className="pt-8 border-t border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-blue-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Recent Open Requests
          </h3>
          <div className="space-y-3">
            {recentRequests.slice(0, 3).map(req => (
              <div key={req.id} className="glass p-4 rounded-xl flex flex-col gap-2 border border-white/5">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <UrgencyBadge urgency={req.urgency} />
                    <DispatchStatusBadge status={req.status} />
                  </div>
                  <span className="text-xs font-mono text-blue-200/40">
                    {req.id.split('-')[0]}
                  </span>
                </div>
                <div className="text-sm text-blue-50 font-medium">
                  {req.pickup_location}
                </div>
                <div className="text-xs text-blue-200/60">
                  Patient: {req.patient_condition} · {timeAgo(req.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
