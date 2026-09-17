import { formatDistanceToNow, format } from 'date-fns'
import type { UrgencyLevel, BoatStatus, DispatchStatus } from '@/types'

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return format(new Date(iso), 'd MMM yyyy, HH:mm')
}

export function isStaleHandoff(iso: string | null, thresholdHours = 8): boolean {
  if (!iso) return true
  const diffMs = Date.now() - new Date(iso).getTime()
  return diffMs > thresholdHours * 60 * 60 * 1000
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────

export const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
}

export function urgencyLabel(u: UrgencyLevel): string {
  return u.charAt(0) + u.slice(1).toLowerCase()
}

export function urgencyClass(u: UrgencyLevel): string {
  switch (u) {
    case 'CRITICAL': return 'urgency-critical'
    case 'HIGH':     return 'urgency-high'
    case 'NORMAL':   return 'urgency-routine'
  }
}

// ─── Boat status helpers ──────────────────────────────────────────────────────

export function boatStatusLabel(s: BoatStatus): string {
  switch (s) {
    case 'AVAILABLE':  return 'Available'
    case 'ASSIGNED':   return 'Assigned'
    case 'ON_TRIP':    return 'On Trip'
    case 'MAINTENANCE':return 'Maintenance'
  }
}

export function boatStatusClass(s: BoatStatus): string {
  switch (s) {
    case 'AVAILABLE':  return 'status-available'
    case 'ASSIGNED':   return 'status-assigned'
    case 'ON_TRIP':    return 'status-in-transit'
    case 'MAINTENANCE':return 'status-maintenance'
  }
}

// ─── Dispatch status helpers ──────────────────────────────────────────────────

export function dispatchStatusLabel(s: DispatchStatus): string {
  switch (s) {
    case 'OPEN':      return 'Open'
    case 'ASSIGNED':  return 'Assigned'
    case 'ON_TRIP':   return 'On Trip'
    case 'COMPLETED': return 'Completed'
    case 'CANCELLED': return 'Cancelled'
  }
}

// ─── Resource Indicators ──────────────────────────────────────────────────────

export type ResourceLevel = 'NORMAL' | 'LOW' | 'CRITICAL'

export function getFuelLevel(pct: number): ResourceLevel {
  if (pct >= 50) return 'NORMAL'
  if (pct >= 20) return 'LOW'
  return 'CRITICAL'
}

export function getOxygenLevel(tanks: number): ResourceLevel {
  if (tanks >= 2) return 'NORMAL'
  if (tanks === 1) return 'LOW'
  return 'CRITICAL'
}

export function fuelBarColor(pct: number): string {
  const level = getFuelLevel(pct)
  if (level === 'NORMAL') return '#22c55e'
  if (level === 'LOW') return '#f59e0b'
  return '#ef4444'
}

export function resourceLevelInfo(level: ResourceLevel) {
  switch (level) {
    case 'NORMAL':
      return {
        label: 'Normal',
        textClass: 'text-emerald-400',
        badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        icon: '✓'
      }
    case 'LOW':
      return {
        label: 'Low',
        textClass: 'text-amber-400',
        badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        icon: '⚠️'
      }
    case 'CRITICAL':
      return {
        label: 'Critical',
        textClass: 'text-red-400',
        badgeClass: 'bg-red-500/20 border-red-500/40 text-red-300 font-bold',
        icon: '🚨'
      }
  }
}

// ─── Unique idempotency key ───────────────────────────────────────────────────

export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

