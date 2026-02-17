import { X } from 'lucide-react'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface ExerciseHistoryModalProps {
  exerciseName: string | null
  onClose: () => void
}

export function ExerciseHistoryModal({ exerciseName, onClose }: ExerciseHistoryModalProps) {
  const { data, isLoading } = useExerciseHistory(exerciseName)

  if (!exerciseName) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="bg-card w-full max-h-[80vh] rounded-t-2xl overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{exerciseName}</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !data?.history?.length ? (
          <p className="text-center text-muted-foreground py-8">No history yet</p>
        ) : (
          <div className="space-y-4">
            {data.history.map((entry, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <p className="text-sm font-medium text-muted-foreground mb-2">{formatDate(entry.date)}</p>
                <div className="space-y-1">
                  {entry.sets.map((set, j) => (
                    <div key={j} className="flex gap-4 text-sm">
                      <span className="text-muted-foreground w-8">#{set.set_number}</span>
                      <span>{set.weight}kg x {set.reps}</span>
                      {set.rpe != null && <span className="text-muted-foreground">RPE {set.rpe}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
