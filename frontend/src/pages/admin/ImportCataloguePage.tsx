import { useState, useEffect, type ChangeEvent } from 'react'
import { api } from '@/api/client'
import type { Tenant } from '@/types'

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
    <div className="admin-page">
      <h1>Import catalogue JSON</h1>
      <p className="hint">
        Importe un catalogue complet depuis un fichier JSON.
        <strong> Attention : remplace l'intégralité du catalogue existant du tenant.</strong>
      </p>

      {error && <p className="error" onClick={() => setError(null)}>{error} ✕</p>}
      {result && <p className="success">{result}</p>}

      <div className="form-group">
        <label>Tenant cible</label>
        <select value={tenantId} onChange={e => setTenantId(e.target.value)}>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label>Fichier JSON</label>
        <input type="file" accept=".json" onChange={handleFile} />
      </div>

      {file && (
        <p className="hint">Fichier sélectionné : <strong>{file.name}</strong></p>
      )}

      <button
        className="btn-primary"
        onClick={handleImport}
        disabled={!tenantId || !file || loading}
      >
        {loading ? 'Import en cours…' : '⬆ Importer'}
      </button>

      <details className="json-example">
        <summary>Format JSON attendu</summary>
        <pre>{JSON.stringify({
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
        }, null, 2)}</pre>
      </details>
    </div>
  )
}
