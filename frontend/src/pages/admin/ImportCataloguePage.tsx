import { useState, useEffect, type ChangeEvent } from 'react'
import { api } from '@/api/client'
import type { Tenant } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'

export default function ImportCataloguePage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantId, setTenantId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    api.get<Tenant[]>('/admin/tenants').then(ts => {
      setTenants(ts)
      if (ts.length > 0) setTenantId(ts[0].id)
    }).catch(() => setError('Erreur chargement tenants'))
  }, [])

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
    setResult(null)
    setError(null)
  }

  const handleImport = async () => {
    if (!tenantId || !file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const res = await api.post<{ imported: number }>(
        `/admin/tenants/${tenantId}/import-catalogue`,
        json,
      )
      setResult(`✅ Import réussi — ${res.imported} catégorie(s) importée(s)`)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Import catalogue JSON</h1>

      {error && (
        <Alert variant="destructive" className="error cursor-pointer" onClick={() => setError(null)}>
          {error} ✕
        </Alert>
      )}
      {result && (
        <Alert variant="success" className="success">{result}</Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importer un catalogue</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Importe un catalogue complet depuis un fichier JSON.{' '}
            <strong className="text-amber-700">Attention : remplace l'intégralité du catalogue existant du tenant.</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tenant cible</Label>
            <select
              className="flex h-9 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
            >
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Fichier JSON</Label>
            <input
              type="file"
              accept=".json"
              onChange={handleFile}
              className="block text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {file && (
            <p className="text-sm text-gray-600">
              Fichier sélectionné : <strong>{file.name}</strong>
            </p>
          )}

          <Button
            className="btn-primary"
            onClick={handleImport}
            disabled={!tenantId || !file || loading}
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Import en cours…' : 'Importer'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Format JSON attendu</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-700 overflow-x-auto border border-gray-200">
            {JSON.stringify({
              tenant: { compteCaisse: '1010' },
              categories: [{
                label: 'Hommes',
                compteCredit: '3022',
                journal: 'VE',
                services: [
                  { code: '010', name: 'Coupe homme', price: 25 },
                  { code: '020', name: 'Brushing', variants: [{ name: 'AVS', price: 35 }, { name: 'Normal', price: 36 }] },
                  { code: '033', name: 'Mèches papiers', variable: true },
                ],
              }],
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
