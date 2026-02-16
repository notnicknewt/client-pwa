import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { TrainingTodayData, TrainingWeekData } from '@/lib/types'

export function useTrainingToday() {
  return useQuery({
    queryKey: ['client', 'training', 'today'],
    queryFn: () => apiFetch<TrainingTodayData>('/training/today'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTrainingWeek() {
  return useQuery({
    queryKey: ['client', 'training', 'week'],
    queryFn: () => apiFetch<TrainingWeekData>('/training/week'),
    staleTime: 10 * 60 * 1000,
  })
}
