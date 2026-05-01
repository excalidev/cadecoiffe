import { useState, useEffect } from 'react'
import { api } from '@/api/client'
import { triggerDownload } from '@/utils/download'
import type { Export } from '@/types'

export default function HistoriquePage() {
  const [exports, setExports] = useState<Export[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Export[]>('/exports/')
      .then(setExports)
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const handleDownload = async (exp: Export) => {
    try {
      await triggerDownload(`/exports/${exp.id}/download`)
    } catch {
      setError('Erreur lors du téléchargement')
    }
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="historique-page">
      <h1>Historique des exports</h1>

      {error && <p className="error" onClick={() => setError(null)}>{error} ✕</p>}
      {exports.length === 0 && <p className="empty">Aucun export pour le moment.</p>}

      <ul className="export-list">
        {exports.map(exp => (
          <li key={exp.id} className="export-row">
            <div className="export-info">
              <span className="export-filename">{exp.filename}</span>
              <span className="export-meta">
                {new Date(exp.createdAt).toLocaleString('fr-CH')}
                {' · '}{exp.encaissementCount} ligne(s)
                {' · '}{exp.total.toFixed(2)} CHF
              </span>
            </div>
            <button onClick={() => handleDownload(exp)}>⬇ Re-télécharger</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

