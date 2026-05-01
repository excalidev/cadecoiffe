import { useState, useEffect } from 'react'
import { api } from '@/api/client'
import { triggerDownload } from '@/utils/download'
import type { Export } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download } from 'lucide-react'

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

  if (loading) return <p className="text-gray-500 p-6">Chargement…</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historique des exports</h1>

      {error && (
        <Alert variant="destructive" className="error cursor-pointer" onClick={() => setError(null)}>
          {error} ✕
        </Alert>
      )}

      {exports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Aucun export pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{exports.length} export(s)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Lignes</TableHead>
                  <TableHead className="text-right">Total CHF</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports.map(exp => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-mono text-xs">{exp.filename}</TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {new Date(exp.createdAt).toLocaleString('fr-CH')}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">{exp.encaissementCount}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{exp.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(exp)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Re-télécharger
                      </Button>
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
