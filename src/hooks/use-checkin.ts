import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export function useStartCheckin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (date: string) =>
      apiFetch('/checkin/start', { method: 'POST', body: { date } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', 'today'] })
    },
  })
}
