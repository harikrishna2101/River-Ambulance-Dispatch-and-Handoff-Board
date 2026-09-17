import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, useSession } from '@/hooks/useSession'
import { AppShell } from '@/components/layout/AppShell'
import { RoleSelector } from '@/components/layout/RoleSelector'
import { OperationsBoard } from '@/pages/OperationsBoard'
import { DispatchForm } from '@/pages/DispatchForm'
import { CaptainQueue } from '@/pages/CaptainQueue'
import { HandoffForm } from '@/pages/HandoffForm'
import { DispatchHistory } from '@/pages/DispatchHistory'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // 60s — Supabase Realtime notifies of changes
      gcTime: 10 * 60_000,        // 10 minutes cache retention
      refetchOnWindowFocus: false,// Avoid wasteful refetches on mobile tab switches
      refetchOnReconnect: 'always',
      retry: 1,
    },
  },
})


// Guard: redirect to role selector if no session
function RequireSession({ children }: { children: React.ReactNode }) {
  const { user } = useSession()
  if (!user) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public entry */}
      <Route path="/welcome" element={<RoleSelector />} />

      {/* Protected app shell */}
      <Route
        element={
          <RequireSession>
            <AppShell />
          </RequireSession>
        }
      >
        <Route index element={<OperationsBoard />} />
        <Route path="dispatch" element={<DispatchForm />} />
        <Route path="captain" element={<CaptainQueue />} />
        <Route path="captain/:requestId" element={<CaptainQueue />} />
        <Route path="handoff" element={<HandoffForm />} />
        <Route path="history" element={<DispatchHistory />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  )
}
