import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2
                 bg-red-600 text-white text-sm font-semibold py-2 px-4
                 shadow-lg animate-slide-up"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      You are offline — showing last known data
    </div>
  )
}
