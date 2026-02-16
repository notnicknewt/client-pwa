import { Routes, Route } from 'react-router-dom'
import { AuthGate } from '@/components/auth/AuthGate'
import { AppShell } from '@/components/layout/AppShell'
import Today from '@/pages/Today'
import Progress from '@/pages/Progress'
import Summary from '@/pages/Summary'

export default function App() {
  return (
    <AuthGate>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Today />} />
          <Route path="progress" element={<Progress />} />
          <Route path="summary" element={<Summary />} />
        </Route>
        <Route path="auth" element={<div />} />
      </Routes>
    </AuthGate>
  )
}
