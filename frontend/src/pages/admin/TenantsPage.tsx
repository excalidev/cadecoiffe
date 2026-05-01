import { useState, useEffect, type FormEvent } from 'react'
import { api } from '@/api/client'
import type { Tenant } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2 } from 'lucide-react'

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

  if (loading) return <p className="text-gray-500 p-6">Chargement…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <Button onClick={() => setModal({ type: 'new' })}>
          <Plus className="h-4 w-4" />
          Nouveau tenant
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="error cursor-pointer" onClick={() => setError(null)}>
          {error} ✕
        </Alert>
      )}

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Aucun tenant</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{tenants.length} tenant(s)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Compte caisse</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-sm">{t.compteCaisse}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'edit', tenant: t })}>
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteTenant(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
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
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{tenant ? 'Modifier le tenant' : 'Nouveau tenant'}</h2>
      <div className="space-y-1.5">
        <Label>Nom</Label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label>Compte caisse (débit)</Label>
        <Input value={compteCaisse} onChange={e => setCompteCaisse(e.target.value)} required />
      </div>
      {error && <Alert variant="destructive" className="error">{error}</Alert>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? '…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}
