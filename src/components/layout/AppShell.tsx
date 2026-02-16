import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useProfile } from '@/hooks/use-profile'

export function AppShell() {
  const { data: profile } = useProfile()

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

      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
