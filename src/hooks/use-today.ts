import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { TodayData } from '@/lib/types'

export function useToday() {
  return useQuery({
    queryKey: ['client', 'today'],
    queryFn: () => apiFetch<TodayData>('/today'),
    staleTime: 2 * 60 * 1000,
  })
}
