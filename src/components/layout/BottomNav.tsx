import { NavLink } from 'react-router-dom'
import { Calendar, ClipboardList, Target, TrendingUp, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Calendar, label: 'Today' },
  { to: '/plans', icon: ClipboardList, label: 'Plans' },
  { to: '/track', icon: Target, label: 'Track' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/summary', icon: BarChart3, label: 'Summary' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
