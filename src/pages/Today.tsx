import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToday } from '@/hooks/use-today'
import { useTrainingToday } from '@/hooks/use-training'
import { useNutritionToday } from '@/hooks/use-nutrition'
import { useStartCheckin } from '@/hooks/use-checkin'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Dumbbell, UtensilsCrossed, MessageSquare, MessageCircle, ChevronRight, ChevronDown, Calendar, Play, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlannedExercise, MealPlan, TodayData } from '@/lib/types'

export default function Today() {
  const { data, isLoading, error } = useToday()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={Calendar} title="Unable to load today's data" description="Pull down to refresh or try again later." />
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <TrainingCard
        available={data.training.available}
        isTrainingDay={data.training.is_training_day}
        workoutName={data.training.workout_name}
        exerciseCount={data.training.exercise_count}
      />

      <NutritionCard
        available={data.nutrition.available}
        dayType={data.nutrition.day_type}
        totalCalories={data.nutrition.total_calories}
        totalProtein={data.nutrition.total_protein}
        totalCarbs={data.nutrition.total_carbs}
        totalFat={data.nutrition.total_fat}
      />

      <TouchpointCard date={data.date} touchpoint={data.touchpoint} />
      <CheckinCard date={data.date} checkin={data.checkin} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Training Card (tappable, expandable)
// ---------------------------------------------------------------------------

function TrainingCard({
  available, isTrainingDay, workoutName, exerciseCount,
}: {
  available: boolean
  isTrainingDay?: boolean
  workoutName?: string
  exerciseCount?: number
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const { data: detail } = useTrainingToday()
  const hasExercises = detail?.available && detail.exercises?.length > 0

  return (
    <Card
      className={cn('cursor-pointer transition-colors hover:bg-accent/50', !available && 'cursor-default hover:bg-transparent')}
      onClick={() => {
        if (!available) return
        if (hasExercises) {
          setExpanded(!expanded)
        } else {
          navigate('/plans')
        }
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Training
          </span>
          {available && (
            hasExercises
              ? <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {available ? (
          <div>
            {isTrainingDay ? (
              <div>
                <p className="font-medium">{workoutName || 'Workout'}</p>
                <p className="text-sm text-muted-foreground">
                  {exerciseCount} exercises
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Rest Day</Badge>
                <span className="text-sm text-muted-foreground">Recover and recharge</span>
              </div>
            )}

            {expanded && hasExercises && (
              <div className="mt-3 pt-3 border-t space-y-1.5">
                {detail.exercises.map((ex: PlannedExercise) => {
                  const reps = ex.reps_max ? `${ex.reps_min}-${ex.reps_max}` : `${ex.reps_min}`
                  return (
                    <div key={ex.order} className="flex justify-between text-sm">
                      <span className="truncate">{ex.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap ml-2">
                        {ex.sets} x {reps}
                      </span>
                    </div>
                  )
                })}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/track/workout')
                  }}
                  className="w-full mt-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                >
                  Start Workout
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Training plan not connected</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Nutrition Card (tappable, expandable)
// ---------------------------------------------------------------------------

function NutritionCard({
  available, dayType, totalCalories, totalProtein, totalCarbs, totalFat,
}: {
  available: boolean
  dayType?: string
  totalCalories?: number
  totalProtein?: number
  totalCarbs?: number
  totalFat?: number
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const { data: detail } = useNutritionToday()
  const hasMeals = detail?.available && detail.meals?.length > 0

  return (
    <Card
      className={cn('cursor-pointer transition-colors hover:bg-accent/50', !available && 'cursor-default hover:bg-transparent')}
      onClick={() => {
        if (!available) return
        if (hasMeals) {
          setExpanded(!expanded)
        } else {
          navigate('/plans')
        }
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Nutrition
          </span>
          {available && (
            hasMeals
              ? <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {available ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={dayType === 'HIGH' ? 'default' : 'secondary'}>
                {dayType || 'Standard'}
              </Badge>
              {totalCalories && (
                <span className="text-sm text-muted-foreground">
                  {totalCalories} kcal
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MacroBar label="Protein" value={totalProtein} unit="g" color="bg-blue-500" />
              <MacroBar label="Carbs" value={totalCarbs} unit="g" color="bg-amber-500" />
              <MacroBar label="Fat" value={totalFat} unit="g" color="bg-pink-500" />
            </div>

            {expanded && hasMeals && (
              <div className="mt-3 pt-3 border-t space-y-2">
                {detail.meals.map((meal: MealPlan) => (
                  <div key={meal.meal_number}>
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium">{meal.meal_label}</p>
                      <span className="text-xs text-muted-foreground">
                        P{Math.round(meal.protein)} C{Math.round(meal.carbs)} F{Math.round(meal.fat)}
                      </span>
                    </div>
                    {meal.foods.length > 0 && (
                      <div className="ml-2 mt-0.5">
                        {meal.foods.map((food, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {food.name} — {Math.round(food.grams_cooked)}g
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nutrition plan not connected</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Touchpoint Card (always visible, tappable when pending)
// ---------------------------------------------------------------------------

function TouchpointCard({
  date, touchpoint,
}: {
  date: string
  touchpoint: TodayData['touchpoint']
}) {
  const [expanded, setExpanded] = useState(false)
  const startCheckin = useStartCheckin()

  const isPending = touchpoint.is_touchpoint_day && touchpoint.status === 'pending'
  const tappable = isPending

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    startCheckin.mutate(date)
  }

  return (
    <Card
      className={cn(
        'transition-colors',
        tappable && 'cursor-pointer hover:bg-accent/50',
      )}
      onClick={() => {
        if (tappable) setExpanded(!expanded)
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Touchpoint
          </span>
          {tappable && (
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {touchpoint.is_touchpoint_day ? (
          <div className="flex items-center gap-2">
            <Badge variant={touchpoint.status === 'completed' ? 'success' : 'warning'}>
              {touchpoint.status === 'completed' ? 'Done' : 'Due Today'}
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No touchpoint today</p>
        )}

        {expanded && isPending && (
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={handleStart}
              disabled={startCheckin.isPending}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {startCheckin.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Touchpoint
            </button>
            {startCheckin.isError && (
              <p className="text-xs text-destructive mt-2 text-center">
                Failed to start — try again
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Check-in Card (tappable when pending, expandable with start action)
// ---------------------------------------------------------------------------

function CheckinCard({
  date, checkin,
}: {
  date: string
  checkin: TodayData['checkin']
}) {
  const [expanded, setExpanded] = useState(false)
  const startCheckin = useStartCheckin()

  const isPending = checkin.is_checkin_day && checkin.status === 'pending'
  const tappable = isPending

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    startCheckin.mutate(date)
  }

  return (
    <Card
      className={cn(
        'transition-colors',
        tappable && 'cursor-pointer hover:bg-accent/50',
      )}
      onClick={() => {
        if (tappable) setExpanded(!expanded)
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Check-in
          </span>
          {tappable && (
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checkin.is_checkin_day ? (
          <div className="flex items-center gap-2">
            <Badge variant={checkin.status === 'completed' ? 'success' : 'warning'}>
              {checkin.status === 'completed' ? 'Completed' : 'Due Today'}
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Next check-in: {new Date(checkin.next_checkin).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        )}

        {expanded && isPending && (
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={handleStart}
              disabled={startCheckin.isPending}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {startCheckin.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Check-in
            </button>
            {startCheckin.isError && (
              <p className="text-xs text-destructive mt-2 text-center">
                Failed to start — try again
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MacroBar({ label, value, unit, color }: { label: string; value?: number; unit: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`h-1.5 rounded-full ${color} mb-1.5`} />
      <p className="text-sm font-medium">{value ?? '-'}{unit}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
