import { useState, useEffect } from 'react'
import { api } from '@/api/client'
import { triggerDownload } from '@/utils/download'
import type { Encaissement, Export } from '@/types'

export default function ExportPage() {
  const [pending, setPending] = useState<Encaissement[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadPending = async () => {
    const data = await api.get<Encaissement[]>('/exports/pending')
    setPending(data)
  }

  useEffect(() => {
    loadPending().finally(() => setLoading(false))
  }, [])

  const total = pending.reduce((sum, e) => sum + e.montant, 0)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await api.post<Export>('/exports/', {})
      await triggerDownload(`/exports/${result.id}/download`)
      await loadPending()
      setSuccess(`Export « ${result.filename} » créé — ${result.encaissementCount} ligne(s), ${result.total.toFixed(2)} CHF`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="export-page">
      <h1>Export Winbiz</h1>

      {error && <p className="error" onClick={() => setError(null)}>{error} ✕</p>}
      {success && <p className="success" onClick={() => setSuccess(null)}>{success} ✕</p>}

      {pending.length === 0 ? (
        <p className="empty">Rien à exporter — tous les encaissements ont déjà été exportés.</p>
      ) : (
        <>
          <div className="export-summary">
            <span>{pending.length} encaissement(s) à exporter</span>
            <strong>{total.toFixed(2)} CHF</strong>
          </div>

          <ul className="encaissement-list">
            {pending.map(enc => (
              <li key={enc.id} className="encaissement-row">
                <span className="enc-date">{enc.date}</span>
                <span className="enc-libelle">{enc.libelle}</span>
                <span className="enc-montant">{enc.montant.toFixed(2)} CHF</span>
              </li>
            ))}
          </ul>

          <div className="encaissement-total">
            Total <strong>{total.toFixed(2)} CHF</strong>
          </div>

          <button className="btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Export en cours…' : '⬇ Exporter vers Winbiz'}
          </button>
        </>
      )}
    </div>
  )
}

