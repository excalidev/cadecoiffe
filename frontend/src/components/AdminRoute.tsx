import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/saisie" replace />
  return <>{children}</>
}
