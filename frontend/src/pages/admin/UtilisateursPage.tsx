import { useState, useEffect, type FormEvent } from 'react'
import { api } from '@/api/client'
import type { Tenant, User } from '@/types'

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

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Utilisateurs</h1>
        <button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Fermer' : '+ Nouvel utilisateur'}
        </button>
      </div>

      {error && <p className="error" onClick={() => setError(null)}>{error} ✕</p>}
      {success && <p className="success" onClick={() => setSuccess(null)}>{success} ✕</p>}

      {showForm && (
        <div className="inline-form-card">
          <UserForm
            tenants={tenants}
            onDone={(email) => {
              setShowForm(false)
              setSuccess(`Utilisateur ${email} créé`)
              loadUsers(filterTenant || undefined)
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="form-group" style={{ maxWidth: 300 }}>
        <label>Filtrer par tenant</label>
        <select value={filterTenant} onChange={e => handleFilter(e.target.value)}>
          <option value="">Tous les tenants</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {users.length === 0 && <p className="empty">Aucun utilisateur</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Tenant</th>
            <th>Rôle</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{tenants.find(t => t.id === u.tenantId)?.name ?? '—'}</td>
              <td>{u.isSuperAdmin ? '⭐ Super admin' : 'Utilisateur'}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
    <form onSubmit={handleSubmit}>
      <h2>Nouvel utilisateur</h2>
      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Mot de passe initial</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Tenant</label>
          <select value={tenantId} onChange={e => setTenantId(e.target.value)}>
            <option value="">— Aucun (admin) —</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={loading}>{loading ? '…' : 'Créer'}</button>
      </div>
    </form>
  )
}
