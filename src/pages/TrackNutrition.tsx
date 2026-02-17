import { useState } from 'react'
import { useNutritionToday } from '@/hooks/use-nutrition'
import { useMealLogsToday, useLogMeal } from '@/hooks/use-meal-tracking'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { UtensilsCrossed, Check, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealPlan, MealFood } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types local to this page
// ---------------------------------------------------------------------------

type MealStatus = 'COMPLETED' | 'MODIFIED' | 'SKIPPED' | 'PARTIAL'

interface LoggedMeal {
  meal_number: number
  status: string
  adherence: number
}

interface FoodEntry {
  food_name: string
  grams_actual: number
  is_substitution: boolean
  original_food?: string
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TrackNutrition() {
  const { data: plan, isLoading: planLoading, error: planError } = useNutritionToday()
  const { data: logs, isLoading: logsLoading, error: logsError } = useMealLogsToday()

  const isLoading = planLoading || logsLoading
  const error = planError || logsError

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load nutrition data</p>
        <p className="text-sm mt-1">Pull down to refresh</p>
      </div>
    )
  }

  if (!plan?.available) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No nutrition plan available</p>
        <p className="text-sm mt-1">Your coach will set this up for you</p>
      </div>
    )
  }

  const loggedMap = new Map<number, LoggedMeal>()
  if (logs?.logged_meals) {
    for (const lm of logs.logged_meals) {
      loggedMap.set(lm.meal_number, lm)
    }
  }

  // Separate pending and logged meals
  const pendingMeals = plan.meals
    .filter((m) => !loggedMap.has(m.meal_number))
    .sort((a, b) => a.meal_number - b.meal_number)

  const loggedMeals = plan.meals
    .filter((m) => loggedMap.has(m.meal_number))
    .sort((a, b) => a.meal_number - b.meal_number)

  return (
    <div className="space-y-4">
      {/* Daily macro progress */}
      <DailyProgress
        totals={logs?.daily_totals}
        targets={logs?.daily_targets}
        planTotals={{
          protein: plan.total_protein,
          carbs: plan.total_carbs,
          fat: plan.total_fat,
          calories: plan.total_calories,
        }}
      />

      {/* Pending meals */}
      {pendingMeals.map((meal) => (
        <MealCard key={meal.meal_number} meal={meal} logged={null} />
      ))}

      {/* Logged meals (de-emphasized) */}
      {loggedMeals.length > 0 && (
        <div className="space-y-2 opacity-60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
            Logged
          </p>
          {loggedMeals.map((meal) => (
            <MealCard
              key={meal.meal_number}
              meal={meal}
              logged={loggedMap.get(meal.meal_number)!}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Daily Progress Bars
// ---------------------------------------------------------------------------

interface DailyProgressProps {
  totals?: {
    protein_consumed: number
    carbs_consumed: number
    fat_consumed: number
    calories_consumed: number
  }
  targets?: {
    protein_target: number
    carbs_target: number
    fat_target: number
    calories_target: number
  }
  planTotals: {
    protein: number
    carbs: number
    fat: number
    calories: number
  }
}

function DailyProgress({ totals, targets, planTotals }: DailyProgressProps) {
  // Use API targets if available, fall back to plan totals
  const proteinTarget = targets?.protein_target ?? planTotals.protein
  const carbsTarget = targets?.carbs_target ?? planTotals.carbs
  const fatTarget = targets?.fat_target ?? planTotals.fat
  const caloriesTarget = targets?.calories_target ?? planTotals.calories

  const proteinConsumed = totals?.protein_consumed ?? 0
  const carbsConsumed = totals?.carbs_consumed ?? 0
  const fatConsumed = totals?.fat_consumed ?? 0
  const caloriesConsumed = totals?.calories_consumed ?? 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          Daily Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MacroProgressBar
          label="Protein"
          consumed={proteinConsumed}
          target={proteinTarget}
          unit="g"
          color="bg-blue-500"
          trackColor="bg-blue-500/20"
        />
        <MacroProgressBar
          label="Carbs"
          consumed={carbsConsumed}
          target={carbsTarget}
          unit="g"
          color="bg-amber-500"
          trackColor="bg-amber-500/20"
        />
        <MacroProgressBar
          label="Fat"
          consumed={fatConsumed}
          target={fatTarget}
          unit="g"
          color="bg-pink-500"
          trackColor="bg-pink-500/20"
        />
        <MacroProgressBar
          label="Calories"
          consumed={caloriesConsumed}
          target={caloriesTarget}
          unit="kcal"
          color="bg-green-500"
          trackColor="bg-green-500/20"
        />
      </CardContent>
    </Card>
  )
}

function MacroProgressBar({
  label,
  consumed,
  target,
  unit,
  color,
  trackColor,
}: {
  label: string
  consumed: number
  target: number
  unit: string
  color: string
  trackColor: string
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {Math.round(consumed)} / {Math.round(target)}{unit}
        </span>
      </div>
      <div className={cn('h-2 rounded-full overflow-hidden', trackColor)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Meal Card
// ---------------------------------------------------------------------------

function MealCard({ meal, logged }: { meal: MealPlan; logged: LoggedMeal | null }) {
  const [expanded, setExpanded] = useState(false)
  const logMeal = useLogMeal()
  const [loggingAsPlanned, setLoggingAsPlanned] = useState(false)

  const isLogged = logged !== null

  function handleLogAsPlanned() {
    if (loggingAsPlanned || logMeal.isPending) return
    setLoggingAsPlanned(true)

    const foods: FoodEntry[] = meal.foods.map((f) => ({
      food_name: f.name,
      grams_actual: f.grams_cooked,
      is_substitution: false,
    }))

    logMeal.mutate(
      {
        date: new Date().toISOString().split('T')[0],
        meal_number: meal.meal_number,
        meal_label: meal.meal_label,
        status: 'COMPLETED',
        adherence: 100,
        notes: null,
        source: 'pwa',
        foods,
      },
      {
        onSettled: () => setLoggingAsPlanned(false),
      }
    )
  }

  // Status badge styling
  const statusBadge = isLogged ? (
    <Badge
      variant={logged.status === 'COMPLETED' ? 'success' : 'warning'}
      className="text-xs"
    >
      {logged.status === 'COMPLETED'
        ? 'Logged'
        : logged.status === 'SKIPPED'
          ? 'Skipped'
          : logged.status === 'MODIFIED'
            ? 'Modified'
            : logged.status}
      {logged.adherence != null && ` ${logged.adherence}%`}
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-xs">
      Pending
    </Badge>
  )

  return (
    <Card className={cn(isLogged && 'border-border/50')}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{meal.meal_label}</span>
            {meal.is_intra_workout && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Intra
              </Badge>
            )}
          </div>
          {statusBadge}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          P{Math.round(meal.protein)} C{Math.round(meal.carbs)} F{Math.round(meal.fat)}
        </p>
      </CardHeader>

      <CardContent className="pt-0 pb-3 px-4">
        {/* Planned foods list */}
        {meal.foods.length > 0 && (
          <div className="space-y-0.5 mb-3">
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

        {/* Action buttons (only for pending meals) */}
        {!isLogged && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleLogAsPlanned}
              disabled={loggingAsPlanned || logMeal.isPending}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'bg-primary text-primary-foreground active:bg-primary/80',
                (loggingAsPlanned || logMeal.isPending) && 'opacity-60'
              )}
            >
              {loggingAsPlanned ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {loggingAsPlanned ? 'Logging...' : 'Log as Planned'}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn(
                'flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'bg-muted text-muted-foreground active:bg-muted/80'
              )}
            >
              Changes
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  expanded && 'rotate-180'
                )}
              />
            </button>
          </div>
        )}

        {/* Error feedback for log-as-planned */}
        {!isLogged && logMeal.isError && (
          <p className="text-xs text-destructive mt-1">Failed to log meal. Tap to retry.</p>
        )}

        {/* Log with changes form */}
        {!isLogged && expanded && (
          <LogWithChangesForm meal={meal} />
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Log with Changes Form
// ---------------------------------------------------------------------------

function LogWithChangesForm({ meal }: { meal: MealPlan }) {
  const logMeal = useLogMeal()

  const [status, setStatus] = useState<MealStatus>('COMPLETED')
  const [notes, setNotes] = useState('')
  const [foodOverrides, setFoodOverrides] = useState<
    Map<number, { ateAsPlanned: boolean; substitute: string }>
  >(() => {
    const map = new Map<number, { ateAsPlanned: boolean; substitute: string }>()
    meal.foods.forEach((_, i) => map.set(i, { ateAsPlanned: true, substitute: '' }))
    return map
  })

  function toggleFoodPlanned(index: number) {
    setFoodOverrides((prev) => {
      const next = new Map(prev)
      const current = next.get(index)!
      next.set(index, { ...current, ateAsPlanned: !current.ateAsPlanned })
      return next
    })
  }

  function setSubstitute(index: number, value: string) {
    setFoodOverrides((prev) => {
      const next = new Map(prev)
      const current = next.get(index)!
      next.set(index, { ...current, substitute: value })
      return next
    })
  }

  function calculateAdherence(): number {
    if (status === 'SKIPPED') return 0
    const total = meal.foods.length
    if (total === 0) return 100
    const planned = meal.foods.filter((_, i) => foodOverrides.get(i)?.ateAsPlanned).length
    return Math.round((planned / total) * 100)
  }

  function handleSubmit() {
    if (logMeal.isPending) return

    const foods: FoodEntry[] = meal.foods.map((f, i) => {
      const override = foodOverrides.get(i)!
      if (override.ateAsPlanned) {
        return {
          food_name: f.name,
          grams_actual: f.grams_cooked,
          is_substitution: false,
        }
      }
      return {
        food_name: override.substitute || f.name,
        grams_actual: f.grams_cooked,
        is_substitution: !!override.substitute,
        original_food: override.substitute ? f.name : undefined,
      }
    })

    logMeal.mutate({
      date: new Date().toISOString().split('T')[0],
      meal_number: meal.meal_number,
      meal_label: meal.meal_label,
      status,
      adherence: calculateAdherence(),
      notes: notes.trim() || null,
      source: 'pwa',
      foods,
    })
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-4">
      {/* Status selector */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as MealStatus)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="COMPLETED">Completed</option>
          <option value="MODIFIED">Modified</option>
          <option value="SKIPPED">Skipped</option>
          <option value="PARTIAL">Partial</option>
        </select>
      </div>

      {/* Per-food overrides */}
      {status !== 'SKIPPED' && meal.foods.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Foods</p>
          {meal.foods.map((food, i) => {
            const override = foodOverrides.get(i)!
            return (
              <FoodOverrideRow
                key={i}
                food={food}
                ateAsPlanned={override.ateAsPlanned}
                substitute={override.substitute}
                onTogglePlanned={() => toggleFoodPlanned(i)}
                onSubstituteChange={(val) => setSubstitute(i, val)}
              />
            )
          })}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any comments about this meal..."
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={logMeal.isPending}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
          'bg-primary text-primary-foreground active:bg-primary/80',
          logMeal.isPending && 'opacity-60'
        )}
      >
        {logMeal.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit'
        )}
      </button>

      {logMeal.isError && (
        <p className="text-xs text-destructive text-center">
          Failed to log meal. Please try again.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Food Override Row
// ---------------------------------------------------------------------------

function FoodOverrideRow({
  food,
  ateAsPlanned,
  substitute,
  onTogglePlanned,
  onSubstituteChange,
}: {
  food: MealFood
  ateAsPlanned: boolean
  substitute: string
  onTogglePlanned: () => void
  onSubstituteChange: (val: string) => void
}) {
  return (
    <div className="rounded-lg border border-border/50 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm truncate flex-1">{food.name}</span>
        <button
          type="button"
          role="switch"
          aria-checked={ateAsPlanned}
          onClick={onTogglePlanned}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
            ateAsPlanned ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-background transition-transform',
              ateAsPlanned ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {ateAsPlanned ? 'Ate as planned' : 'Had a substitute'}
      </p>
      {!ateAsPlanned && (
        <input
          type="text"
          value={substitute}
          onChange={(e) => onSubstituteChange(e.target.value)}
          placeholder="What did you eat instead?"
          className="mt-2 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  )
}
