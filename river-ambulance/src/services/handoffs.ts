import { supabase } from '../lib/supabase'
import type { ShiftHandoff, HandoffPayload } from '../types'
import { INITIAL_MOCK_HANDOFFS, INITIAL_MOCK_BOATS } from '../lib/mockData'

export async function getHandoffs(): Promise<ShiftHandoff[]> {
  try {
    const { data, error } = await supabase
      .from('shift_handoffs')
      .select('id, boat_id, outgoing_captain, incoming_captain, fuel_percentage, oxygen_tanks, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) return data
  } catch {
    // ignore
  }

  return INITIAL_MOCK_HANDOFFS
}

export async function recordHandoff(payload: HandoffPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('record_handoff', {
      p_boat_id: payload.boat_id,
      p_outgoing_captain: payload.outgoing_captain,
      p_incoming_captain: payload.incoming_captain,
      p_fuel_percentage: payload.fuel_percentage,
      p_oxygen_tanks: payload.oxygen_tanks,
      p_notes: payload.notes || null,
    })

    if (!error && data) return data
  } catch {
    // fallback
  }

  const boat = INITIAL_MOCK_BOATS.find(b => b.id === payload.boat_id)
  if (boat) {
    boat.fuel_percentage = payload.fuel_percentage
    boat.oxygen_tanks = payload.oxygen_tanks
    boat.updated_at = new Date().toISOString()
  }

  const newHandoff: ShiftHandoff = {
    id: `h-${Date.now()}`,
    boat_id: payload.boat_id,
    outgoing_captain: payload.outgoing_captain,
    incoming_captain: payload.incoming_captain,
    fuel_percentage: payload.fuel_percentage,
    oxygen_tanks: payload.oxygen_tanks,
    notes: payload.notes || null,
    created_at: new Date().toISOString(),
  }
  INITIAL_MOCK_HANDOFFS.unshift(newHandoff)
  return { success: true }
}
