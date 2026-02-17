import { useState } from 'react'
import { useMeasurements, useLogMeasurement } from '@/hooks/use-measurements'
import type { MeasurementPayload } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Ruler, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

const MEASUREMENT_FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'left_arm', label: 'Left Arm' },
  { key: 'right_arm', label: 'Right Arm' },
  { key: 'left_thigh', label: 'Left Thigh' },
  { key: 'right_thigh', label: 'Right Thigh' },
  { key: 'left_calf', label: 'Left Calf' },
  { key: 'right_calf', label: 'Right Calf' },
  { key: 'neck', label: 'Neck' },
  { key: 'shoulders', label: 'Shoulders' },
] as const

const CHART_LINES = [
  { key: 'waist', color: 'hsl(0, 84%, 60%)' },
  { key: 'chest', color: 'hsl(142, 76%, 36%)' },
  { key: 'hips', color: 'hsl(217, 91%, 60%)' },
]

export default function BodyTab() {
  const { data, isLoading, error } = useMeasurements()
  const logMeasurement = useLogMeasurement()
  const [showForm, setShowForm] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    const payload: MeasurementPayload = {
      date: new Date().toISOString().split('T')[0],
    }
    let hasValue = false
    for (const f of MEASUREMENT_FIELDS) {
      const val = parseFloat(fields[f.key] || '')
      if (!isNaN(val) && val > 0 && val <= 300) {
        (payload as Record<string, unknown>)[f.key] = val
        hasValue = true
      }
    }
    if (!hasValue) return
    logMeasurement.mutate(payload, {
      onSuccess: () => {
        setShowForm(false)
        setFields({})
      },
    })
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load measurements</p>
        <p className="text-sm mt-1">Pull down to refresh</p>
      </div>
    )
  }

  const measurements = data?.measurements || []

  // Build chart data (chronological order)
  const chartData = [...measurements]
    .reverse()
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      waist: m.waist,
      chest: m.chest,
      hips: m.hips,
    }))

  return (
    <div className="space-y-4">
      {/* Log Measurement Card */}
      <Card>
        <button
          className="w-full flex items-center justify-between px-4 py-3"
          onClick={() => setShowForm(v => !v)}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Ruler className="h-4 w-4" />
            Log Measurement
          </div>
          {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showForm && (
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {MEASUREMENT_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-20 shrink-0">{f.label}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="cm"
                    value={fields[f.key] || ''}
                    onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="flex-1 bg-muted rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={logMeasurement.isPending}
              className="mt-3 w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            >
              {logMeasurement.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Measurements'}
            </button>
          </CardContent>
        )}
      </Card>

      {/* Trend Chart */}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Body Measurements Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} unit="cm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 9%)',
                    border: '1px solid hsl(217, 33%, 17%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {CHART_LINES.map((line) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    stroke={line.color}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {!isLoading && measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Measurements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {measurements.slice(0, 5).map((m) => (
              <div key={m.id} className="text-sm">
                <p className="font-medium text-muted-foreground mb-1">
                  {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                  {MEASUREMENT_FIELDS.map((f) => {
                    const val = m[f.key as keyof typeof m]
                    if (val == null) return null
                    return <span key={f.key}>{f.label}: {val}cm</span>
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && measurements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Ruler className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No measurements logged yet</p>
          <p className="text-xs mt-1">Tap above to add your first measurement</p>
        </div>
      )}
    </div>
  )
}
