import { useState, useEffect } from 'react'
import { useNutritionToday } from '@/hooks/use-nutrition'
import { useMealLogsToday, useLogMeal } from '@/hooks/use-meal-tracking'
import { useFoodSearch } from '@/hooks/use-food-search'
import { calculateMacros, round1 } from '@/lib/macro-calc'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { UtensilsCrossed, Check, ChevronDown, Loader2, Search, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealPlan, MealFood, NutritionTodayData, FoodSearchResult } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types local to this page
// ---------------------------------------------------------------------------

type MealStatus = 'COMPLETED' | 'MODIFIED' | 'SKIPPED' | 'PARTIAL'

interface LoggedMeal {
  meal_number: number
  meal_label?: string
  status: string
  adherence: number | null
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
  const [extraMeals, setExtraMeals] = useState<number[]>([])

  // Prune extra meals that have been logged (after refetch)
  useEffect(() => {
    if (!logs?.logged_meals?.length) return
    const loggedSet = new Set(logs.logged_meals.map((lm) => lm.meal_number))
    setExtraMeals((prev) => {
      const pruned = prev.filter((n) => !loggedSet.has(n))
      return pruned.length === prev.length ? prev : pruned
    })
  }, [logs])

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

  // Free-form mode: no planned meals, just N slots
  if (plan.meals.length === 0) {
    return (
      <div className="space-y-4">
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
        <FreeMealSlots plan={plan} loggedMap={loggedMap} />
      </div>
    )
  }

  // Separate pending and logged meals
  const pendingMeals = plan.meals
    .filter((m) => !loggedMap.has(m.meal_number))
    .sort((a, b) => a.meal_number - b.meal_number)

  const loggedMeals = plan.meals
    .filter((m) => loggedMap.has(m.meal_number))
    .sort((a, b) => a.meal_number - b.meal_number)

  // Ad-hoc extra meals
  const plannedNumberSet = new Set(plan.meals.map((m) => m.meal_number))
  const pendingExtras = extraMeals.filter((n) => !loggedMap.has(n))
  const loggedExtras = Array.from(loggedMap.keys())
    .filter((n) => !plannedNumberSet.has(n))
    .sort((a, b) => a - b)

  // Stable references for the add-meal handler (won't change between rapid clicks)
  const plannedNumbers = plan.meals.map((m) => m.meal_number)
  const loggedNumbers = Array.from(loggedMap.keys())

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

      {/* Extra ad-hoc meal cards */}
      {pendingExtras.map((num) => (
        <FreeMealCard
          key={`extra-${num}`}
          mealNumber={num}
          mealLabel={`Meal ${num}`}
          onRemove={() => setExtraMeals((prev) => prev.filter((n) => n !== num))}
        />
      ))}

      {/* Add Meal button */}
      <button
        onClick={() => setExtraMeals((prev) => {
          const all = [...plannedNumbers, ...loggedNumbers, ...prev]
          const next = all.reduce((max, n) => (n > max ? n : max), 0) + 1
          return [...prev, next]
        })}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-border text-sm font-medium text-muted-foreground active:bg-muted/50 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Meal
      </button>

