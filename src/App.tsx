import { Routes, Route } from 'react-router-dom'
import { AuthGate } from '@/components/auth/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { PageTransition } from '@/components/ui/page-transition'
import Today from '@/pages/Today'
import Plans from '@/pages/Plans'
import Track from '@/pages/Track'
import TrackWorkout from '@/pages/TrackWorkout'
import Progress from '@/pages/Progress'
import Summary from '@/pages/Summary'

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ErrorBoundary><PageTransition><Today /></PageTransition></ErrorBoundary>} />
          <Route path="plans" element={<ErrorBoundary><PageTransition><Plans /></PageTransition></ErrorBoundary>} />
          <Route path="track" element={<ErrorBoundary><PageTransition><Track /></PageTransition></ErrorBoundary>} />
          <Route path="track/workout" element={<ErrorBoundary><PageTransition><TrackWorkout /></PageTransition></ErrorBoundary>} />
          <Route path="progress" element={<ErrorBoundary><PageTransition><Progress /></PageTransition></ErrorBoundary>} />
          <Route path="summary" element={<ErrorBoundary><PageTransition><Summary /></PageTransition></ErrorBoundary>} />
        </Route>
        <Route path="auth" element={<div />} />
      </Routes>
    </AuthGate>
  )
}
