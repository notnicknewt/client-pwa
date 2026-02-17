import { Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { BottomNav } from './BottomNav'
import { useProfile } from '@/hooks/use-profile'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { InstallPrompt } from '@/components/ui/install-prompt'
import { Loader2, ArrowDown } from 'lucide-react'

export function AppShell() {
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const { containerRef, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh: () => queryClient.invalidateQueries(),
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">
          {profile?.first_name ? `Hey ${profile.first_name}` : 'Coaching'}
        </h1>
        {profile?.program_week && (
          <p className="text-xs text-muted-foreground">
            Week {profile.program_week} of {profile.total_weeks}
          </p>
        )}
      </header>

      <OfflineBanner />

      <main ref={containerRef} className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        {pullDistance > 0 && (
          <div className="pull-indicator" style={{ height: pullDistance }}>
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <ArrowDown className={`h-5 w-5 text-muted-foreground pull-indicator-icon${pullDistance >= 60 ? ' ready' : ''}`} />
            )}
          </div>
        )}
        <Outlet />
      </main>

      <InstallPrompt />
      <BottomNav />
    </div>
  )
}
