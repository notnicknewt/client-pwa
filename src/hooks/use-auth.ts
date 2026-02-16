import { useState, useCallback } from 'react'
import { isAuthenticated, setToken, clearToken } from '@/lib/auth'

export function useAuth() {
  const [authed, setAuthed] = useState(isAuthenticated())

  const login = useCallback((jwt: string) => {
    setToken(jwt)
    setAuthed(true)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setAuthed(false)
  }, [])

  return { isAuthenticated: authed, login, logout }
}
