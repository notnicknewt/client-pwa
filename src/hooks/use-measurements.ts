import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { MeasurementsData, MeasurementPayload } from '@/lib/types'

export function useMeasurements() {
  return useQuery({
    queryKey: ['client', 'measurements'],
    queryFn: () => apiFetch<MeasurementsData>('/measurements'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogMeasurement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MeasurementPayload) =>
      apiFetch('/measurements', { method: 'POST', body: payload }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['client', 'measurements'] })
    },
  })
}
