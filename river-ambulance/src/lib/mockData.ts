import type { Boat, DispatchRequest, ShiftHandoff } from '@/types'

export const ISLANDS = [
  'Island A',
  'Island B',
  'Island C',
  'Island D',
  'Island E'
]

export const CAPTAIN_NAMES = [
  'Captain 1',
  'Captain 2',
  'Captain 3',
  'Captain 4',
  'Captain 5'
]

export const INITIAL_MOCK_BOATS: Boat[] = [
  {
    id: 'boat-1',
    boat_number: 'BA-01',
    boat_name: 'River Swift BA-01',
    status: 'AVAILABLE',
    fuel_percentage: 85,
    oxygen_tanks: 4,
    current_location: "Male' Jetty 1",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'boat-2',
    boat_number: 'BA-02',
    boat_name: 'River Guardian BA-02',
    status: 'AVAILABLE',
    fuel_percentage: 65,
    oxygen_tanks: 3,
    current_location: "Hulhumale' Harbor",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'boat-3',
    boat_number: 'BA-03',
    boat_name: 'River Rescuer BA-03',
    status: 'AVAILABLE',
    fuel_percentage: 45,
    oxygen_tanks: 1,
    current_location: 'Villingili Terminal',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'boat-4',
    boat_number: 'BA-04',
    boat_name: 'River Lifeboat BA-04',
    status: 'MAINTENANCE',
    fuel_percentage: 15,
    oxygen_tanks: 0,
    current_location: 'Drydock Repair Yard',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'boat-5',
    boat_number: 'BA-05',
    boat_name: 'River Express BA-05',
    status: 'AVAILABLE',
    fuel_percentage: 90,
    oxygen_tanks: 5,
    current_location: 'Maafushi Main Port',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }
]

export const INITIAL_MOCK_DISPATCHES: DispatchRequest[] = [
  {
    id: 'req-101',
    pickup_location: "Maafushi Jetty 2",
    urgency: 'CRITICAL',
    patient_condition: 'CRITICAL',
    notes: 'Requires immediate transfer to Male Central Hospital. Oxygen backup prepared.',
    requested_by: 'Health Worker Mariyam',
    status: 'OPEN',
    assigned_boat_id: null,
    claimed_at: null,
    completed_at: null,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'req-102',
    pickup_location: "Gulhi Health Center",
    urgency: 'HIGH',
    patient_condition: 'SERIOUS',
    notes: 'Stabilized by local clinic staff.',
    requested_by: 'Nurse Ahmed',
    status: 'OPEN',
    assigned_boat_id: null,
    claimed_at: null,
    completed_at: null,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  }
]

export const INITIAL_MOCK_HANDOFFS: ShiftHandoff[] = [
  {
    id: 'h-01',
    boat_id: 'boat-1',
    outgoing_captain: 'Captain 1',
    incoming_captain: 'Captain 2',
    fuel_percentage: 85,
    oxygen_tanks: 4,
    notes: 'All navigation gear tested. 4 full O2 tanks secured.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  }
]

export const INITIAL_MOCK_HISTORY: DispatchRequest[] = [
  {
    id: 'req-099',
    pickup_location: "Hulhumale' Terminal",
    urgency: 'HIGH',
    patient_condition: 'SERIOUS',
    notes: 'Patient safely delivered to Indira Gandhi Memorial Hospital.',
    requested_by: 'Health Worker Hassan',
    status: 'COMPLETED',
    assigned_boat_id: 'boat-1',
    boat: { boat_number: 'BA-01', boat_name: 'River Swift BA-01' },
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    claimed_at: new Date(Date.now() - 4.8 * 3600000).toISOString(),
    completed_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  }
]
