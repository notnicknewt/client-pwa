import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Pencil, Undo2, X, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlannedExercise } from '@/lib/types'

interface CompletedSet {
  weight: number
  reps: number
  rpe: number | null
}

interface LastSessionExercise {
  name: string
  sets: { set_number: number; weight: number; reps: number; rpe: number | null }[]
}

interface ExerciseTrackerProps {
  exercise: PlannedExercise
  completedSets: CompletedSet[]
  lastSessionExercise: LastSessionExercise | null
  onLogSet: (set: CompletedSet) => void
  onEditSet: (setIdx: number, set: CompletedSet) => void
  onUndoLastSet: () => void
  onOpenHistory: (name: string) => void
}

function isPR(
  weight: number,
  reps: number,
  setIdx: number,
  lastExercise: LastSessionExercise | null,
): boolean {
  if (!lastExercise) return false
  const lastSet = lastExercise.sets.find((s) => s.set_number === setIdx + 1)
  if (!lastSet) return false
  return weight * reps > lastSet.weight * lastSet.reps
}

export function ExerciseTracker({
  exercise,
  completedSets: setsForExercise,
  lastSessionExercise: lastExercise,
  onLogSet,
  onEditSet,
  onUndoLastSet,
  onOpenHistory,
}: ExerciseTrackerProps) {
  const currentSetIdx = setsForExercise.length
  const allSetsForExerciseDone = setsForExercise.length >= exercise.sets

  // Input state
  const [weightInput, setWeightInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const [rpeInput, setRpeInput] = useState('')

  // Edit state
  const [editingSetIdx, setEditingSetIdx] = useState<number | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')
  const [editRpe, setEditRpe] = useState('')

  // Pre-fill inputs from last session
  useEffect(() => {
    if (lastExercise) {
      const lastSet = lastExercise.sets.find((s) => s.set_number === currentSetIdx + 1)
      if (lastSet) {
        setWeightInput(String(lastSet.weight))
        setRepsInput(String(lastSet.reps))
        setRpeInput(lastSet.rpe != null ? String(lastSet.rpe) : '')
        return
      }
    }
    setWeightInput('')
    setRepsInput('')
    setRpeInput('')
  }, [currentSetIdx, lastExercise])

  const logSet = useCallback(() => {
    const weight = parseFloat(weightInput)
    const reps = parseInt(repsInput, 10)
    if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) return
    const rpe = rpeInput ? parseFloat(rpeInput) : null
    onLogSet({ weight, reps, rpe })
  }, [weightInput, repsInput, rpeInput, onLogSet])

  const repsLabel = exercise.reps_max
    ? `${exercise.reps_min}-${exercise.reps_max}`
    : `${exercise.reps_min}`

  return (
    <>
      {/* Exercise info card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            {exercise.superset_group && (
              <span className="text-xs font-bold text-primary">
                {exercise.superset_group}
              </span>
            )}
            <button
              onClick={() => onOpenHistory(exercise.name)}
              className="text-base font-semibold text-left flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              {exercise.name}
              <History className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Sets: {exercise.sets} x {repsLabel} reps
            {exercise.rpe_target != null && ` @ RPE ${exercise.rpe_target}`}
          </p>
          {exercise.tempo && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tempo: {exercise.tempo}
            </p>
          )}
          {exercise.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">
              {exercise.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Set tracking card */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* Completed sets */}
          {setsForExercise.map((s, idx) => {
            const pr = isPR(s.weight, s.reps, idx, lastExercise)
            const isEditing = editingSetIdx === idx
            const isLastCompletedSet = idx === setsForExercise.length - 1

            if (isEditing) {
              return (
                <div key={idx} className="space-y-2 py-2 px-3 rounded-lg bg-muted/50 border border-primary/40">
                  <span className="text-sm font-medium">Edit Set {idx + 1}</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="w-full h-10 rounded-lg bg-muted text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                      placeholder="kg"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editReps}
                      onChange={(e) => setEditReps(e.target.value)}
                      className="w-full h-10 rounded-lg bg-muted text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                      placeholder="reps"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editRpe}
                      onChange={(e) => setEditRpe(e.target.value)}
                      min={1}
                      max={10}
                      className="w-full h-10 rounded-lg bg-muted text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                      placeholder="RPE"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingSetIdx(null)}
                      className="p-1.5 rounded-lg bg-muted"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        const w = parseFloat(editWeight)
                        const r = parseInt(editReps, 10)
                        if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return
                        const rpe = editRpe ? parseFloat(editRpe) : null
                        onEditSet(idx, { weight: w, reps: r, rpe })
                        setEditingSetIdx(null)
                      }}
                      className="p-1.5 rounded-lg bg-primary"
                    >
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={idx}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50"
              >
                <Check className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-sm font-medium min-w-[4ch]">
                  Set {idx + 1}
                </span>
                <span className="text-sm text-muted-foreground">
                  {s.weight}kg x {s.reps}
                  {s.rpe != null && ` @ ${s.rpe}`}
                </span>
                {pr && <Badge variant="warning" className="text-[10px] px-1.5 py-0">PR!</Badge>}
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingSetIdx(idx)
                      setEditWeight(String(s.weight))
                      setEditReps(String(s.reps))
                      setEditRpe(s.rpe != null ? String(s.rpe) : '')
                    }}
                    className="p-1 rounded"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  {isLastCompletedSet && (
                    <button
                      onClick={onUndoLastSet}
                      className="p-1 rounded"
                    >
                      <Undo2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Current set input (only if sets remain) */}
          {!allSetsForExerciseDone && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Set {currentSetIdx + 1} of {exercise.sets}
              </p>

              {/* Last session reference */}
              {lastExercise && (() => {
                const lastSet = lastExercise.sets.find(
                  (s) => s.set_number === currentSetIdx + 1,
                )
                return lastSet ? (
                  <p className="text-xs text-muted-foreground">
                    Last: {lastSet.weight}kg x {lastSet.reps}
                    {lastSet.rpe != null && ` @ RPE ${lastSet.rpe}`}
                  </p>
                ) : null
              })()}

              {/* Input row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full h-12 rounded-lg bg-muted text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Reps
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={repsInput}
                    onChange={(e) => setRepsInput(e.target.value)}
                    className="w-full h-12 rounded-lg bg-muted text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    RPE
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={rpeInput}
                    onChange={(e) => setRpeInput(e.target.value)}
                    min={1}
                    max={10}
                    className="w-full h-12 rounded-lg bg-muted text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-primary"
                    placeholder="-"
                  />
                </div>
              </div>

              {/* PR preview */}
              {(() => {
                const w = parseFloat(weightInput)
                const r = parseInt(repsInput, 10)
                if (!isNaN(w) && !isNaN(r) && w > 0 && r > 0) {
                  if (isPR(w, r, currentSetIdx, lastExercise)) {
                    return (
                      <div className="text-center">
                        <Badge variant="warning" className="text-xs">
                          PR! Beat your last session
                        </Badge>
                      </div>
                    )
                  }
                }
                return null
              })()}

              {/* Log set button */}
              <button
                onClick={logSet}
                disabled={
                  !weightInput ||
                  !repsInput ||
                  parseFloat(weightInput) <= 0 ||
                  parseInt(repsInput, 10) <= 0
                }
                className={cn(
                  'w-full py-3.5 rounded-lg text-sm font-semibold transition-colors',
                  'bg-primary text-primary-foreground',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                Log Set
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
