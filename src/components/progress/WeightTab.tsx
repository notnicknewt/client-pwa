import { useState } from 'react'
import { useWeight, useLogWeight } from '@/hooks/use-weight'
import { useCompliance } from '@/hooks/use-compliance'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, TrendingDown, Scale, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'

const COMPLIANCE_BARS: { key: string; label: string }[] = [
  { key: 'training', label: 'Training' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'official_checkin', label: 'Official Check-in' },
  { key: 'touchpoints', label: 'Touchpoints' },
]

export default function WeightTab() {
  const { data: weight, isLoading: weightLoading, error: weightError } = useWeight()
  const { data: compliance, isLoading: complianceLoading, error: complianceError } = useCompliance()
  const logWeight = useLogWeight()

  const [showWeightLog, setShowWeightLog] = useState(false)
  const [weightInput, setWeightInput] = useState('')

  const handleWeightSubmit = () => {
    const value = parseFloat(weightInput)
    if (isNaN(value) || value <= 0 || value > 700) return
    logWeight.mutate(
      {
        date: new Date().toISOString().split('T')[0],
        weight: value,
        unit: weight?.unit || 'kg',
        source: 'pwa',
      },
      {
        onSuccess: () => {
          setShowWeightLog(false)
          setWeightInput('')
        },
      },
    )
  }

  if (weightError || complianceError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load progress data</p>
        <p className="text-sm mt-1">Pull down to refresh</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Streak Counter */}
      {complianceLoading ? (
        <Skeleton className="h-24" />
      ) : compliance && (
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-4xl font-bold">{compliance.streak.current}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              week streak {compliance.streak.longest > compliance.streak.current && `(best: ${compliance.streak.longest})`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Log Weight Card */}
      <Card>
        <button
          className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => setShowWeightLog(v => !v)}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Scale className="h-4 w-4" />
            Log Weight
          </div>
          {showWeightLog ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showWeightLog && (
          <CardContent className="pt-0 pb-4">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="Weight"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">{weight?.unit || 'kg'}</span>
              <button
                onClick={handleWeightSubmit}
                disabled={logWeight.isPending || !weightInput}
                className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {logWeight.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Weight Chart */}
      {weightLoading ? (
        <Skeleton className="h-64" />
      ) : weight && weight.entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4" />
              Weight Trend
            </CardTitle>
            <div className="flex gap-4 text-sm">
              <span>Current: <strong>{weight.current_weight}{weight.unit}</strong></span>
              {weight.total_change !== null && (
                <span className={weight.total_change < 0 ? 'text-green-400' : 'text-red-400'}>
                  {weight.total_change > 0 ? '+' : ''}{weight.total_change}{weight.unit}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={(() => {
                const entryMap = new Map(weight.entries.map(e => [e.date, e.weight]))
                return weight.rolling_average.map((ra) => ({
                  date: new Date(ra.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                  avg: ra.avg,
                  weight: entryMap.get(ra.date),
                }))
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} unit={weight.unit} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 9%)',
                    border: '1px solid hsl(217, 33%, 17%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                {weight.goal_weight && (
                  <ReferenceLine y={weight.goal_weight} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" label={{ value: 'Goal', fill: 'hsl(142, 76%, 36%)', fontSize: 10 }} />
                )}
                <Line type="monotone" dataKey="weight" stroke="hsl(215, 20%, 55%)" strokeWidth={1} dot={{ r: 2, fill: 'hsl(215, 20%, 55%)' }} />
                <Line type="monotone" dataKey="avg" stroke="hsl(142, 76%, 36%)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {!weightLoading && weight && weight.entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No weight entries yet</p>
          <p className="text-xs mt-1">Log your first weight above to start tracking</p>
        </div>
      )}

      {/* Compliance Heatmap */}
      {complianceLoading ? (
        <Skeleton className="h-48" />
      ) : compliance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {compliance.heatmap.slice(-56).map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    'aspect-square rounded-sm',
                    day.level === 0 && 'bg-muted',
                    day.level === 1 && 'bg-primary/30',
                    day.level === 2 && 'bg-primary/60',
                    day.level === 3 && 'bg-primary',
                  )}
                  title={day.date}
                />
              ))}
            </div>

            {/* This Week Bars */}
            <div className="mt-4 space-y-2">
              {COMPLIANCE_BARS.map(({ key, label }) => {
                const item = (compliance.this_week as Record<string, { completed: number; target: number }>)[key]
                if (!item) return null
                const pct = item.target > 0 ? Math.min(100, (item.completed / item.target) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{label}</span>
                      <span>{item.completed}/{item.target}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
