import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { NutritionTodayData, NutritionWeekData } from '@/lib/types'

export function useNutritionToday() {
  return useQuery({
    queryKey: ['client', 'nutrition', 'today'],
    queryFn: () => apiFetch<NutritionTodayData>('/nutrition/today'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useNutritionWeek() {
  return useQuery({
    queryKey: ['client', 'nutrition', 'week'],
    queryFn: () => apiFetch<NutritionWeekData>('/nutrition/week'),
    staleTime: 10 * 60 * 1000,
  })
}
