import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { OfflineBanner } from '@/components/ui/OfflineBanner'

export function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col bg-navy-950">
      <OfflineBanner />
      <TopBar />

      {/* Page content — padded for top bar (56px) and bottom nav (64px) */}
      <main
        id="main-content"
        className="flex-1 pt-14 pb-16 overflow-y-auto"
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
