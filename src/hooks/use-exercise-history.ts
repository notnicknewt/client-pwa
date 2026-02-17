import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { ExerciseHistoryData } from '@/lib/types'

export function useExerciseHistory(exerciseName: string | null) {
  return useQuery({
    queryKey: ['client', 'exercise', 'history', exerciseName],
    queryFn: () => apiFetch<ExerciseHistoryData>(`/exercise/history?name=${encodeURIComponent(exerciseName!)}`),
    enabled: !!exerciseName,
    staleTime: 5 * 60 * 1000,
  })
}
