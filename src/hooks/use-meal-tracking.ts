import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { MealLogsToday, MealLogPayload } from '@/lib/types'

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
