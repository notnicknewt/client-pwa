import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { TodayData, TrainingWeekData, NutritionWeekData } from '@/lib/types'

export function useToday() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['client', 'today'],
    queryFn: () => apiFetch<TodayData>('/today'),
    staleTime: 2 * 60 * 1000,
  })

  const hasData = !!query.data
  useEffect(() => {
    if (hasData) {
      qc.prefetchQuery({
        queryKey: ['client', 'training', 'week'],
        queryFn: () => apiFetch<TrainingWeekData>('/training/week'),
        staleTime: 10 * 60 * 1000,
      })
      qc.prefetchQuery({
        queryKey: ['client', 'nutrition', 'week'],
        queryFn: () => apiFetch<NutritionWeekData>('/nutrition/week'),
        staleTime: 10 * 60 * 1000,
      })
    }
  }, [hasData, qc])

  return query
}
