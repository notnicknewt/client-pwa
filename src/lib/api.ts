const API_BASE = import.meta.env.VITE_API_URL || ''

class AuthError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'AuthError'
  }
}

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export async function apiFetch<T>(
  endpoint: string,
  opts?: { method?: string; body?: unknown },
): Promise<T> {
  const token = localStorage.getItem('client_jwt')
  if (!token) throw new AuthError()

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (opts?.body) headers['Content-Type'] = 'application/json'

  const method = opts?.method || 'GET'

  if (!navigator.onLine && MUTATION_METHODS.includes(method)) {
    queueMutation(endpoint, method, opts?.body ?? null)
    return {} as T
  }

  const res = await fetch(`${API_BASE}/api/client${endpoint}`, {
    method,
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('client_jwt')
    window.location.href = '/auth'
    throw new AuthError()
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text.slice(0, 800)}`)
  }

  // Handle empty responses (204 No Content, or empty body)
  if (res.status === 204) return {} as T
  const text = await res.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const token = localStorage.getItem('client_jwt')
  if (!token) throw new AuthError()

  const res = await fetch(`${API_BASE}/api/client${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
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

// --- Offline mutation queue ---

const PENDING_KEY = 'pending_mutations'

interface PendingMutation {
  endpoint: string
  method: string
  body: unknown
  timestamp: number
}

export function queueMutation(endpoint: string, method: string, body: unknown) {
  try {
    const pending: PendingMutation[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
    pending.push({ endpoint, method, body, timestamp: Date.now() })
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    // localStorage full or unavailable - mutation will be lost
    console.error('Failed to queue offline mutation: storage unavailable')
  }
}

let isDraining = false

export async function processPendingMutations() {
  if (isDraining) return
  isDraining = true
  try {
    const pending: PendingMutation[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
    if (!pending.length) return
    // Clear the queue immediately so re-queued items from offline detection
    // during drain don't get overwritten
    localStorage.setItem(PENDING_KEY, '[]')
    const failed: PendingMutation[] = []
    for (const mut of pending) {
      if (!navigator.onLine) {
        // Gone offline mid-drain, keep remaining items
        failed.push(mut)
        continue
      }
      try {
        const token = localStorage.getItem('client_jwt')
        if (!token) break
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
        if (mut.body) headers['Content-Type'] = 'application/json'
        const res = await fetch(`${API_BASE}/api/client${mut.endpoint}`, {
          method: mut.method,
          headers,
          body: mut.body ? JSON.stringify(mut.body) : undefined,
        })
        if (!res.ok && res.status !== 401) {
          failed.push(mut)
        }
      } catch {
        failed.push(mut)
      }
    }
    // Merge with any mutations that were queued during drain
    const queuedDuringDrain: PendingMutation[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
    localStorage.setItem(PENDING_KEY, JSON.stringify([...failed, ...queuedDuringDrain]))
  } finally {
    isDraining = false
  }
}

export function getPendingMutationCount(): number {
  try {
    const pending: PendingMutation[] = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
    return pending.length
  } catch {
    return 0
  }
}
