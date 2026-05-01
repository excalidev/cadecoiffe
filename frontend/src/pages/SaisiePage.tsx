import { useState, useEffect, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { resolveAccounting, buildLibelle, todayFormatted } from '@/utils/accounting'
import type { Category, Service, Variant, Encaissement, Tenant } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { ChevronDown, ChevronRight, Trash2, Plus, ChevronUp } from 'lucide-react'

type SaisieModal =
  | { type: 'picker'; service: Service; category: Category }
  | { type: 'amount'; service: Service; category: Category; variant: Variant }

export default function SaisiePage() {
  const { user, isAdmin } = useAuth()
  const [today] = useState(todayFormatted)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [encaissements, setEncaissements] = useState<Encaissement[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<SaisieModal | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Manual entry
  const [manLibelle, setManLibelle] = useState('')
  const [manMontant, setManMontant] = useState('')
  const [manCompteCredit, setManCompteCredit] = useState('')
  const [manJournal, setManJournal] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const loadEncaissements = async () => {
    const data = await api.get<Encaissement[]>(`/encaissements/?date=${today}`)
    setEncaissements(data)
  }

  useEffect(() => {
    Promise.all([
      api.get<Tenant>('/tenant'),
      api.get<Category[]>('/catalogue/'),
      api.get<Encaissement[]>(`/encaissements/?date=${today}`),
    ])
      .then(([t, cats, encs]) => {
        setTenant(t)
        setCategories(cats)
        setEncaissements(encs)
        // Expand all categories by default for quick access
        setExpanded(new Set(cats.map(c => c.id)))
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [today])

  // Super admin without tenant → redirect to admin
  if (!loading && isAdmin && !user?.tenantId) {
    return <Navigate to="/admin/tenants" replace />
  }

  const total = encaissements.reduce((sum, e) => sum + e.montant, 0)

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleServiceTap = (service: Service, category: Category) => {
    const { variants } = service
    if (variants.length === 0) return
    if (variants.length === 1) {
      const v = variants[0]
      if (v.variable) setModal({ type: 'amount', service, category, variant: v })
      else doAdd(category, service, v, v.price!)
    } else {
      setModal({ type: 'picker', service, category })
    }
  }

  const handleVariantPick = (variant: Variant, service: Service, category: Category) => {
    if (variant.variable) {
      setModal({ type: 'amount', service, category, variant })
    } else {
      doAdd(category, service, variant, variant.price!)
      setModal(null)
    }
  }

  const doAdd = async (category: Category, service: Service, variant: Variant, montant: number) => {
    if (!tenant) return
    const acc = resolveAccounting(tenant, category, service, variant)
    try {
      await api.post('/encaissements/', {
        date: today,
        libelle: buildLibelle(service, variant),
        montant,
        ...acc,
      })
      await loadEncaissements()
    } catch {
      setError("Erreur lors de l'ajout")
    }
  }

  const deleteEncaissement = async (id: string) => {
    try {
      await api.delete(`/encaissements/${id}`)
      await loadEncaissements()
    } catch {
      setError('Erreur suppression')
    }
  }

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    try {
      await api.post('/encaissements/', {
        date: today,
        libelle: manLibelle,
        montant: parseFloat(manMontant),
        compteDebit: tenant.compteCaisse,
        compteCredit: manCompteCredit,
        journal: manJournal,
      })
      setManLibelle('')
      setManMontant('')
      await loadEncaissements()
    } catch {
      setError("Erreur lors de l'ajout manuel")
    }
  }

  if (loading) return <p className="text-gray-500 p-6">Chargement…</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saisie</h1>
          <p className="text-gray-500 text-sm mt-0.5">{today}</p>
        </div>
        <Badge variant="default" className="text-base px-4 py-1.5">
          {total.toFixed(2)} CHF
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive" className="error cursor-pointer" onClick={() => setError(null)}>
          {error} ✕
        </Alert>
      )}

      {/* Catalogue */}
      <section className="space-y-3">
        {categories.length === 0 && (
          <p className="text-gray-500 text-sm">Catalogue vide — configurez-le dans l'onglet Catalogue</p>
        )}
        {categories.map(cat => (
          <Card key={cat.id}>
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors rounded-lg"
              onClick={() => toggleExpand(cat.id)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{cat.label}</span>
                <Badge variant="outline" className="text-xs">{cat.compteCredit}</Badge>
                <Badge variant="secondary" className="text-xs">{cat.journal}</Badge>
              </div>
              {expanded.has(cat.id)
                ? <ChevronDown className="h-4 w-4 text-gray-400" />
                : <ChevronRight className="h-4 w-4 text-gray-400" />
              }
            </button>
            {expanded.has(cat.id) && (
              <CardContent className="pt-0 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {cat.services.map(svc => (
                    <button
                      key={svc.id}
                      className="flex flex-col items-start gap-1.5 p-3.5 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded-lg transition-colors text-left group"
                      onClick={() => handleServiceTap(svc, cat)}
                    >
                      <span className="font-medium text-gray-900 text-sm leading-tight group-hover:text-blue-700">
                        {svc.name}
                      </span>
                      {svc.variants.length === 1 && !svc.variants[0].variable && svc.variants[0].price != null && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          {svc.variants[0].price.toFixed(2)} CHF
                        </Badge>
                      )}
                      {svc.variants.length === 1 && svc.variants[0].variable && (
                        <Badge variant="warning" className="text-xs">libre</Badge>
                      )}
                      {svc.variants.length > 1 && (
                        <Badge variant="outline" className="text-xs">{svc.variants.length} var.</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </section>

      {/* Saisie manuelle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saisie manuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Libellé</Label>
                <Input
                  value={manLibelle}
                  onChange={e => setManLibelle(e.target.value)}
                  placeholder="Ex : Pourboire"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Montant CHF</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  value={manMontant}
                  onChange={e => setManMontant(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => setShowAdvanced(v => !v)}
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Comptabilité
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-5 border-l-2 border-gray-200">
                <div className="space-y-1.5">
                  <Label>Compte crédit</Label>
                  <Input
                    value={manCompteCredit}
                    onChange={e => setManCompteCredit(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Journal</Label>
                  <Input
                    value={manJournal}
                    onChange={e => setManJournal(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste du jour */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Encaissements du jour</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {encaissements.length === 0 && (
            <p className="text-gray-500 text-sm py-4 text-center">Aucun encaissement</p>
          )}
          <ul className="divide-y divide-gray-100">
            {encaissements.map(enc => (
              <li key={enc.id} className="flex items-center justify-between py-2.5 gap-3">
                <span className="text-gray-800 text-sm flex-1">{enc.libelle}</span>
                <span className="font-semibold text-gray-900 font-mono text-sm whitespace-nowrap">
                  {enc.montant.toFixed(2)} CHF
                </span>
                {!enc.exported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-500"
                    onClick={() => deleteEncaissement(enc.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {enc.exported && (
                  <Badge variant="success" className="text-xs">exporté</Badge>
                )}
              </li>
            ))}
          </ul>
          {encaissements.length > 0 && (
            <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold text-gray-900 font-mono">{total.toFixed(2)} CHF</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            {modal.type === 'picker' && (
              <VariantPickerModal
                service={modal.service}
                category={modal.category}
                onPick={handleVariantPick}
                onClose={() => setModal(null)}
              />
            )}
            {modal.type === 'amount' && (
              <AmountModal
                service={modal.service}
                category={modal.category}
                variant={modal.variant}
                onConfirm={montant => { doAdd(modal.category, modal.service, modal.variant, montant); setModal(null) }}
                onClose={() => setModal(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function VariantPickerModal({
  service,
  category,
  onPick,
  onClose,
}: {
  service: Service
  category: Category
  onPick: (v: Variant, svc: Service, cat: Category) => void
  onClose: () => void
}) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{service.name}</h2>
        {service.subtitle && <p className="text-sm text-gray-500 mt-0.5">{service.subtitle}</p>}
      </div>
      <div className="space-y-2">
        {service.variants.map(v => (
          <button
            key={v.id}
            className="w-full flex items-center justify-between p-3.5 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
            onClick={() => onPick(v, service, category)}
          >
            <span className="font-medium text-gray-900">{v.name || service.name}</span>
            {v.variable
              ? <Badge variant="warning">prix libre</Badge>
              : <Badge variant="secondary" className="font-mono">{v.price?.toFixed(2)} CHF</Badge>
            }
          </button>
        ))}
      </div>
      <Button variant="outline" className="w-full" onClick={onClose}>Annuler</Button>
    </div>
  )
}

function AmountModal({
  service,
  variant,
  onConfirm,
  onClose,
}: {
  service: Service
  category: Category
  variant: Variant
  onConfirm: (montant: number) => void
  onClose: () => void
}) {
  const [montant, setMontant] = useState('')
  const libelle = buildLibelle(service, variant)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const val = parseFloat(montant)
    if (isNaN(val) || val <= 0) return
    onConfirm(val)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{libelle}</h2>
      <div className="space-y-1.5">
        <Label>Montant CHF</Label>
        <Input
          type="number"
          step="0.05"
          min="0.05"
          value={montant}
          onChange={e => setMontant(e.target.value)}
          autoFocus
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button type="submit" className="flex-1">Ajouter</Button>
      </div>
    </form>
  )
}
