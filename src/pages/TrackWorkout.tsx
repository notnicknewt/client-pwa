import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutSession, useSubmitWorkout } from '@/hooks/use-workout-tracking'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dumbbell, Check, Clock, SkipForward, ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkoutSessionData } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types for local state
// ---------------------------------------------------------------------------

interface CompletedSet {
  weight: number
  reps: number
  rpe: number | null
}

interface LastSessionExercise {
  name: string
  sets: { set_number: number; weight: number; reps: number; rpe: number | null }[]
}

type Phase = 'loading' | 'active' | 'resting' | 'complete'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function todayDateString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function matchLastSession(
  exerciseName: string,
  lastSession: WorkoutSessionData['last_session'],
): LastSessionExercise | null {
  if (!lastSession?.available || !lastSession.exercises) return null
  const lower = exerciseName.toLowerCase()
  return (
    lastSession.exercises.find(
      (ex) => ex.name.toLowerCase() === lower,
    ) ?? null
  )
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

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function TrackWorkout() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useWorkoutSession()
  const submitMutation = useSubmitWorkout()

  // Core tracking state
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)
  const [currentSetIdx, setCurrentSetIdx] = useState(0)
  const [completedSets, setCompletedSets] = useState<Map<number, CompletedSet[]>>(new Map())
  const [phase, setPhase] = useState<Phase>('loading')

  // Rest timer
  const [restTimerActive, setRestTimerActive] = useState(false)
  const [restTimeLeft, setRestTimeLeft] = useState(0)
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed timer
  const startTimeRef = useRef<Date>(new Date())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Input state for current set
  const [weightInput, setWeightInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const [rpeInput, setRpeInput] = useState('')

  // Initialize once data arrives
  useEffect(() => {
    if (data && phase === 'loading') {
      if (!data.available || !data.exercises?.length) return
      setPhase('active')
      startTimeRef.current = new Date()
    }
  }, [data, phase])

  // Elapsed timer effect
  useEffect(() => {
    if (phase === 'active' || phase === 'resting') {
      elapsedIntervalRef.current = setInterval(() => {
        setElapsedSeconds(
          Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000),
        )
      }, 1000)
    }
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
    }
  }, [phase])

  // Rest timer countdown
  useEffect(() => {
    if (restTimerActive && restTimeLeft > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            setRestTimerActive(false)
            setPhase('active')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
  }, [restTimerActive, restTimeLeft])

  // Pre-fill inputs from last session when exercise or set changes
  useEffect(() => {
    if (!data) return
    const exercise = data.exercises[currentExerciseIdx]
    if (!exercise) return
    const last = matchLastSession(exercise.name, data.last_session)
    if (last) {
      const lastSet = last.sets.find((s) => s.set_number === currentSetIdx + 1)
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
  }, [currentExerciseIdx, currentSetIdx, data])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const exercises = data?.exercises ?? []
  const currentExercise = exercises[currentExerciseIdx]
  const totalExercises = exercises.length
  const setsForExercise = completedSets.get(currentExerciseIdx) ?? []
  const allSetsForExerciseDone = currentExercise
    ? setsForExercise.length >= currentExercise.sets
    : false
  const isLastExercise = currentExerciseIdx === totalExercises - 1
  const lastExercise = currentExercise
    ? matchLastSession(currentExercise.name, data?.last_session ?? null)
    : null

  const logSet = useCallback(() => {
    const weight = parseFloat(weightInput)
    const reps = parseInt(repsInput, 10)
    if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) return
    const rpe = rpeInput ? parseFloat(rpeInput) : null

    const newSet: CompletedSet = { weight, reps, rpe }
    setCompletedSets((prev) => {
      const next = new Map(prev)
      const existing = next.get(currentExerciseIdx) ?? []
      next.set(currentExerciseIdx, [...existing, newSet])
      return next
    })

    const isLastSet = currentExercise
      ? setsForExercise.length + 1 >= currentExercise.sets
      : false

    if (!isLastSet && currentExercise) {
      // Start rest timer
      setCurrentSetIdx(setsForExercise.length + 1)
      setRestTimeLeft(currentExercise.rest_seconds)
      setRestTimerActive(true)
      setPhase('resting')
    } else {
      // All sets done for this exercise
      setCurrentSetIdx(setsForExercise.length + 1)
      setPhase('active')
    }
  }, [weightInput, repsInput, rpeInput, currentExerciseIdx, currentExercise, setsForExercise])

  const skipRest = useCallback(() => {
    setRestTimerActive(false)
    setRestTimeLeft(0)
    if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    setPhase('active')
  }, [])

  const nextExercise = useCallback(() => {
    if (currentExerciseIdx < totalExercises - 1) {
      setCurrentExerciseIdx((prev) => prev + 1)
      setCurrentSetIdx(0)
      setPhase('active')
    }
  }, [currentExerciseIdx, totalExercises])

  const skipExercise = useCallback(() => {
    if (restTimerActive) {
      setRestTimerActive(false)
      setRestTimeLeft(0)
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
    nextExercise()
  }, [nextExercise, restTimerActive])

  const finishWorkout = useCallback(() => {
    if (!data) return

    const durationMinutes = Math.round(
      (Date.now() - startTimeRef.current.getTime()) / 60000,
    )

    // Build the payload
    const exercisePayloads = exercises.map((_ex, idx) => {
      const sets = (completedSets.get(idx) ?? []).map((s, sIdx) => ({
        set_number: sIdx + 1,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
      }))
      return {
        planned_exercise_id: '',
        exercise_id: '',
        sets,
      }
    }).filter((e) => e.sets.length > 0)

    // Determine if all exercises had all sets completed
    const completedFully = exercises.every(
      (ex, idx) => (completedSets.get(idx) ?? []).length >= ex.sets,
    )

    submitMutation.mutate(
      {
        day_plan_id: data.day_plan_id,
        date: todayDateString(),
        completed_fully: completedFully,
        duration_minutes: durationMinutes,
        source: 'pwa',
        exercises: exercisePayloads,
      },
      {
        onSuccess: () => {
          setPhase('complete')
        },
      },
    )
  }, [data, exercises, completedSets, submitMutation])

  // Auto-navigate after completion
  useEffect(() => {
    if (phase === 'complete') {
      const timer = setTimeout(() => navigate('/'), 3000)
      return () => clearTimeout(timer)
    }
  }, [phase, navigate])

  // ---------------------------------------------------------------------------
  // Render: Loading
  // ---------------------------------------------------------------------------

  if (isLoading || phase === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-40" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Error
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load workout session</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-primary underline text-sm"
        >
          Go back
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: No workout available
  // ---------------------------------------------------------------------------

  if (!data?.available || !data.exercises?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No workout available today</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-primary underline text-sm"
        >
          Go back
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Complete
  // ---------------------------------------------------------------------------

  if (phase === 'complete') {
    const totalSets = Array.from(completedSets.values()).reduce(
      (acc, sets) => acc + sets.length,
      0,
    )
    const totalExDone = Array.from(completedSets.entries()).filter(
      ([, sets]) => sets.length > 0,
    ).length
    const duration = Math.round(
      (Date.now() - startTimeRef.current.getTime()) / 60000,
    )

    return (
      <div
        className="flex flex-col items-center justify-center py-16"
        onClick={() => navigate('/')}
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

  // ---------------------------------------------------------------------------
  // Render: Active workout
  // ---------------------------------------------------------------------------

  const repsLabel = currentExercise.reps_max
    ? `${currentExercise.reps_min}-${currentExercise.reps_max}`
    : `${currentExercise.reps_min}`

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{data.workout_name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>
        </div>
        <Badge variant="secondary">
          {currentExerciseIdx + 1}/{totalExercises} exercises
        </Badge>
      </div>

      {/* Current exercise name */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-1">
            {currentExercise.superset_group && (
              <span className="text-xs font-bold text-primary">
                {currentExercise.superset_group}
              </span>
            )}
            <h2 className="text-base font-semibold">{currentExercise.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Sets: {currentExercise.sets} x {repsLabel} reps
            {currentExercise.rpe_target != null && ` @ RPE ${currentExercise.rpe_target}`}
          </p>
          {currentExercise.tempo && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Tempo: {currentExercise.tempo}
            </p>
          )}
          {currentExercise.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">
              {currentExercise.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rest timer overlay */}
      {phase === 'resting' && (
        <Card className="border-primary/50">
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
              Rest
            </p>
            <p className="text-5xl font-bold tabular-nums mb-4">
              {formatElapsed(restTimeLeft)}
            </p>
            <button
              onClick={skipRest}
              className="px-6 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
            >
              Skip Rest
            </button>
          </CardContent>
        </Card>
      )}

      {/* Set inputs */}
      {phase === 'active' && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Completed sets */}
            {setsForExercise.map((s, idx) => {
              const pr = isPR(s.weight, s.reps, idx, lastExercise)
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
                  {pr && <Badge variant="warning" className="ml-auto text-[10px] px-1.5 py-0">PR!</Badge>}
                </div>
              )
            })}

            {/* Current set input (only if sets remain) */}
            {!allSetsForExerciseDone && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Set {currentSetIdx + 1} of {currentExercise.sets}
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
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        {!allSetsForExerciseDone && !isLastExercise && phase === 'active' && (
          <button
            onClick={skipExercise}
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip Exercise
          </button>
        )}

        {allSetsForExerciseDone && !isLastExercise && phase === 'active' && (
          <>
            <button
              onClick={skipExercise}
              className="flex items-center gap-1 text-sm text-muted-foreground"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </button>
            <button
              onClick={nextExercise}
              className={cn(
                'flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold',
                'bg-primary text-primary-foreground',
              )}
            >
              Next Exercise
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {allSetsForExerciseDone && isLastExercise && phase === 'active' && (
          <button
            onClick={finishWorkout}
            disabled={submitMutation.isPending}
            className={cn(
              'w-full py-3.5 rounded-lg text-sm font-semibold transition-colors',
              'bg-green-600 text-white',
              'disabled:opacity-60',
            )}
          >
            {submitMutation.isPending ? 'Saving...' : 'Finish Workout'}
          </button>
        )}
      </div>

      {/* End early button (always available when not on last exercise with all sets done) */}
      {!(allSetsForExerciseDone && isLastExercise) && phase !== 'resting' && (
        <div className="text-center pt-2">
          <button
            onClick={finishWorkout}
            disabled={submitMutation.isPending}
            className="text-sm text-muted-foreground underline"
          >
            {submitMutation.isPending ? 'Saving...' : 'End Early'}
          </button>
        </div>
      )}

      {/* Back button */}
      <div className="text-center">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-xs text-muted-foreground mx-auto"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
