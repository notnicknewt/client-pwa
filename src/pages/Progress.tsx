import { useWeight } from '@/hooks/use-weight'
import { useCompliance } from '@/hooks/use-compliance'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, TrendingDown } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'

export default function Progress() {
  const { data: weight, isLoading: weightLoading, error: weightError } = useWeight()
  const { data: compliance, isLoading: complianceLoading, error: complianceError } = useCompliance()

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
              <LineChart data={weight.rolling_average.map((ra, i) => ({
                date: new Date(ra.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                avg: ra.avg,
                weight: weight.entries[i]?.weight,
              }))}>
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

      {/* Compliance Heatmap */}
      {!complianceLoading && compliance && (
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
              {(['training', 'nutrition', 'checkin'] as const).map((key) => {
                const item = compliance.this_week[key]
                const pct = item.target > 0 ? Math.min(100, (item.completed / item.target) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="capitalize">{key === 'checkin' ? 'Check-in' : key}</span>
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
