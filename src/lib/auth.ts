export function getToken(): string | null {
  return localStorage.getItem('client_jwt')
}

export function setToken(jwt: string): void {
  localStorage.setItem('client_jwt', jwt)
}

export function clearToken(): void {
  localStorage.removeItem('client_jwt')
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (!token) return false

  // Check JWT expiry (decode without verification — just for UX)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}
