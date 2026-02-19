import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { MealLogsToday, MealLogPayload, MealLogDeletePayload } from '@/lib/types'

const SERVER_STATUSES = ['COMPLETED', 'MODIFIED', 'SKIPPED', 'PARTIAL'] as const
type ServerStatus = (typeof SERVER_STATUSES)[number]

function normalizeMealStatus(status: string): ServerStatus {
  if (status === 'CUSTOM') return 'MODIFIED'
  if ((SERVER_STATUSES as readonly string[]).includes(status)) {
    return status as ServerStatus
  }
  return 'COMPLETED'
}

function normalizeMealPayload(data: MealLogPayload): MealLogPayload {
  return {
    ...data,
    status: normalizeMealStatus(data.status),
    meal_label: data.meal_label?.trim() || `Meal ${data.meal_number}`,
  }
}

function isApiErrorStatus(error: unknown, code: number): boolean {
  return error instanceof Error && error.message.startsWith(`API ${code}:`)
}

export function useMealLogsToday() {
  return useQuery({
    queryKey: ['client', 'meal-logs', 'today'],
    queryFn: () => apiFetch<MealLogsToday>('/nutrition/meal-logs/today'),
    staleTime: 60_000,
  })
}

export function useLogMeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: MealLogPayload) => {
      const normalized = normalizeMealPayload(data)
      const { meal_protein, meal_carbs, meal_fat, meal_calories, ...serverPayload } = normalized
      try {
        return await apiFetch('/nutrition/meal-log', { method: 'POST', body: serverPayload })
      } catch (error) {
        // NC enforces unique (clientId, date, mealNumber); retry as upsert on conflict.
        if (!isApiErrorStatus(error, 409)) throw error

        try {
          await apiFetch('/nutrition/meal-log', {
            method: 'DELETE',
            body: { date: serverPayload.date, meal_number: serverPayload.meal_number },
          })
        } catch (deleteError) {
          if (!isApiErrorStatus(deleteError, 404)) throw deleteError
        }

        return apiFetch('/nutrition/meal-log', { method: 'POST', body: serverPayload })
      }
    },
    onMutate: async (newMeal) => {
      const optimisticMeal = normalizeMealPayload(newMeal)
      await qc.cancelQueries({ queryKey: ['client', 'meal-logs'] })
      const previous = qc.getQueryData<MealLogsToday>(['client', 'meal-logs', 'today'])
      if (previous) {
        // Calculate added macros: prefer per-food sums, fall back to meal-level
        let addedProtein = 0, addedCarbs = 0, addedFat = 0, addedCalories = 0
        const hasFoodMacros = optimisticMeal.foods.some((f) => f.protein != null)
        if (hasFoodMacros) {
          for (const f of optimisticMeal.foods) {
            addedProtein += f.protein ?? 0
            addedCarbs += f.carbs ?? 0
            addedFat += f.fat ?? 0
            addedCalories += f.calories ?? 0
          }
        } else if (optimisticMeal.meal_protein != null) {
          addedProtein = optimisticMeal.meal_protein
          addedCarbs = optimisticMeal.meal_carbs ?? 0
          addedFat = optimisticMeal.meal_fat ?? 0
          addedCalories = optimisticMeal.meal_calories ?? 0
        }

        // Upsert: remove existing entry for same meal_number before adding
        const existingMeals = (previous.logged_meals || [])
        const replaced = existingMeals.find((lm) => lm.meal_number === optimisticMeal.meal_number)
        const filteredMeals = existingMeals.filter((lm) => lm.meal_number !== optimisticMeal.meal_number)

        // Subtract replaced meal's macros from totals before adding new ones
        let baseTotals = previous.daily_totals
        if (replaced?.foods?.length) {
          let subP = 0, subC = 0, subF = 0, subCal = 0
          for (const f of replaced.foods) {
            subP += f.protein ?? 0
            subC += f.carbs ?? 0
            subF += f.fat ?? 0
            subCal += f.calories ?? 0
          }
          baseTotals = {
            protein_consumed: Math.max(0, (baseTotals?.protein_consumed ?? 0) - subP),
            carbs_consumed: Math.max(0, (baseTotals?.carbs_consumed ?? 0) - subC),
            fat_consumed: Math.max(0, (baseTotals?.fat_consumed ?? 0) - subF),
            calories_consumed: Math.max(0, (baseTotals?.calories_consumed ?? 0) - subCal),
          }
        }

        qc.setQueryData<MealLogsToday>(['client', 'meal-logs', 'today'], {
          ...previous,
          logged_meals: [
            ...filteredMeals,
            {
              meal_number: optimisticMeal.meal_number,
              meal_label: optimisticMeal.meal_label,
              status: optimisticMeal.status,
              adherence: optimisticMeal.adherence,
              foods: optimisticMeal.foods.map((f) => ({
                food_name: f.food_name,
                grams_actual: f.grams_actual,
                is_substitution: f.is_substitution,
                original_food: f.original_food ?? null,
                protein: f.protein ?? null,
                carbs: f.carbs ?? null,
                fat: f.fat ?? null,
                calories: f.calories ?? null,
              })),
            },
          ],
          daily_totals: {
            protein_consumed: (baseTotals?.protein_consumed ?? 0) + addedProtein,
            carbs_consumed: (baseTotals?.carbs_consumed ?? 0) + addedCarbs,
            fat_consumed: (baseTotals?.fat_consumed ?? 0) + addedFat,
            calories_consumed: (baseTotals?.calories_consumed ?? 0) + addedCalories,
          },
        })
      }
      return { previous }
    },
    onError: (err, _vars, context) => {
      console.error('[useLogMeal] mutation failed:', err)
      if (context?.previous) {
        qc.setQueryData(['client', 'meal-logs', 'today'], context.previous)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', 'meal-logs'] })
    },
  })
}

