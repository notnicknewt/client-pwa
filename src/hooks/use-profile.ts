import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Profile } from '@/lib/types'

export function useProfile() {
  return useQuery({
    queryKey: ['client', 'profile'],
    queryFn: () => apiFetch<Profile>('/profile'),
    staleTime: 5 * 60 * 1000,
  })
}
