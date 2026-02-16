import { useState } from 'react'
import { useTrainingWeek } from '@/hooks/use-training'
import { useNutritionWeek } from '@/hooks/use-nutrition'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dumbbell, UtensilsCrossed, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrainingDayPlan, NutritionDayPlan, PlannedExercise, MealPlan } from '@/lib/types'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const NC_DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function todayDayOfWeek(): number {
  const d = new Date().getDay()
  return d === 0 ? 7 : d // JS 0=Sun → 7, 1=Mon → 1
}

export default function Plans() {
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

      {tab === 'workout' ? <WorkoutWeek /> : <NutritionWeek />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Workout Week
// ---------------------------------------------------------------------------

function WorkoutWeek() {
  const { data, isLoading, error } = useTrainingWeek()
  const today = todayDayOfWeek()

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
  if (error) return <p className="text-center text-muted-foreground py-8">Unable to load workout plan</p>
  if (!data?.available) return <p className="text-center text-muted-foreground py-8">Training plan not connected</p>

  return (
    <div className="space-y-2">
      {data.is_deload && <Badge variant="secondary" className="mb-2">Deload Week</Badge>}
      {data.days.map((day) => (
        <WorkoutDayCard key={day.day_of_week} day={day} isToday={day.day_of_week === today} />
      ))}
    </div>
  )
}

function WorkoutDayCard({ day, isToday }: { day: TrainingDayPlan; isToday: boolean }) {
  const [open, setOpen] = useState(isToday)

  return (
    <Card className={cn(isToday && 'ring-1 ring-primary')}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left"
      >
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn('text-xs font-semibold w-8', isToday && 'text-primary')}>
                {DAY_LABELS[day.day_of_week - 1]}
              </span>
              <span className="font-medium text-sm">{day.day_name}</span>
              {!day.is_training_day && <Badge variant="secondary" className="text-xs">Rest</Badge>}
            </div>
            {day.is_training_day && day.exercises.length > 0 && (
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
            )}
          </div>
        </CardHeader>
      </button>
      {open && day.is_training_day && day.exercises.length > 0 && (
        <CardContent className="pt-0 pb-3 px-4">
          <div className="space-y-2">
            {day.exercises.map((ex) => (
              <ExerciseRow key={ex.order} exercise={ex} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function ExerciseRow({ exercise }: { exercise: PlannedExercise }) {
  const reps = exercise.reps_max
    ? `${exercise.reps_min}-${exercise.reps_max}`
    : `${exercise.reps_min}`

  return (
    <div className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {exercise.superset_group && (
            <span className="text-xs font-bold text-primary">{exercise.superset_group}</span>
          )}
          <p className="text-sm font-medium truncate">{exercise.name}</p>
        </div>
        <div className="flex gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground">{exercise.sets} x {reps}</span>
          {exercise.rpe_target && <span className="text-xs text-muted-foreground">RPE {exercise.rpe_target}</span>}
          {exercise.tempo && <span className="text-xs text-muted-foreground">{exercise.tempo}</span>}
        </div>
        {(exercise.drop_set || exercise.rest_pause) && (
          <div className="flex gap-2 mt-0.5">
            {exercise.drop_set && <Badge variant="outline" className="text-[10px] px-1 py-0">Drop</Badge>}
            {exercise.rest_pause && <Badge variant="outline" className="text-[10px] px-1 py-0">RP</Badge>}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
        {exercise.rest_seconds}s rest
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Nutrition Week
// ---------------------------------------------------------------------------

function NutritionWeek() {
  const { data, isLoading, error } = useNutritionWeek()
  const today = todayDayOfWeek()

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
  if (error) return <p className="text-center text-muted-foreground py-8">Unable to load nutrition plan</p>
  if (!data?.available) return <p className="text-center text-muted-foreground py-8">Nutrition plan not connected</p>

  return (
    <div className="space-y-2">
      {data.days.map((day, idx) => (
        <NutritionDayCard key={day.day_of_week} day={day} dayIndex={idx} isToday={idx + 1 === today} />
      ))}
    </div>
  )
}

function NutritionDayCard({ day, dayIndex, isToday }: { day: NutritionDayPlan; dayIndex: number; isToday: boolean }) {
  const [open, setOpen] = useState(isToday)

  const dayTypeColor: Record<string, string> = {
    HIGH: 'bg-green-500/10 text-green-500 border-green-500/20',
    MED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    LOW: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }

  return (
    <Card className={cn(isToday && 'ring-1 ring-primary')}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left"
      >
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn('text-xs font-semibold w-8', isToday && 'text-primary')}>
                {DAY_LABELS[dayIndex]}
              </span>
              <Badge variant="outline" className={cn('text-xs', dayTypeColor[day.day_type] || '')}>
                {day.day_type}
              </Badge>
              <span className="text-xs text-muted-foreground">{day.total_calories} kcal</span>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </div>
        </CardHeader>
      </button>
      {open && (
        <CardContent className="pt-0 pb-3 px-4">
          {/* Daily macro summary */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <MacroStat label="Protein" value={day.total_protein} color="text-blue-400" />
            <MacroStat label="Carbs" value={day.total_carbs} color="text-amber-400" />
            <MacroStat label="Fat" value={day.total_fat} color="text-pink-400" />
          </div>
          {/* Meals */}
          <div className="space-y-3">
            {day.meals.map((meal) => (
              <MealRow key={meal.meal_number} meal={meal} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function MacroStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={cn('text-sm font-semibold', color)}>{Math.round(value)}g</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function MealRow({ meal }: { meal: MealPlan }) {
  return (
    <div className="border-t border-border/50 pt-2">
      <div className="flex justify-between items-baseline mb-1">
        <p className="text-sm font-medium">{meal.meal_label}</p>
        <span className="text-xs text-muted-foreground">
          P{Math.round(meal.protein)} C{Math.round(meal.carbs)} F{Math.round(meal.fat)}
        </span>
      </div>
      {meal.foods.length > 0 && (
        <div className="space-y-0.5">
          {meal.foods.map((food, i) => (
            <div key={i} className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate">{food.name}</span>
              <span className="whitespace-nowrap ml-2">
                {Math.round(food.grams_cooked)}g
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
