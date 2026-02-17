import { useSummaries } from '@/hooks/use-summaries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { BarChart3 } from 'lucide-react'

export default function Summary() {
  const { data, isLoading, error } = useSummaries()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={BarChart3} title="Unable to load summaries" description="Pull down to refresh or try again later." />
  }

  if (!data) return null

  const { summaries, program_progress } = data

  if (summaries.length === 0) {
    return <EmptyState icon={BarChart3} title="No summaries yet" description="Weekly summaries will appear here as you progress through your program." />
  }

  return (
    <div className="space-y-4">
      {/* Program Progress Bar */}
      <div className="sticky top-0 z-10 bg-background py-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Programme Progress</span>
          <span>Week {program_progress.current_week} / {program_progress.total_weeks}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${program_progress.percent_complete}%` }}
          />
        </div>
      </div>

      {/* Week Cards */}
      {summaries.map((week) => (
        <Card key={week.week_number}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Week {week.week_number}</h3>
              <Badge variant={week.compliance_score >= 80 ? 'success' : week.compliance_score >= 50 ? 'warning' : 'destructive'}>
                {week.compliance_score}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatCell label="Training" value={`${week.training_sessions}/${week.training_target}`} />
              <StatCell
                label="Weight"
                value={week.weight_delta !== null ? `${week.weight_delta > 0 ? '+' : ''}${week.weight_delta}kg` : '-'}
                color={week.weight_delta !== null && week.weight_delta < 0 ? 'text-green-400' : undefined}
              />
              <StatCell
                label="Nutrition"
                value={week.nutrition_adherence !== null ? `${week.nutrition_adherence}%` : '-'}
              />
              <StatCell label="Compliance" value={`${week.compliance_score}%`} />
            </div>

            {week.highlights.length > 0 && (
              <div className="mt-3 border-t pt-2">
                {week.highlights.map((h, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{h}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium ${color || ''}`}>{value}</p>
    </div>
  )
}
