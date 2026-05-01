import { useState, useEffect, type FormEvent } from 'react'
import { api } from '@/api/client'
import type { Tenant } from '@/types'

type ModalState =
  | { type: 'new' }
  | { type: 'edit'; tenant: Tenant }

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const data = await api.get<Tenant[]>('/admin/tenants')
    setTenants(data)
  }

  useEffect(() => {
    load().catch(() => setError('Erreur de chargement')).finally(() => setLoading(false))
  }, [])

  const deleteTenant = async (id: string) => {
    if (!confirm('Supprimer ce tenant ? Toutes ses données seront perdues.')) return
    try {
      await api.delete(`/admin/tenants/${id}`)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur suppression')
    }
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Tenants</h1>
        <button onClick={() => setModal({ type: 'new' })}>+ Nouveau tenant</button>
      </div>

      {error && <p className="error" onClick={() => setError(null)}>{error} ✕</p>}
      {tenants.length === 0 && <p className="empty">Aucun tenant</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Compte caisse</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map(t => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.compteCaisse}</td>
              <td className="actions">
                <button onClick={() => setModal({ type: 'edit', tenant: t })}>Modifier</button>
                <button className="btn-danger" onClick={() => deleteTenant(t.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-content">
            <TenantForm
              tenant={modal.type === 'edit' ? modal.tenant : undefined}
              onClose={() => setModal(null)}
              onDone={() => { setModal(null); load() }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TenantForm({ tenant, onClose, onDone }: { tenant?: Tenant; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(tenant?.name ?? '')
  const [compteCaisse, setCompteCaisse] = useState(tenant?.compteCaisse ?? '1010')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (tenant) await api.put(`/admin/tenants/${tenant.id}`, { name, compteCaisse })
      else await api.post('/admin/tenants', { name, compteCaisse })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{tenant ? 'Modifier le tenant' : 'Nouveau tenant'}</h2>
      <div className="form-group">
        <label>Nom</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Compte caisse (débit)</label>
        <input value={compteCaisse} onChange={e => setCompteCaisse(e.target.value)} required />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" onClick={onClose}>Annuler</button>
        <button type="submit" disabled={loading}>{loading ? '…' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
