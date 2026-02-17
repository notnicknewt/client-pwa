import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ExercisePillBarProps {
  exercises: { name: string; sets: number }[]
  currentIndex: number
  completedSets: Map<number, { weight: number; reps: number; rpe: number | null }[]>
  onSelect: (index: number) => void
}

export function ExercisePillBar({ exercises, currentIndex, completedSets, onSelect }: ExercisePillBarProps) {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentIndex])

  return (
    <div className="flex gap-1.5 overflow-x-auto py-1 -mx-1 px-1">
      {exercises.map((ex, idx) => {
        const sets = completedSets.get(idx) ?? []
        const done = sets.length >= ex.sets
        const partial = sets.length > 0 && !done
        const isCurrent = idx === currentIndex

        return (
          <button
            key={idx}
            ref={isCurrent ? activeRef : undefined}
            onClick={() => onSelect(idx)}
            className={cn(
              'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1',
              isCurrent && 'bg-primary text-primary-foreground',
              !isCurrent && done && 'bg-green-900/40 text-green-400',
              !isCurrent && partial && 'bg-yellow-900/30 text-yellow-400',
              !isCurrent && !done && !partial && 'bg-muted text-muted-foreground',
            )}
          >
            <span className="truncate max-w-[14ch]">{ex.name}</span>
            <span className="opacity-70 tabular-nums">{sets.length}/{ex.sets}</span>
          </button>
        )
      })}
    </div>
  )
}
