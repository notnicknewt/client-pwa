import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiUpload } from '@/lib/api'
import type { PhotosData, ProgressPhoto } from '@/lib/types'

export function usePhotos() {
  return useQuery({
    queryKey: ['client', 'photos'],
    queryFn: () => apiFetch<PhotosData>('/photos'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiUpload<ProgressPhoto>('/photos', formData),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['client', 'photos'] })
    },
  })
}
