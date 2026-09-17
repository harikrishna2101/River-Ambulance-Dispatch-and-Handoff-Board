import React, { createContext, useContext, useState, useEffect } from 'react'
import type { AppUser } from '@/types'

interface SessionContextValue {
  user: AppUser
  setUser: (user: AppUser) => void
  clearUser: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

const SESSION_KEY = 'river_amb_prototype_role_v1'

const DEFAULT_USER: AppUser = {
  role: 'HEALTH_WORKER',
  display_name: 'Health Worker',
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AppUser>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AppUser
        if (parsed && parsed.role) return parsed
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER
  })

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } catch {
      // ignore
    }
  }, [user])

  function setUser(u: AppUser) {
    setUserState(u)
  }

  function clearUser() {
    setUserState(DEFAULT_USER)
  }

  return (
    <SessionContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}


