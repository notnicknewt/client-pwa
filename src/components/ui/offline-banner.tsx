import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/use-network-status'

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()
  if (isOnline) return null
  return (
    <div className="bg-amber-900/50 border-b border-amber-700/50 px-4 py-2 flex items-center gap-2 text-amber-200 text-sm">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>You're offline — showing cached data</span>
    </div>
  )
}
