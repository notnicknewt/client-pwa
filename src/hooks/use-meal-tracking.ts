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
