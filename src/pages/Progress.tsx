import { useState } from 'react'
import { Scale, Ruler, Camera, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import WeightTab from '@/components/progress/WeightTab'
import BodyTab from '@/components/progress/BodyTab'
import PhotosTab from '@/components/progress/PhotosTab'
import StrengthTab from '@/components/progress/StrengthTab'

type ProgressTabType = 'weight' | 'body' | 'photos' | 'strength'

const TABS: { key: ProgressTabType; label: string; icon: typeof Scale }[] = [
  { key: 'weight', label: 'Weight', icon: Scale },
  { key: 'body', label: 'Body', icon: Ruler },
  { key: 'photos', label: 'Photos', icon: Camera },
  { key: 'strength', label: 'Strength', icon: TrendingUp },
]

export default function Progress() {
  const [tab, setTab] = useState<ProgressTabType>('weight')

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors',
              tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'weight' && <WeightTab />}
      {tab === 'body' && <BodyTab />}
      {tab === 'photos' && <PhotosTab />}
      {tab === 'strength' && <StrengthTab />}
    </div>
  )
}
