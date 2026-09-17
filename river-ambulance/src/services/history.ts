import { supabase } from '../lib/supabase'
import type { DispatchEvent, DispatchRequest } from '../types'
import { INITIAL_MOCK_HISTORY } from '../lib/mockData'

export async function getDispatchHistory(): Promise<DispatchRequest[]> {
  try {
    const { data, error } = await supabase
      .from('dispatch_requests')
      .select(`
        id, pickup_location, urgency, patient_condition, notes, requested_by, status, assigned_boat_id, created_at, claimed_at, completed_at,
        boat:boats(boat_number, boat_name)
      `)
      .in('status', ['COMPLETED', 'CANCELLED'])
      .order('completed_at', { ascending: false })
      .limit(50)

    if (!error && data) return (data as unknown) as DispatchRequest[]
  } catch {
    // ignore
  }

  return INITIAL_MOCK_HISTORY
}

export async function getDispatchEvents(): Promise<DispatchEvent[]> {
  try {
    const { data, error } = await supabase
      .from('dispatch_events')
      .select('id, request_id, boat_id, event_type, actor, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) return data
  } catch {
    // ignore
  }

  return []
}
