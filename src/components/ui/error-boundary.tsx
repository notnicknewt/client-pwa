import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from './card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  resetKey: number
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, resetKey: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      resetKey: prev.resetKey + 1,
    }))
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Something went wrong</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
              </div>
              <button
                onClick={this.reset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>
  }
}
