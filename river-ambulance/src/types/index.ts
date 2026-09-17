// ─── Enums ───────────────────────────────────────────────────────────────────

export type BoatStatus = 'AVAILABLE' | 'ASSIGNED' | 'ON_TRIP' | 'MAINTENANCE'

export type DispatchStatus = 'OPEN' | 'ASSIGNED' | 'ON_TRIP' | 'COMPLETED' | 'CANCELLED'

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'NORMAL'

export type PatientCondition = 'CRITICAL' | 'SERIOUS' | 'STABLE' | 'UNKNOWN'

export type UserRole = 'HEALTH_WORKER' | 'CAPTAIN' | 'SHIFT_HANDOFF' | 'DISPATCH_HISTORY'

export type DispatchEventType = 'REQUEST_CREATED' | 'JOB_CLAIMED' | 'JOB_STARTED' | 'JOB_COMPLETED' | 'JOB_CANCELLED' | 'HANDOFF_RECORDED'

// ─── Domain Entities ─────────────────────────────────────────────────────────

export interface Boat {
  id: string
  boat_number: string
  boat_name: string
  status: BoatStatus
  fuel_percentage: number
  oxygen_tanks: number
  current_location: string | null
  created_at: string
  updated_at: string
}

export interface DispatchRequest {
  id: string
  pickup_location: string
  urgency: UrgencyLevel
  patient_condition: PatientCondition
  notes: string | null
  requested_by: string
  status: DispatchStatus
  assigned_boat_id: string | null
  created_at: string
  claimed_at: string | null
  completed_at: string | null
  boat?: { boat_number: string; boat_name: string } | null
}


export interface DispatchEvent {
  id: string
  request_id: string | null
  boat_id: string | null
  event_type: DispatchEventType
  actor: string
  metadata: Record<string, any>
  created_at: string
}

export interface ShiftHandoff {
  id: string
  boat_id: string
  outgoing_captain: string
  incoming_captain: string
  fuel_percentage: number
  oxygen_tanks: number
  notes: string | null
  created_at: string
}

// ─── Form Payloads ───────────────────────────────────────────────────────────

export interface CreateDispatchPayload {
  pickup_location: string
  urgency: UrgencyLevel
  patient_condition: PatientCondition
  notes?: string
  requested_by: string
}

export interface ClaimDispatchPayload {
  dispatch_id: string
  captain_name: string
  boat_id: string
}

export interface ClaimResult {
  success: boolean
  error?: string
  message?: string
}

export interface HandoffPayload {
  boat_id: string
  outgoing_captain: string
  incoming_captain: string
  fuel_percentage: number
  oxygen_tanks: number
  notes?: string
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

export type CaptainName = 'Captain 1' | 'Captain 2' | 'Captain 3' | 'Captain 4' | 'Captain 5'

export interface AppUser {
  display_name: string
  role: UserRole
  selectedCaptain?: CaptainName
}

