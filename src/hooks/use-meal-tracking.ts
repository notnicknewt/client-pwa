import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { MealLogsToday, MealLogPayload, MealLogDeletePayload } from '@/lib/types'

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
    mutationFn: (data: MealLogPayload) =>
      apiFetch('/nutrition/meal-log', { method: 'POST', body: data }),
    onMutate: async (newMeal) => {
      await qc.cancelQueries({ queryKey: ['client', 'meal-logs'] })
      const previous = qc.getQueryData<MealLogsToday>(['client', 'meal-logs', 'today'])
      if (previous) {
        // Sum macros from food entries if available
        let addedProtein = 0, addedCarbs = 0, addedFat = 0, addedCalories = 0
        const hasFoodMacros = newMeal.foods.some((f) => f.protein != null)
        if (hasFoodMacros) {
          for (const f of newMeal.foods) {
            addedProtein += f.protein ?? 0
            addedCarbs += f.carbs ?? 0
            addedFat += f.fat ?? 0
            addedCalories += f.calories ?? 0
          }
        }

        qc.setQueryData<MealLogsToday>(['client', 'meal-logs', 'today'], {
          ...previous,
          logged_meals: [
            ...(previous.logged_meals || []),
            {
              meal_number: newMeal.meal_number,
              status: newMeal.status,
              adherence: newMeal.adherence,
              foods: newMeal.foods.map((f) => ({
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
          daily_totals: hasFoodMacros ? {
            protein_consumed: (previous.daily_totals?.protein_consumed ?? 0) + addedProtein,
            carbs_consumed: (previous.daily_totals?.carbs_consumed ?? 0) + addedCarbs,
            fat_consumed: (previous.daily_totals?.fat_consumed ?? 0) + addedFat,
            calories_consumed: (previous.daily_totals?.calories_consumed ?? 0) + addedCalories,
          } : previous.daily_totals,
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['client', 'meal-logs', 'today'], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['client', 'meal-logs'] })
      qc.invalidateQueries({ queryKey: ['client', 'nutrition'] })
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
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['client', 'meal-logs', 'today'], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['client', 'meal-logs'] })
      qc.invalidateQueries({ queryKey: ['client', 'nutrition'] })
    },
  })
}
