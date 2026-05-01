import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminRoute } from '@/components/AdminRoute'
import { Layout } from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import SaisiePage from '@/pages/SaisiePage'
import ExportPage from '@/pages/ExportPage'
import HistoriquePage from '@/pages/HistoriquePage'
import CataloguePage from '@/pages/CataloguePage'
import TenantsPage from '@/pages/admin/TenantsPage'
import UtilisateursPage from '@/pages/admin/UtilisateursPage'
import ImportCataloguePage from '@/pages/admin/ImportCataloguePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/saisie"
            element={<ProtectedRoute><Layout><SaisiePage /></Layout></ProtectedRoute>}
          />
          <Route
            path="/export"
            element={<ProtectedRoute><Layout><ExportPage /></Layout></ProtectedRoute>}
          />
          <Route
            path="/historique"
            element={<ProtectedRoute><Layout><HistoriquePage /></Layout></ProtectedRoute>}
          />
          <Route
            path="/catalogue"
            element={<ProtectedRoute><Layout><CataloguePage /></Layout></ProtectedRoute>}
          />
          <Route
            path="/admin/tenants"
            element={<AdminRoute><Layout><TenantsPage /></Layout></AdminRoute>}
          />
          <Route
            path="/admin/utilisateurs"
            element={<AdminRoute><Layout><UtilisateursPage /></Layout></AdminRoute>}
          />
          <Route
            path="/admin/import"
            element={<AdminRoute><Layout><ImportCataloguePage /></Layout></AdminRoute>}
          />
          <Route path="*" element={<Navigate to="/saisie" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

