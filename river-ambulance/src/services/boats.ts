import { supabase } from '../lib/supabase'
import type { Boat } from '../types'
import { INITIAL_MOCK_BOATS } from '../lib/mockData'

export async function getBoats(): Promise<Boat[]> {
  try {
    const { data, error } = await supabase
      .from('boats')
      .select('id, boat_number, boat_name, status, fuel_percentage, oxygen_tanks, current_location, created_at, updated_at')
      .order('boat_number')

    if (!error && data && data.length > 0) {
      return data
    }
  } catch {
    // ignore
  }

  return INITIAL_MOCK_BOATS
}
