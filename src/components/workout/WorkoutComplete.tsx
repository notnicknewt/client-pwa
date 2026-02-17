import { Trophy } from 'lucide-react'

interface WorkoutCompleteProps {
  completedSets: Map<number, { weight: number; reps: number; rpe: number | null }[]>
  exercises: { name: string }[]
  startTime: Date
  onClose: () => void
}

export function WorkoutComplete({ completedSets, startTime, onClose }: WorkoutCompleteProps) {
  const totalSets = Array.from(completedSets.values()).reduce(
    (acc, sets) => acc + sets.length,
    0,
  )
  const totalExDone = Array.from(completedSets.entries()).filter(
    ([, sets]) => sets.length > 0,
  ).length
  const duration = Math.round(
    (Date.now() - startTime.getTime()) / 60000,
  )

  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      onClick={onClose}
    >
      <div className="rounded-full bg-green-900/30 p-4 mb-4">
        <Trophy className="h-10 w-10 text-green-400" />
      </div>
      <h2 className="text-xl font-bold mb-2">Workout Complete</h2>
      <div className="flex gap-6 text-sm text-muted-foreground mb-6">
        <span>{totalExDone} exercises</span>
        <span>{totalSets} sets</span>
        <span>{duration} min</span>
      </div>
      <p className="text-xs text-muted-foreground">Tap anywhere or wait to return</p>
    </div>
  )
}
