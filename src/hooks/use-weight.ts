import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { WeightData } from '@/lib/types'

export function useWeight() {
  return useQuery({
    queryKey: ['client', 'weight'],
    queryFn: () => apiFetch<WeightData>('/weight'),
    staleTime: 5 * 60 * 1000,
  })
}
