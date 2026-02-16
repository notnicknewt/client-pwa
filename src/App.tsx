import { Routes, Route } from 'react-router-dom'
import { AuthGate } from '@/components/auth/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
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
          <Route index element={<Today />} />
          <Route path="plans" element={<Plans />} />
          <Route path="track" element={<Track />} />
          <Route path="track/workout" element={<TrackWorkout />} />
          <Route path="progress" element={<Progress />} />
          <Route path="summary" element={<Summary />} />
        </Route>
        <Route path="auth" element={<div />} />
      </Routes>
    </AuthGate>
  )
}