      {/* Logged meals (de-emphasized) */}
      {(loggedMeals.length > 0 || loggedExtras.length > 0) && (
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
          {loggedExtras.map((num) => {
            const log = loggedMap.get(num)
            return (
              <Card key={`extra-logged-${num}`} className="border-border/50">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {log?.meal_label || `Meal ${num}`}
                    </span>
                    <Badge variant="success" className="text-xs">Logged</Badge>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
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

  // Extra foods search state
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [extraFoods, setExtraFoods] = useState<AddedFood[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: searchData, isLoading: searching } = useFoodSearch(debouncedQuery)

  function addExtraFood(food: FoodSearchResult) {
    const grams = food.serving_size || 100
    const macros = calculateMacros(food, grams)
    setExtraFoods((prev) => [
      ...prev,
      { id: food.id, name: food.name, grams, calculatedMacros: macros, searchResult: food },
    ])
    setSearchInput('')
    setDebouncedQuery('')
  }

  function updateExtraGrams(index: number, grams: number) {
    setExtraFoods((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f
        const macros = f.searchResult
          ? calculateMacros(f.searchResult, grams)
          : f.calculatedMacros
        return { ...f, grams, calculatedMacros: macros }
      })
    )
  }

  function removeExtraFood(index: number) {
    setExtraFoods((prev) => prev.filter((_, i) => i !== index))
  }

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

    // Append extra foods
    for (const ef of extraFoods) {
      foods.push({
        food_name: ef.name,
        grams_actual: ef.grams,
        is_substitution: false,
      })
    }

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

      {/* Add extra foods */}
      {status !== 'SKIPPED' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add Extra Foods</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search foods to add..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {debouncedQuery.trim().length >= 2 && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border/50">
              {searching && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {searchData?.foods?.map((food) => (
                <button
                  key={food.id}
                  onClick={() => addExtraFood(food)}
                  className="w-full text-left px-3 py-2 active:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium truncate block">{food.name}</span>
                  <p className="text-[11px] text-muted-foreground">
                    P{food.protein_per_100g} C{food.carbs_per_100g} F{food.fat_per_100g} per 100g
                  </p>
                </button>
              ))}
              {searchData && searchData.foods?.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No results found</p>
              )}
            </div>
          )}

          {extraFoods.length > 0 && (
            <div className="space-y-1.5">
              {extraFoods.map((food, i) => (
                <div key={i} className="rounded-lg border border-border/50 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate flex-1">{food.name}</span>
                    <button
                      onClick={() => removeExtraFood(i)}
                      aria-label={`Remove ${food.name}`}
                      className="p-1 rounded text-muted-foreground active:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={food.grams}
                      onChange={(e) => updateExtraGrams(i, Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      P{food.calculatedMacros.protein} C{food.calculatedMacros.carbs} F{food.calculatedMacros.fat} | {food.calculatedMacros.calories}kcal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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

// ---------------------------------------------------------------------------
// Free Meal Slots (no planned meals - macro-only plans)
// ---------------------------------------------------------------------------

interface MealSlot {
  meal_number: number
  meal_label: string
}

function FreeMealSlots({
  plan,
  loggedMap,
}: {
  plan: NutritionTodayData
  loggedMap: Map<number, LoggedMeal>
}) {
  const slotCount = plan.meals_per_day || 4
  const slots: MealSlot[] = Array.from({ length: slotCount }, (_, i) => ({
    meal_number: i + 1,
    meal_label: `Meal ${i + 1}`,
  }))

  const pendingSlots = slots.filter((s) => !loggedMap.has(s.meal_number))
  const loggedSlots = slots.filter((s) => loggedMap.has(s.meal_number))

  return (
    <>
      {pendingSlots.map((slot) => (
        <FreeMealCard
          key={slot.meal_number}
          mealNumber={slot.meal_number}
          mealLabel={slot.meal_label}
        />
      ))}

      {loggedSlots.length > 0 && (
        <div className="space-y-2 opacity-60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
            Logged
          </p>
          {loggedSlots.map((slot) => (
            <Card key={slot.meal_number} className="border-border/50">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{slot.meal_label}</span>
                  <Badge variant="success" className="text-xs">Logged</Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Free Meal Card (search + log foods)
// ---------------------------------------------------------------------------

interface AddedFood {
  id?: string
  name: string
  grams: number
  calculatedMacros: { protein: number; carbs: number; fat: number; calories: number }
  searchResult?: FoodSearchResult
  // For manual foods: per-100g values used to recalculate on gram change
  manualPer100g?: { protein: number; carbs: number; fat: number }
}

function FreeMealCard({
  mealNumber,
  mealLabel,
  onRemove,
}: {
  mealNumber: number
  mealLabel: string
  onRemove?: () => void
}) {
  const logMeal = useLogMeal()
  const [expanded, setExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [addedFoods, setAddedFoods] = useState<AddedFood[]>([])
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualProtein, setManualProtein] = useState('')
  const [manualCarbs, setManualCarbs] = useState('')
  const [manualFat, setManualFat] = useState('')
  const [manualGrams, setManualGrams] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: searchData, isLoading: searching } = useFoodSearch(debouncedQuery)

  function addFood(food: FoodSearchResult) {
    const grams = food.serving_size || 100
    const macros = calculateMacros(food, grams)
    setAddedFoods((prev) => [
      ...prev,
      { id: food.id, name: food.name, grams, calculatedMacros: macros, searchResult: food },
    ])
    setSearchInput('')
    setDebouncedQuery('')
  }

  function updateGrams(index: number, grams: number) {
    setAddedFoods((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f
        let macros: AddedFood['calculatedMacros']
        if (f.searchResult) {
          macros = calculateMacros(f.searchResult, grams)
        } else if (f.manualPer100g) {
          const multiplier = grams / 100
          macros = {
            protein: round1(f.manualPer100g.protein * multiplier),
            carbs: round1(f.manualPer100g.carbs * multiplier),
            fat: round1(f.manualPer100g.fat * multiplier),
            calories: Math.round(
              (f.manualPer100g.protein * 4 + f.manualPer100g.carbs * 4 + f.manualPer100g.fat * 9) * multiplier
            ),
          }
        } else {
          macros = f.calculatedMacros
        }
        return { ...f, grams, calculatedMacros: macros }
      })
    )
  }

  function removeFood(index: number) {
    setAddedFoods((prev) => prev.filter((_, i) => i !== index))
  }

  function addManualFood() {
    const p = Math.max(0, parseFloat(manualProtein) || 0)
    const c = Math.max(0, parseFloat(manualCarbs) || 0)
    const ft = Math.max(0, parseFloat(manualFat) || 0)
    const g = Math.max(0, parseFloat(manualGrams) || 100)
    const multiplier = g / 100
    const macros = {
      protein: round1(p * multiplier),
      carbs: round1(c * multiplier),
      fat: round1(ft * multiplier),
      calories: Math.round((p * 4 + c * 4 + ft * 9) * multiplier),
    }
    setAddedFoods((prev) => [
      ...prev,
      {
        name: manualName || 'Custom food',
        grams: g,
        calculatedMacros: macros,
        manualPer100g: { protein: p, carbs: c, fat: ft },
      },
    ])
    setManualName('')
    setManualProtein('')
    setManualCarbs('')
    setManualFat('')
    setManualGrams('')
    setShowManual(false)
  }

  const totals = addedFoods.reduce(
    (acc, f) => ({
      protein: acc.protein + f.calculatedMacros.protein,
      carbs: acc.carbs + f.calculatedMacros.carbs,
      fat: acc.fat + f.calculatedMacros.fat,
      calories: acc.calories + f.calculatedMacros.calories,
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  )

  function handleLogMeal() {
    if (isLogging || logMeal.isPending || addedFoods.length === 0) return
    setIsLogging(true)

    logMeal.mutate(
      {
        date: new Date().toISOString().split('T')[0],
        meal_number: mealNumber,
        meal_label: mealLabel,
        status: 'COMPLETED',
        adherence: 100,
        notes: null,
        source: 'pwa',
        foods: addedFoods.map((f) => ({
          food_name: f.name,
          grams_actual: f.grams,
          is_substitution: false,
          food_id: f.id || undefined,
          protein: f.calculatedMacros.protein,
          carbs: f.calculatedMacros.carbs,
          fat: f.calculatedMacros.fat,
          calories: f.calculatedMacros.calories,
        })),
      },
      {
        onSettled: () => setIsLogging(false),
      }
    )
  }

  if (!expanded) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{mealLabel}</span>
            <div className="flex items-center gap-2">
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="p-1.5 rounded-lg text-muted-foreground active:bg-muted transition-colors"
                  aria-label="Remove meal"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground active:bg-primary/80 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Foods
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{mealLabel}</span>
          <div className="flex items-center gap-1">
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg text-muted-foreground active:bg-muted transition-colors"
                aria-label="Remove meal"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setExpanded(false)}
              className="p-1.5 rounded-lg text-muted-foreground active:bg-muted transition-colors"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search foods..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Search results */}
        {debouncedQuery.trim().length >= 2 && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border/50">
            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {searchData?.foods?.map((food) => (
              <button
                key={food.id}
                onClick={() => addFood(food)}
                className="w-full text-left px-3 py-2.5 active:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate flex-1">{food.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                    {food.category}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  P{food.protein_per_100g} C{food.carbs_per_100g} F{food.fat_per_100g} per 100g
                </p>
              </button>
            ))}
            {searchData && searchData.foods?.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No results found</p>
            )}
          </div>
        )}

        {/* Added foods */}
        {addedFoods.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Added Foods</p>
            {addedFoods.map((food, i) => (
              <div key={i} className="rounded-lg border border-border/50 p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm truncate flex-1">{food.name}</span>
                  <button
                    onClick={() => removeFood(i)}
                    aria-label={`Remove ${food.name}`}
                    className="p-1 rounded text-muted-foreground active:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={food.grams}
                    onChange={(e) => updateGrams(i, Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">g</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    P{food.calculatedMacros.protein} C{food.calculatedMacros.carbs} F{food.calculatedMacros.fat} | {food.calculatedMacros.calories}kcal
                  </span>
                </div>
              </div>
            ))}

            {/* Running total */}
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-medium">Total</span>
              <span className="text-xs font-medium">
                P{round1(totals.protein)} C{round1(totals.carbs)} F{round1(totals.fat)} | {Math.round(totals.calories)}kcal
              </span>
            </div>
          </div>
        )}

        {/* Manual entry toggle */}
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-xs text-primary font-medium"
        >
          {showManual ? 'Hide manual entry' : "Can't find food?"}
        </button>

        {showManual && (
          <div className="space-y-2 rounded-lg border border-border/50 p-3">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Food name"
              className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Protein/100g</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={manualProtein}
                  onChange={(e) => setManualProtein(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Carbs/100g</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Fat/100g</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={manualFat}
                  onChange={(e) => setManualFat(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">Grams</label>
              <input
                type="number"
                inputMode="numeric"
                value={manualGrams}
                onChange={(e) => setManualGrams(e.target.value)}
                placeholder="100"
                className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={addManualFood}
              disabled={!manualName.trim()}
              className={cn(
                'w-full py-2 rounded-lg text-sm font-medium transition-colors',
                'bg-muted text-foreground active:bg-muted/80',
                !manualName.trim() && 'opacity-40'
              )}
            >
              Add Food
            </button>
          </div>
        )}

        {/* Log meal button */}
        <button
          onClick={handleLogMeal}
          disabled={isLogging || logMeal.isPending || addedFoods.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors',
            'bg-primary text-primary-foreground active:bg-primary/80',
            (isLogging || logMeal.isPending || addedFoods.length === 0) && 'opacity-60'
          )}
        >
          {isLogging ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Log Meal
            </>
          )}
        </button>

        {logMeal.isError && (
          <p className="text-xs text-destructive text-center">Failed to log meal. Please try again.</p>
        )}
      </CardContent>
    </Card>
  )
}

