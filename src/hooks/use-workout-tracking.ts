import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { WorkoutSessionData, WorkoutLogPayload } from '@/lib/types'

export function useWorkoutSession() {
  return useQuery({
    queryKey: ['client', 'workout', 'session'],
    queryFn: () => apiFetch<WorkoutSessionData>('/workout/start', { method: 'POST' }),
    staleTime: 0, // Always fresh when opening workout
    retry: 1,
  })
}

export function useSubmitWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkoutLogPayload) =>
      apiFetch('/workout/log', { method: 'POST', body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', 'training'] })
      qc.invalidateQueries({ queryKey: ['client', 'workout'] })
    },
    onError: (error) => {
      console.error('Failed to submit workout:', error)
    },
  })
}
