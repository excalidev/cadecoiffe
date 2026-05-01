import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold tracking-tight whitespace-nowrap">Ça décoiffe 💈</span>
              <div className="flex items-center gap-1">
                {[
                  { to: '/saisie', label: 'Saisie' },
                  { to: '/export', label: 'Export' },
                  { to: '/historique', label: 'Historique' },
                  { to: '/catalogue', label: 'Catalogue' },
                ].map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <>
                    <NavLink
                      to="/admin/tenants"
                      className={({ isActive }) =>
                        `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                      }
                    >
                      Tenants
                    </NavLink>
                    <NavLink
                      to="/admin/utilisateurs"
                      className={({ isActive }) =>
                        `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                      }
                    >
                      Utilisateurs
                    </NavLink>
                    <NavLink
                      to="/admin/import"
                      className={({ isActive }) =>
                        `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                      }
                    >
                      Import
                    </NavLink>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm hidden sm:block">{user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={handleLogout}
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}

