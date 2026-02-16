import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { exchangeToken } from '@/lib/api'
import { LoginScreen } from './LoginScreen'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [exchanging, setExchanging] = useState(false)
  const [exchanged, setExchanged] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token && !exchanging && !exchanged) {
      setExchanging(true)
      exchangeToken(token)
        .then((data) => {
          login(data.jwt)
          setExchanged(true)
          setExchanging(false)
          // Clear token from URL before navigating
          navigate('/', { replace: true })
        })
        .catch((err) => {
          setError(err.message || 'Authentication failed')
          setExchanging(false)
          setExchanged(true)
          // Clear token from URL on error to prevent reuse attempts
          navigate('/auth', { replace: true })
        })
    }
  }, [token, exchanging, exchanged, login, navigate])

  if (exchanging) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    )
  }

  if (location.pathname === '/auth' && !token) {
    return <LoginScreen error="No authentication token provided" />
  }

  if (!isAuthenticated) {
    return <LoginScreen error={error} />
  }

  return <>{children}</>
}
