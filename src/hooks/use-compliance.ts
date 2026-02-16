import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { ComplianceData } from '@/lib/types'

export function useCompliance() {
  return useQuery({
    queryKey: ['client', 'compliance'],
    queryFn: () => apiFetch<ComplianceData>('/compliance'),
    staleTime: 5 * 60 * 1000,
  })
}
