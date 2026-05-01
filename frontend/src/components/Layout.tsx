import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Edit3, Download, History, BookOpen, Settings, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'

const mainLinks = [
  { to: '/saisie', label: 'Saisie', icon: Edit3 },
  { to: '/export', label: 'Export', icon: Download },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/catalogue', label: 'Catalogue', icon: BookOpen },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold tracking-tight whitespace-nowrap">Ça décoiffe 💈</span>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-1">
                {mainLinks.map(({ to, label }) => (
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
                  <NavLink
                    to="/admin/tenants"
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    Admin
                  </NavLink>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm hidden sm:block">{user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={handleLogout}
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex">
          {mainLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin/tenants"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-purple-600' : 'text-gray-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Settings className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  Admin
                </>
              )}
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  )
}

