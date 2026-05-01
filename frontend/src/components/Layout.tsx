import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="nav-links">
          <NavLink to="/saisie">Saisie</NavLink>
          <NavLink to="/export">Export</NavLink>
          <NavLink to="/historique">Historique</NavLink>
          <NavLink to="/catalogue">Catalogue</NavLink>
          {isAdmin && (
            <>
              <NavLink to="/admin/tenants">Tenants</NavLink>
              <NavLink to="/admin/utilisateurs">Utilisateurs</NavLink>
              <NavLink to="/admin/import">Import</NavLink>
            </>
          )}
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Déconnexion ({user?.email})
        </button>
      </nav>
      <main className="app-main">{children}</main>
    </div>
  )
}
