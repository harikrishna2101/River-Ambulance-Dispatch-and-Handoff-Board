import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSession } from '@/hooks/useSession'
import { ROLE_CONFIG, CAPTAIN_OPTIONS } from '@/constants/roles'
import type { UserRole, CaptainName } from '@/types'
import { ChevronDown, Check } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/':         'Operations Board',
  '/dispatch': 'Emergency Dispatch',
  '/captain':  'Captain Dashboard',
  '/handoff':  'Shift Handoff',
  '/history':  'Dispatch History',
}

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser } = useSession()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const title = PAGE_TITLES[location.pathname] ?? 'River Ambulance'
  const activeRoleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.HEALTH_WORKER

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectRole(role: UserRole, captain?: CaptainName) {
    if (role === 'CAPTAIN') {
      const captName = captain || user.selectedCaptain || 'Captain 1'
      setUser({
        role: 'CAPTAIN',
        display_name: captName,
        selectedCaptain: captName,
      })
      navigate('/captain')
    } else {
      const config = ROLE_CONFIG[role]
      setUser({
        role,
        display_name: config.label,
      })
      navigate(config.path)
    }
    setOpen(false)
  }

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-40 glass-strong border-b border-white/10',
        'flex items-center justify-between px-4 h-14'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Brand mark & title */}
      <Link to="/" className="flex items-center gap-2 text-left hover:opacity-90 transition">
        <span className="text-blue-400 font-bold text-lg leading-none">⚕</span>
        <span className="text-blue-100 font-bold tracking-tight text-sm truncate max-w-[130px] sm:max-w-none">
          {title}
        </span>
      </Link>

      {/* Role Switcher Header Chip */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
            'bg-blue-500/15 border-blue-400/30 text-blue-100 hover:bg-blue-500/25 active:scale-95'
          )}
          aria-expanded={open}
          aria-label="Switch prototype role"
        >
          <span>{activeRoleConfig.icon}</span>
          <span className="truncate max-w-[110px] sm:max-w-none">
            {user.role === 'CAPTAIN' ? (user.selectedCaptain || 'Captain 1') : activeRoleConfig.label}
          </span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-blue-300/70 transition-transform duration-200', open && 'rotate-180')} />
        </button>

        {/* Role Switcher Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-72 glass-strong rounded-2xl p-2 shadow-2xl border border-white/15 animate-slide-up z-50">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200/50">
                Switch Role (Prototype Simulation)
              </p>
              <p className="text-[11px] text-blue-200/40 mt-0.5">
                Active: <span className="font-semibold text-blue-100">{user.display_name}</span>
              </p>
            </div>

            <div className="py-1 space-y-1">
              {/* 1. Health Worker */}
              <button
                type="button"
                onClick={() => handleSelectRole('HEALTH_WORKER')}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition',
                  user.role === 'HEALTH_WORKER' ? 'bg-blue-500/25 text-blue-100 border border-blue-400/30' : 'text-blue-200/70 hover:bg-white/5 hover:text-blue-100'
                )}
              >
                <div className="flex items-center gap-2">
                  <span>🏥</span>
                  <span>Health Worker</span>
                </div>
                {user.role === 'HEALTH_WORKER' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              {/* 2. Boat Captain */}
              <div className={cn('rounded-xl p-1 transition border', user.role === 'CAPTAIN' ? 'bg-blue-500/20 border-blue-400/30' : 'border-transparent')}>
                <button
                  type="button"
                  onClick={() => handleSelectRole('CAPTAIN', user.selectedCaptain || 'Captain 1')}
                  className="w-full text-left px-2 py-1.5 text-xs font-semibold flex items-center justify-between text-blue-100"
                >
                  <div className="flex items-center gap-2">
                    <span>⚓</span>
                    <span>Boat Captain</span>
                  </div>
                  {user.role === 'CAPTAIN' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>

                {/* Sub-selector for Captain 1 to 5 */}
                <div className="mt-1 pt-1 border-t border-white/10 grid grid-cols-1 gap-0.5 pl-4 pr-1">
                  {CAPTAIN_OPTIONS.map((cName: CaptainName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => handleSelectRole('CAPTAIN', cName)}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition',
                        user.role === 'CAPTAIN' && user.selectedCaptain === cName
                          ? 'bg-blue-500/40 text-blue-50 font-bold'
                          : 'text-blue-200/60 hover:text-blue-100 hover:bg-white/5'
                      )}
                    >
                      <span>{cName}</span>
                      {user.role === 'CAPTAIN' && user.selectedCaptain === cName && (
                        <span className="text-[10px] text-emerald-400 font-bold">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Shift Handoff */}
              <button
                type="button"
                onClick={() => handleSelectRole('SHIFT_HANDOFF')}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition',
                  user.role === 'SHIFT_HANDOFF' ? 'bg-blue-500/25 text-blue-100 border border-blue-400/30' : 'text-blue-200/70 hover:bg-white/5 hover:text-blue-100'
                )}
              >
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <span>Shift Handoff</span>
                </div>
                {user.role === 'SHIFT_HANDOFF' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              {/* 4. Dispatch History */}
              <button
                type="button"
                onClick={() => handleSelectRole('DISPATCH_HISTORY')}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition',
                  user.role === 'DISPATCH_HISTORY' ? 'bg-blue-500/25 text-blue-100 border border-blue-400/30' : 'text-blue-200/70 hover:bg-white/5 hover:text-blue-100'
                )}
              >
                <div className="flex items-center gap-2">
                  <span>📜</span>
                  <span>Dispatch History</span>
                </div>
                {user.role === 'DISPATCH_HISTORY' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

