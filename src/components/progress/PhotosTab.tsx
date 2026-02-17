import { useState, useRef } from 'react'
import { usePhotos, useUploadPhoto } from '@/hooks/use-photos'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Camera, Upload, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const PHOTO_TYPES = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
]

export default function PhotosTab() {
  const { data, isLoading, error } = usePhotos()
  const uploadPhoto = useUploadPhoto()
  const fileRef = useRef<HTMLInputElement>(null)

  const [photoType, setPhotoType] = useState('front')
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fullView, setFullView] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Photo must be under 10MB')
      return
    }
    setUploadError(null)
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = () => {
    if (!selectedFile) return
    setUploadError(null)
    const formData = new FormData()
    formData.append('photo', selectedFile)
    formData.append('photo_type', photoType)
    uploadPhoto.mutate(formData, {
      onSuccess: () => {
        setSelectedFile(null)
        setPreview(null)
        if (fileRef.current) fileRef.current.value = ''
      },
      onError: () => {
        setUploadError('Upload failed. Please try again.')
      },
    })
  }

  const clearPreview = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load photos</p>
        <p className="text-sm mt-1">Pull down to refresh</p>
      </div>
    )
  }

  const photos = data?.photos || []

  // Group by week
  const grouped = new Map<string, typeof photos>()
  for (const p of photos) {
    const key = p.program_week ? `Week ${p.program_week}` : 'Other'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(p)
  }

  return (
    <div className="space-y-4">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Upload Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Photo type selector */}
          <div className="flex gap-2">
            {PHOTO_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setPhotoType(t.value)}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                  photoType === t.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* File picker + preview */}
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />
              <button
                onClick={clearPreview}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
            >
              <Camera className="h-8 w-8" />
              <span className="text-sm">Tap to select photo</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploadPhoto.isPending}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            >
              {uploadPhoto.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                `Upload ${photoType} photo`
              )}
            </button>
          )}
          {uploadError && (
            <p className="text-sm text-red-400 text-center">{uploadError}</p>
          )}
        </CardContent>
      </Card>

      {/* Gallery */}
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : photos.length > 0 ? (
        Array.from(grouped.entries()).map(([week, weekPhotos]) => (
          <Card key={week}>
            <CardHeader>
              <CardTitle className="text-base">{week}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {weekPhotos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFullView(p.original_url)}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={p.original_url}
                      alt={p.photo_type}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {p.photo_type}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No progress photos yet</p>
          <p className="text-xs mt-1">Upload your first photo above</p>
        </div>
      )}

      {/* Full-size viewer */}
      {fullView && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullView(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setFullView(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img src={fullView} alt="Progress" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  )
}
