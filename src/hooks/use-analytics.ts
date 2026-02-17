import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { TopExercisesData, StrengthProgressionData, VolumeProgressionData } from '@/lib/types'

export function useTopExercises() {
  return useQuery({
    queryKey: ['client', 'analytics', 'top-exercises'],
    queryFn: () => apiFetch<TopExercisesData>('/analytics/top-exercises?limit=10'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useStrengthProgression(exerciseId: string | null) {
  return useQuery({
    queryKey: ['client', 'analytics', 'strength', exerciseId],
    queryFn: () => apiFetch<StrengthProgressionData>(`/analytics/strength?exercise_id=${exerciseId}&weeks=12`),
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useVolumeProgression(exerciseId: string | null) {
  return useQuery({
    queryKey: ['client', 'analytics', 'volume', exerciseId],
    queryFn: () => apiFetch<VolumeProgressionData>(`/analytics/volume?exercise_id=${exerciseId}&weeks=8`),
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
  })
}
