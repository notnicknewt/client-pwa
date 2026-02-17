import { Card, CardContent } from '@/components/ui/card'

interface RestTimerOverlayProps {
  restTimeLeft: number
  onSkipRest: () => void
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function RestTimerOverlay({ restTimeLeft, onSkipRest }: RestTimerOverlayProps) {
  return (
    <Card className="border-primary/50">
      <CardContent className="pt-4 text-center">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
          Rest
        </p>
        <p className="text-5xl font-bold tabular-nums mb-4">
          {formatElapsed(restTimeLeft)}
        </p>
        <button
          onClick={onSkipRest}
          className="px-6 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
        >
          Skip Rest
        </button>
      </CardContent>
    </Card>
  )
}
