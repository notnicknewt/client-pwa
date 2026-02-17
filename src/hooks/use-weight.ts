import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { WeightData, WeightLogPayload } from '@/lib/types'

export function useWeight() {
  return useQuery({
    queryKey: ['client', 'weight'],
    queryFn: () => apiFetch<WeightData>('/weight'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogWeight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: WeightLogPayload) =>
      apiFetch('/weight', { method: 'POST', body: payload }),
    onMutate: async (newEntry) => {
      await qc.cancelQueries({ queryKey: ['client', 'weight'] })
      const previous = qc.getQueryData<WeightData>(['client', 'weight'])
      if (previous) {
        qc.setQueryData<WeightData>(['client', 'weight'], {
          ...previous,
          entries: [...(previous.entries || []), { date: newEntry.date, weight: newEntry.weight, weekly_change: null }],
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['client', 'weight'], context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['client', 'weight'] })
    },
  })
}
