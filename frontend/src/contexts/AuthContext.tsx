import { createContext, useContext, useState, ReactNode } from 'react'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadFromStorage(): AuthState {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  if (!token || !userStr) return { user: null, token: null }
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { user: null, token: null }
    }
    return { token, user: JSON.parse(userStr) }
  } catch {
    return { user: null, token: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage)

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setState({ token, user })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setState({ token: null, user: null })
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAuthenticated: !!state.token,
        isAdmin: state.user?.isSuperAdmin ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
