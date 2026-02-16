import { useState } from 'react'
import { Dumbbell, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import TrackWorkout from './TrackWorkout'
import TrackNutrition from './TrackNutrition'

export default function Track() {
  const [tab, setTab] = useState<'workout' | 'nutrition'>('workout')

  return (
    <div className="space-y-4">
      {/* Tab toggle */}
      <div className="flex gap-2 bg-muted rounded-lg p-1">
        <button
          onClick={() => setTab('workout')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'workout' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          <Dumbbell className="h-4 w-4" />
          Workout
        </button>
        <button
          onClick={() => setTab('nutrition')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'nutrition' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Nutrition
        </button>
      </div>

      {tab === 'workout' ? <TrackWorkout /> : <TrackNutrition />}
    </div>
  )
}
