import { useState } from 'react'
import { useTopExercises, useStrengthProgression, useVolumeProgression } from '@/hooks/use-analytics'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, BarChart3 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { cn } from '@/lib/utils'

export default function StrengthTab() {
  const { data: topExercises, isLoading: topLoading, error: topError } = useTopExercises()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: strengthData, isLoading: strengthLoading } = useStrengthProgression(selectedId)
  const { data: volumeData, isLoading: volumeLoading } = useVolumeProgression(selectedId)

  if (topLoading) {
    return <Skeleton className="h-64" />
  }

  if (topError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load analytics</p>
        <p className="text-sm mt-1">Pull down to refresh</p>
      </div>
    )
  }

  const exercises = topExercises?.exercises || []

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No workout data yet</p>
        <p className="text-xs mt-1">Log some workouts to see your strength analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Exercise pill bar */}
      <div className="flex gap-1.5 overflow-x-auto py-1 -mx-1 px-1">
        {exercises.map((ex) => (
          <button
            key={ex.exercise_id}
            onClick={() => setSelectedId(ex.exercise_id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              selectedId === ex.exercise_id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {ex.name}
          </button>
        ))}
      </div>

      {!selectedId && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Select an exercise above to view analytics</p>
        </div>
      )}

      {/* Strength Progression (e1RM) */}
      {selectedId && (
        strengthLoading ? (
          <Skeleton className="h-64" />
        ) : strengthData && strengthData.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Est. 1RM — {strengthData.exercise_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={strengthData.data.map(d => ({
                  date: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                  e1rm: d.e1rm,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} unit="kg" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 9%)',
                      border: '1px solid hsl(217, 33%, 17%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="e1rm" stroke="hsl(142, 76%, 36%)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      )}

      {/* Volume Progression */}
      {selectedId && (
        volumeLoading ? (
          <Skeleton className="h-64" />
        ) : volumeData && volumeData.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Weekly Volume — {volumeData.exercise_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={volumeData.data.map(d => ({
                  week: new Date(d.week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                  volume: d.volume,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 9%)',
                      border: '1px solid hsl(217, 33%, 17%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="volume" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
