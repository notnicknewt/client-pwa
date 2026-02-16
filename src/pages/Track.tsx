import { useState } from 'react'
import { Dumbbell, UtensilsCrossed, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import TrackWorkout from './TrackWorkout'
import TrackNutrition from './TrackNutrition'

const DISMISSED_KEY = 'track_tips_dismissed'

function useTipsDismissed() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1',
  )
  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }
  function show() {
    localStorage.removeItem(DISMISSED_KEY)
    setDismissed(false)
  }
  return { dismissed, dismiss, show }
}

const workoutTips = [
  'Tap "Start Workout" on the Today page or come here',
  'Log each set — weight, reps, and optional RPE',
  'Rest timer counts down between sets automatically',
  'PR badges show when you beat last session',
  'You can also track via chat — say "begin workout"',
]

const nutritionTips = [
  '"Log as Planned" — one tap if you ate what was prescribed',
  '"Log with Changes" — mark substitutions or skipped foods',
  'Daily progress bars update as you log meals',
  'Your coach can also prompt you at meal times via chat',
]

export default function Track() {
  const [tab, setTab] = useState<'workout' | 'nutrition'>('workout')
  const tips = useTipsDismissed()

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

      {/* How to track tips */}
      {!tips.dismissed ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" />
                How to track {tab === 'workout' ? 'workouts' : 'nutrition'}
              </h3>
              <button
                onClick={tips.dismiss}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Dismiss tips"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="space-y-1.5">
              {(tab === 'workout' ? workoutTips : nutritionTips).map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : (
        <button
          onClick={tips.show}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Info className="h-3 w-3" />
          How to track
        </button>
      )}

      {tab === 'workout' ? <TrackWorkout /> : <TrackNutrition />}
    </div>
  )
}
