import { fuelBarColor, getFuelLevel, resourceLevelInfo } from '@/utils'
import { cn } from '@/lib/utils'

interface FuelBarProps {
  pct: number
  className?: string
  showLabel?: boolean
}

export function FuelBar({ pct, className, showLabel = true }: FuelBarProps) {
  const clamped = Math.max(0, Math.min(100, pct))
  const color = fuelBarColor(clamped)
  const level = getFuelLevel(clamped)
  const info = resourceLevelInfo(level)

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {/* Label & Percentage Row */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-blue-200/70 font-medium">Fuel</span>
        <span
          className="font-bold tabular-nums text-blue-100"
          style={{ color }}
        >
          {clamped}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="fuel-bar">
        <div
          className="fuel-bar-fill"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>

      {/* Status Badge below Bar */}
      {showLabel && (
        <div className="flex justify-start">
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1.5', info.badgeClass)}>
            <span>{info.icon}</span>
            <span>{info.label}</span>
          </span>
        </div>
      )}
    </div>
  )
}
