import { useState, useEffect, type FormEvent } from 'react'
import { api } from '@/api/client'
import type { Tenant, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default function UtilisateursPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterTenant, setFilterTenant] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadUsers = async (tenantId?: string) => {
    const qs = tenantId ? `?tenantId=${tenantId}` : ''
    const data = await api.get<User[]>(`/admin/users${qs}`)
    setUsers(data)
  }

  useEffect(() => {
    Promise.all([
      api.get<Tenant[]>('/admin/tenants'),
      api.get<User[]>('/admin/users'),
    ])
      .then(([ts, us]) => { setTenants(ts); setUsers(us) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleFilter = async (tenantId: string) => {
    setFilterTenant(tenantId)
    await loadUsers(tenantId || undefined)
  }

  if (loading) return <p className="text-gray-500 p-6">Chargement…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <Button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Fermer' : (
            <>
              <Plus className="h-4 w-4" />
              Nouvel utilisateur
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="error cursor-pointer" onClick={() => setError(null)}>
          {error} ✕
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="success cursor-pointer" onClick={() => setSuccess(null)}>
          {success} ✕
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <UserForm
              tenants={tenants}
              onDone={(email) => {
                setShowForm(false)
                setSuccess(`Utilisateur ${email} créé`)
                loadUsers(filterTenant || undefined)
              }}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-1.5 max-w-xs">
        <Label>Filtrer par tenant</Label>
        <select
          className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterTenant}
          onChange={e => handleFilter(e.target.value)}
        >
          <option value="">Tous les tenants</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Aucun utilisateur</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{users.length} utilisateur(s)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell className="text-gray-600">
                      {tenants.find(t => t.id === u.tenantId)?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {u.isSuperAdmin
                        ? <Badge variant="default">⭐ Super admin</Badge>
                        : <Badge variant="secondary">Utilisateur</Badge>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function UserForm({
  tenants,
  onDone,
  onCancel,
}: {
  tenants: Tenant[]
  onDone: (email: string) => void
  onCancel: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/admin/users', { email, password, tenantId: tenantId || null })
      onDone(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Nouvel utilisateur</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Mot de passe initial</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Tenant</Label>
          <select
            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={tenantId}
            onChange={e => setTenantId(e.target.value)}
          >
            <option value="">— Aucun (admin) —</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      {error && <Alert variant="destructive" className="error">{error}</Alert>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? '…' : 'Créer'}</Button>
      </div>
    </form>
  )
}
