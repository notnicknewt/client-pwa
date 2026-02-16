const API_BASE = import.meta.env.VITE_API_URL || ''

class AuthError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'AuthError'
  }
}

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const token = localStorage.getItem('client_jwt')
  if (!token) throw new AuthError()

  const res = await fetch(`${API_BASE}/api/client${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) {
    localStorage.removeItem('client_jwt')
    window.location.href = '/auth'
    throw new AuthError()
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  return res.json()
}

export async function exchangeToken(token: string): Promise<{ jwt: string; expires_at: string; profile: { first_name: string } }> {
  const res = await fetch(`${API_BASE}/api/client/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })

  if (!res.ok) {
    throw new Error('Invalid or expired link')
  }

  return res.json()
}
