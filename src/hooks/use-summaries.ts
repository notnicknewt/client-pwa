import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { SummaryData } from '@/lib/types'

export function useSummaries() {
  return useQuery({
    queryKey: ['client', 'weekly-summaries'],
    queryFn: () => apiFetch<SummaryData>('/weekly-summaries'),
    staleTime: 10 * 60 * 1000,
  })
}
