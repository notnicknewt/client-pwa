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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', 'meal-logs'] })
      qc.invalidateQueries({ queryKey: ['client', 'nutrition'] })
    },
  })
}
