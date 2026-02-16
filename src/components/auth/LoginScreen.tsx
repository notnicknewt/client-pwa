export function LoginScreen({ error }: { error?: string | null }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">NN</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Nick Newton Coaching</h1>
        <p className="text-muted-foreground mb-6">
          Tap the link your coach sent you to access your dashboard.
        </p>
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
