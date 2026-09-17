import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'
import { ROLE_CONFIG, CAPTAIN_OPTIONS } from '@/constants/roles'
import { Button } from '@/components/ui/Button'
import type { UserRole, CaptainName } from '@/types'
import { cn } from '@/lib/utils'

const ROLES: { role: UserRole; icon: string; description: string }[] = [
  {
    role: 'HEALTH_WORKER',
    icon: '🏥',
    description: 'Submit emergency ambulance requests for patients',
  },
  {
    role: 'CAPTAIN',
    icon: '⚓',
    description: 'Claim jobs, manage active trips, and complete missions',
  },
  {
    role: 'SHIFT_HANDOFF',
    icon: '📋',
    description: 'Record fuel levels and oxygen tank handoffs between shifts',
  },
  {
    role: 'DISPATCH_HISTORY',
    icon: '📜',
    description: 'Review complete emergency dispatch history and audit logs',
  },
]

export function RoleSelector() {
  const { setUser } = useSession()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<UserRole>('HEALTH_WORKER')
  const [selectedCaptain, setSelectedCaptain] = useState<CaptainName>('Captain 1')

  function handleContinue() {
    if (selectedRole === 'CAPTAIN') {
      setUser({
        role: 'CAPTAIN',
        display_name: selectedCaptain,
        selectedCaptain,
      })
      navigate('/captain', { replace: true })
    } else {
      const config = ROLE_CONFIG[selectedRole]
      setUser({
        role: selectedRole,
        display_name: config.label,
      })
      navigate(config.path, { replace: true })
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-navy-950">
      {/* Header */}
      <div className="text-center mb-6 animate-slide-up">
        <div className="text-5xl mb-3">⚕</div>
        <h1 className="text-2xl font-bold text-blue-50">River Ambulance System</h1>
        <p className="text-blue-200/60 text-sm mt-1">Prototype Role Simulation</p>
      </div>

      <div className="w-full max-w-sm space-y-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
        {/* Role cards */}
        <div className="space-y-2">
          <p className="text-xs text-blue-200/60 font-medium uppercase tracking-wider mb-1">
            Select Role to Simulate
          </p>
          {ROLES.map(({ role, icon, description }) => (
            <div key={role} className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedRole(role)}
                className={cn(
                  'w-full text-left glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all border',
                  selectedRole === role
                    ? 'border-blue-400/50 bg-blue-500/15'
                    : 'border-transparent hover:border-white/10 hover:bg-white/5'
                )}
              >
                <span className="text-2xl shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-blue-50 text-sm">{ROLE_CONFIG[role].label}</p>
                  <p className="text-blue-200/50 text-xs truncate">{description}</p>
                </div>
                {selectedRole === role && (
                  <span className="ml-auto text-blue-400 font-bold">✓</span>
                )}
              </button>

              {/* Captain Picker Sub-Panel */}
              {role === 'CAPTAIN' && selectedRole === 'CAPTAIN' && (
                <div className="ml-4 pl-3 border-l-2 border-blue-400/30 space-y-1.5 py-1">
                  <p className="text-xs font-semibold text-blue-200/70">Select Captain Identity:</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {CAPTAIN_OPTIONS.map((cName: CaptainName) => (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => setSelectedCaptain(cName)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition',
                          selectedCaptain === cName
                            ? 'bg-blue-500/30 border-blue-400/60 text-blue-100 ring-1 ring-blue-400/30'
                            : 'glass border-white/5 text-blue-200/60 hover:text-blue-100'
                        )}
                      >
                        {cName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full mt-4"
          onClick={handleContinue}
        >
          Enter as {selectedRole === 'CAPTAIN' ? selectedCaptain : ROLE_CONFIG[selectedRole].label}
        </Button>

        <p className="text-center text-xs text-blue-200/30 pt-1">
          Prototype simulation — role saved locally in browser
        </p>
      </div>
    </div>
  )
}

