import { supabase } from '../lib/supabase'
import type { DispatchRequest, CreateDispatchPayload, ClaimResult } from '../types'
import { INITIAL_MOCK_DISPATCHES, INITIAL_MOCK_BOATS, INITIAL_MOCK_HISTORY } from '../lib/mockData'

export async function getOpenDispatches(): Promise<DispatchRequest[]> {
  try {
    const { data, error } = await supabase
      .from('dispatch_requests')
      .select('id, pickup_location, urgency, patient_condition, notes, requested_by, status, assigned_boat_id, created_at, claimed_at, completed_at')
      .in('status', ['OPEN', 'ASSIGNED', 'ON_TRIP'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data
    }
  } catch {
    // ignore
  }

  return INITIAL_MOCK_DISPATCHES
}

export async function createDispatch(payload: CreateDispatchPayload): Promise<DispatchRequest> {
  try {
    const { data, error } = await supabase
      .from('dispatch_requests')
      .insert([payload])
      .select()
      .single()

    if (!error && data) {
      try {
        await supabase
          .from('dispatch_events')
          .insert([{
            request_id: data.id,
            event_type: 'REQUEST_CREATED',
            actor: payload.requested_by,
            metadata: { urgency: payload.urgency }
          }])
      } catch {
        // ignore event error
      }
      return data
    }
  } catch {
    // fallback
  }

  const newReq: DispatchRequest = {
    id: `req-${Date.now()}`,
    ...payload,
    notes: payload.notes || null,
    status: 'OPEN',
    assigned_boat_id: null,
    claimed_at: null,
    completed_at: null,
    created_at: new Date().toISOString(),
  }
  INITIAL_MOCK_DISPATCHES.unshift(newReq)
  return newReq
}

export async function claimDispatch(
  requestId: string,
  boatId: string,
  captainName: string
): Promise<ClaimResult> {
  try {
    const { data, error } = await supabase.rpc('claim_dispatch_request', {
      p_request_id: requestId,
      p_boat_id: boatId,
      p_captain_name: captainName,
    })

    if (!error && data) return data
  } catch {
    // fallback
  }

  const req = INITIAL_MOCK_DISPATCHES.find(r => r.id === requestId)
  const boat = INITIAL_MOCK_BOATS.find(b => b.id === boatId)
  if (req && boat && req.status === 'OPEN' && boat.status === 'AVAILABLE') {
    req.status = 'ASSIGNED'
    req.assigned_boat_id = boatId
    req.claimed_at = new Date().toISOString()
    boat.status = 'ASSIGNED'
    return { success: true }
  }
  return { success: false, error: 'Conflict or invalid state' }
}

export async function startDispatch(
  requestId: string,
  boatId: string,
  actor: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('start_dispatch', {
      p_request_id: requestId,
      p_boat_id: boatId,
      p_actor: actor,
    })

    if (!error && data) return data
  } catch {
    // fallback
  }

  const req = INITIAL_MOCK_DISPATCHES.find(r => r.id === requestId)
  const boat = INITIAL_MOCK_BOATS.find(b => b.id === boatId)
  if (req && boat && req.status === 'ASSIGNED' && boat.status === 'ASSIGNED') {
    req.status = 'ON_TRIP'
    boat.status = 'ON_TRIP'
    return { success: true }
  }
  return { success: false, error: 'Invalid start transition' }
}

export async function completeDispatch(
  requestId: string,
  boatId: string,
  actor: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('complete_dispatch', {
      p_request_id: requestId,
      p_boat_id: boatId,
      p_actor: actor,
    })

    if (!error && data) return data
  } catch {
    // fallback
  }

  const index = INITIAL_MOCK_DISPATCHES.findIndex(r => r.id === requestId)
  if (index !== -1) {
    const req = INITIAL_MOCK_DISPATCHES[index]
    const boat = INITIAL_MOCK_BOATS.find(b => b.id === boatId)
    
    if (req.status === 'ON_TRIP' && boat && boat.status === 'ON_TRIP') {
      const [completedReq] = INITIAL_MOCK_DISPATCHES.splice(index, 1)
      completedReq.status = 'COMPLETED'
      completedReq.completed_at = new Date().toISOString()
      
      // Also attach boat info for history
      completedReq.boat = { boat_number: boat.boat_number, boat_name: boat.boat_name }
      INITIAL_MOCK_HISTORY.unshift(completedReq)
      
      boat.status = 'AVAILABLE'
      return { success: true }
    }
  }
  return { success: false, error: 'Invalid completion transition' }
}
