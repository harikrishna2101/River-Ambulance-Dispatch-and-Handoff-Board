import type { UserRole, CaptainName } from '@/types'

export const CAPTAIN_OPTIONS: CaptainName[] = [
  'Captain 1',
  'Captain 2',
  'Captain 3',
  'Captain 4',
  'Captain 5',
]

export const ROLE_CONFIG: Record<UserRole, { label: string; icon: string; path: string }> = {
  HEALTH_WORKER:    { label: 'Health Worker',    icon: '🏥', path: '/dispatch' },
  CAPTAIN:          { label: 'Boat Captain',     icon: '⚓', path: '/captain' },
  SHIFT_HANDOFF:    { label: 'Shift Handoff',    icon: '📋', path: '/handoff' },
  DISPATCH_HISTORY: { label: 'Dispatch History', icon: '📜', path: '/history' },
}

export const ROLE_LABELS: Record<UserRole, string> = {
  HEALTH_WORKER: 'Health Worker',
  CAPTAIN: 'Boat Captain',
  SHIFT_HANDOFF: 'Shift Handoff',
  DISPATCH_HISTORY: 'Dispatch History',
}