export function useDeleteMealLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MealLogDeletePayload) =>
      apiFetch('/nutrition/meal-log', { method: 'DELETE', body: data }),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ['client', 'meal-logs'] })
      const previous = qc.getQueryData<MealLogsToday>(['client', 'meal-logs', 'today'])
      if (previous) {
        const removedMeal = previous.logged_meals?.find(
          (lm) => lm.meal_number === payload.meal_number
        )
        // Subtract macros if the logged meal had food data
        let newTotals = previous.daily_totals
        if (removedMeal?.foods?.length) {
          let subProtein = 0, subCarbs = 0, subFat = 0, subCalories = 0
          for (const f of removedMeal.foods) {
            subProtein += f.protein ?? 0
            subCarbs += f.carbs ?? 0
            subFat += f.fat ?? 0
            subCalories += f.calories ?? 0
          }
          newTotals = {
            protein_consumed: Math.max(0, (previous.daily_totals?.protein_consumed ?? 0) - subProtein),
            carbs_consumed: Math.max(0, (previous.daily_totals?.carbs_consumed ?? 0) - subCarbs),
            fat_consumed: Math.max(0, (previous.daily_totals?.fat_consumed ?? 0) - subFat),
            calories_consumed: Math.max(0, (previous.daily_totals?.calories_consumed ?? 0) - subCalories),
          }
        }

        qc.setQueryData<MealLogsToday>(['client', 'meal-logs', 'today'], {
          ...previous,
          logged_meals: (previous.logged_meals || []).filter(
            (lm) => lm.meal_number !== payload.meal_number
          ),
          daily_totals: newTotals,
        })
      }
      return { previous }
    },
    onError: (err, _vars, context) => {
      console.error('[useDeleteMealLog] mutation failed:', err)
      if (context?.previous) {
        qc.setQueryData(['client', 'meal-logs', 'today'], context.previous)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', 'meal-logs'] })
    },
  })
}
