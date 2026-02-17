import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { FoodSearchResult } from '@/lib/types'

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['client', 'foods', 'search', query],
    queryFn: () =>
      apiFetch<{ foods: FoodSearchResult[] }>(`/nutrition/foods/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
