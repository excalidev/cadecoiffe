import { useState, useEffect } from 'react'
import { api } from '@/api/client'
import { triggerDownload } from '@/utils/download'
import type { Encaissement, Export } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Download } from 'lucide-react'

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

  if (loading) return <p className="text-gray-500 p-6">Chargement…</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Export Winbiz</h1>

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

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Rien à exporter — tous les encaissements ont déjà été exportés.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {pending.length} encaissement(s) à exporter
              </CardTitle>
              <span className="font-bold text-gray-900 font-mono">{total.toFixed(2)} CHF</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y divide-gray-100 mb-4">
              {pending.map(enc => (
                <li key={enc.id} className="flex items-center justify-between py-2.5 gap-3">
                  <span className="text-gray-500 text-xs font-mono shrink-0">{enc.date}</span>
                  <span className="text-gray-800 text-sm flex-1">{enc.libelle}</span>
                  <span className="font-semibold text-gray-900 font-mono text-sm whitespace-nowrap">
                    {enc.montant.toFixed(2)} CHF
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center pb-2 mb-4 border-b border-gray-200">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold text-gray-900 font-mono">{total.toFixed(2)} CHF</span>
            </div>
            <Button
              className="btn-primary w-full sm:w-auto"
              onClick={handleExport}
              disabled={exporting}
              size="lg"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Export en cours…' : 'Exporter vers Winbiz'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
