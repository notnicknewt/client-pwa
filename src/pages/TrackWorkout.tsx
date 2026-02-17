import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutSession, useSubmitWorkout } from '@/hooks/use-workout-tracking'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dumbbell, Check, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSwipeNavigation } from '@/hooks/use-swipe-navigation'
import { ExercisePillBar } from '@/components/workout/ExercisePillBar'
import { ExerciseTracker } from '@/components/workout/ExerciseTracker'
import { RestTimerOverlay } from '@/components/workout/RestTimerOverlay'
import { WorkoutComplete } from '@/components/workout/WorkoutComplete'
import { ExerciseHistoryModal } from '@/components/workout/ExerciseHistoryModal'
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

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}

function playTimerEndSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
    osc.onended = () => ctx.close()
  } catch {}
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
  const [completedSets, setCompletedSets] = useState<Map<number, CompletedSet[]>>(new Map())
  const [phase, setPhase] = useState<Phase>('loading')

  // Navigation direction for slide animation
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

  // Rest timer
  const [restTimerActive, setRestTimerActive] = useState(false)
  const [restTimeLeft, setRestTimeLeft] = useState(0)
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed timer
  const startTimeRef = useRef<Date>(new Date())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Exercise history modal
  const [historyExercise, setHistoryExercise] = useState<string | null>(null)

  const exercises = data?.exercises ?? []
  const totalExercises = exercises.length
  const currentExercise = exercises[currentExerciseIdx]
  const setsForExercise = completedSets.get(currentExerciseIdx) ?? []

  const lastExercise = currentExercise
    ? matchLastSession(currentExercise.name, data?.last_session ?? null)
    : null

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const cancelRestTimer = useCallback(() => {
    setRestTimerActive(false)
    setRestTimeLeft(0)
    if (restIntervalRef.current) clearInterval(restIntervalRef.current)
  }, [])

  const goToExercise = useCallback((index: number) => {
    if (index < 0 || index >= totalExercises) return
    setSlideDirection(index > currentExerciseIdx ? 'right' : 'left')
    if (restTimerActive) cancelRestTimer()
    setCurrentExerciseIdx(index)
    setPhase('active')
  }, [totalExercises, currentExerciseIdx, restTimerActive, cancelRestTimer])

  // Swipe integration
  const { containerRef: swipeRef, swipeOffset, isSwiping } = useSwipeNavigation({
    onSwipeLeft: () => goToExercise(currentExerciseIdx + 1),
    onSwipeRight: () => goToExercise(currentExerciseIdx - 1),
    enabled: phase === 'active' && !historyExercise,
  })

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Initialize once data arrives
  useEffect(() => {
    if (data && phase === 'loading') {
      if (!data.available || !data.exercises?.length) return
      setPhase('active')
      startTimeRef.current = new Date()
    }
  }, [data, phase])

  // Elapsed timer
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
    if (!restTimerActive) return
    restIntervalRef.current = setInterval(() => {
      setRestTimeLeft((prev) => {
        if (prev <= 1) {
          setRestTimerActive(false)
          setPhase('active')
          playTimerEndSound()
          vibrate([200, 100, 200])
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
  }, [restTimerActive])

  // Auto-navigate after completion + haptic celebration
  useEffect(() => {
    if (phase === 'complete') {
      vibrate([200, 100, 200, 100, 200])
      const timer = setTimeout(() => navigate('/'), 3000)
      return () => clearTimeout(timer)
    }
  }, [phase, navigate])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const logSet = useCallback((newSet: CompletedSet) => {
    setCompletedSets((prev) => {
      const next = new Map(prev)
      const existing = next.get(currentExerciseIdx) ?? []
      next.set(currentExerciseIdx, [...existing, newSet])
      return next
    })

    if (isPR(newSet.weight, newSet.reps, setsForExercise.length, lastExercise)) {
      vibrate([100, 50, 100])
    } else {
      vibrate(50)
    }

    const isLastSet = currentExercise
      ? setsForExercise.length + 1 >= currentExercise.sets
      : false

    if (!isLastSet && currentExercise) {
      setRestTimeLeft(currentExercise.rest_seconds)
      setRestTimerActive(true)
      setPhase('resting')
    } else {
      setPhase('active')
    }
  }, [currentExerciseIdx, currentExercise, setsForExercise, lastExercise])

  const editSet = useCallback((setIdx: number, updatedSet: CompletedSet) => {
    setCompletedSets((prev) => {
      const next = new Map(prev)
      const existing = [...(next.get(currentExerciseIdx) ?? [])]
      existing[setIdx] = updatedSet
      next.set(currentExerciseIdx, existing)
      return next
    })
  }, [currentExerciseIdx])

  const undoLastSet = useCallback(() => {
    setCompletedSets((prev) => {
      const next = new Map(prev)
      const existing = [...(next.get(currentExerciseIdx) ?? [])]
      existing.pop()
      next.set(currentExerciseIdx, existing)
      return next
    })
  }, [currentExerciseIdx])

  const skipRest = useCallback(() => {
    cancelRestTimer()
    setPhase('active')
  }, [cancelRestTimer])

  const finishWorkout = useCallback(() => {
    if (!data) return

    // Check for incomplete exercises
    const incompleteCount = exercises.filter(
      (_ex, idx) => (completedSets.get(idx) ?? []).length === 0,
    ).length
    if (incompleteCount > 0) {
      if (!window.confirm(`${incompleteCount} exercise${incompleteCount > 1 ? 's have' : ' has'} no sets logged. Finish anyway?`)) {
        return
      }
    }

    const durationMinutes = Math.round(
      (Date.now() - startTimeRef.current.getTime()) / 60000,
    )

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
    return (
      <WorkoutComplete
        completedSets={completedSets}
        exercises={exercises}
        startTime={startTimeRef.current}
        onClose={() => navigate('/')}
      />
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Active workout
  // ---------------------------------------------------------------------------

  const isFirstExercise = currentExerciseIdx === 0
  const isLastExercise = currentExerciseIdx === totalExercises - 1
  const allDone = exercises.every(
    (ex, idx) => (completedSets.get(idx) ?? []).length >= ex.sets,
  )

  return (
    <div ref={swipeRef} className="space-y-4 pb-24">
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

      {/* Exercise pill bar */}
      <ExercisePillBar
        exercises={exercises}
        currentIndex={currentExerciseIdx}
        completedSets={completedSets}
        onSelect={goToExercise}
      />

      {/* Main content with swipe offset */}
      <div
        className={cn(
          slideDirection === 'right' && !isSwiping && 'animate-slide-right',
          slideDirection === 'left' && !isSwiping && 'animate-slide-left',
        )}
        style={isSwiping ? { transform: `translateX(${swipeOffset}px)`, transition: 'none' } : undefined}
        onAnimationEnd={() => setSlideDirection(null)}
      >
        {/* Rest timer */}
        {phase === 'resting' && (
          <div className="mb-4">
            <RestTimerOverlay restTimeLeft={restTimeLeft} onSkipRest={skipRest} />
          </div>
        )}

        {/* Exercise tracker */}
        <div className="space-y-4">
          <ExerciseTracker
            key={currentExerciseIdx}
            exercise={currentExercise}
            completedSets={setsForExercise}
            lastSessionExercise={lastExercise}
            onLogSet={logSet}
            onEditSet={editSet}
            onUndoLastSet={undoLastSet}
            onOpenHistory={setHistoryExercise}
          />
        </div>
      </div>

      {/* Navigation: [Prev] [Finish] [Next] */}
      <div className="flex items-center gap-3">
        {/* Prev button */}
        {!isFirstExercise ? (
          <button
            onClick={() => goToExercise(currentExerciseIdx - 1)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
        ) : (
          <div className="w-[72px]" />
        )}

        {/* Finish workout */}
        <button
          onClick={finishWorkout}
          disabled={submitMutation.isPending}
          className={cn(
            'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center',
            allDone
              ? 'bg-green-600 text-white'
              : 'bg-secondary text-secondary-foreground',
            'disabled:opacity-60',
          )}
        >
          {submitMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Check className="h-4 w-4 mr-1.5" />
          )}
          {submitMutation.isPending ? 'Saving...' : 'Finish Workout'}
        </button>

        {/* Next button */}
        {!isLastExercise ? (
          <button
            onClick={() => goToExercise(currentExerciseIdx + 1)}
            className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="w-[72px]" />
        )}
      </div>

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

      {/* Exercise history modal */}
      <ExerciseHistoryModal
        exerciseName={historyExercise}
        onClose={() => setHistoryExercise(null)}
      />
    </div>
  )
}
