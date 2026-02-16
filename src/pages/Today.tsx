import { useToday } from '@/hooks/use-today'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dumbbell, UtensilsCrossed, MessageSquare } from 'lucide-react'

export default function Today() {
  const { data, isLoading, error } = useToday()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load today's data</p>
        <p className="text-sm mt-1">Pull down to refresh</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Training Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Dumbbell className="h-5 w-5 text-primary" />
            Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.training.available ? (
            <div>
              {data.training.is_training_day ? (
                <div>
                  <p className="font-medium">{data.training.workout_name || 'Workout'}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.training.exercise_count} exercises
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Rest Day</Badge>
                  <span className="text-sm text-muted-foreground">Recover and recharge</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Training plan not connected</p>
          )}
        </CardContent>
      </Card>

      {/* Nutrition Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.nutrition.available ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={data.nutrition.day_type === 'HIGH' ? 'default' : 'secondary'}>
                  {data.nutrition.day_type || 'Standard'}
                </Badge>
                {data.nutrition.total_calories && (
                  <span className="text-sm text-muted-foreground">
                    {data.nutrition.total_calories} kcal
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MacroBar label="Protein" value={data.nutrition.total_protein} unit="g" color="bg-blue-500" />
                <MacroBar label="Carbs" value={data.nutrition.total_carbs} unit="g" color="bg-amber-500" />
                <MacroBar label="Fat" value={data.nutrition.total_fat} unit="g" color="bg-pink-500" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nutrition plan not connected</p>
          )}
        </CardContent>
      </Card>

      {/* Check-in Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-primary" />
            Check-in
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.checkin.is_checkin_day ? (
            <div className="flex items-center gap-2">
              <Badge variant={data.checkin.status === 'completed' ? 'success' : 'warning'}>
                {data.checkin.status === 'completed' ? 'Completed' : 'Due Today'}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Next check-in: {new Date(data.checkin.next_checkin).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MacroBar({ label, value, unit, color }: { label: string; value?: number; unit: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`h-1.5 rounded-full ${color} mb-1.5`} />
      <p className="text-sm font-medium">{value ?? '-'}{unit}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
