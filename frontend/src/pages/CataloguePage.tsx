import { useState, useEffect, type FormEvent } from 'react'
import type { ReactNode } from 'react'
import { api } from '@/api/client'
import type { Category, Service, Variant } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'

type ModalState =
  | { type: 'cat-new' }
  | { type: 'cat-edit'; cat: Category }
  | { type: 'svc-new'; catId: string }
  | { type: 'svc-edit'; svc: Service; catId: string }
  | { type: 'var-new'; svcId: string }
  | { type: 'var-edit'; variant: Variant; svcId: string }

export default function CataloguePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const data = await api.get<Category[]>('/catalogue/')
      setCategories(data)
    } catch {
      setError('Erreur de chargement du catalogue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const deleteCategory = async (id: string) => {
    if (!confirm('Supprimer cette catégorie et tous ses services ?')) return
    await api.delete(`/catalogue/categories/${id}`)
    load()
  }

  const deleteService = async (id: string) => {
    if (!confirm('Supprimer ce service et toutes ses variantes ?')) return
    await api.delete(`/catalogue/services/${id}`)
    load()
  }

  const deleteVariant = async (id: string) => {
    if (!confirm('Supprimer cette variante ?')) return
    await api.delete(`/catalogue/variants/${id}`)
    load()
  }

  if (loading) return <p className="text-gray-500 p-6">Chargement…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Catalogue</h1>
        <Button onClick={() => setModal({ type: 'cat-new' })}>
          <Plus className="h-4 w-4" />
          Catégorie
        </Button>
      </div>

      {error && <Alert variant="destructive" className="error">{error}</Alert>}

      {categories.length === 0 && (
        <p className="text-gray-500 text-sm">Aucune catégorie — cliquez « + Catégorie » pour commencer</p>
      )}

      <div className="space-y-3">
        {categories.map(cat => (
          <Card key={cat.id}>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                  onClick={() => toggleExpand(cat.id)}
                >
                  {expanded.has(cat.id)
                    ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  }
                  <span className="font-semibold text-gray-900">{cat.label}</span>
                </button>
                <Badge variant="outline" className="text-xs shrink-0">{cat.compteCredit}</Badge>
                <Badge variant="secondary" className="text-xs shrink-0">{cat.journal}</Badge>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                <Button size="sm" variant="outline" onClick={() => setModal({ type: 'svc-new', catId: cat.id })}>
                  <Plus className="h-3.5 w-3.5" />
                  Service
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setModal({ type: 'cat-edit', cat })}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteCategory(cat.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {expanded.has(cat.id) && (
              <CardContent className="pt-0 pb-3 px-5">
                {cat.services.length === 0 && (
                  <p className="text-gray-400 text-sm py-2">Aucun service</p>
                )}
                <div className="space-y-2">
                  {cat.services.map(svc => (
                    <div key={svc.id} className="border border-gray-100 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Badge variant="outline" className="text-xs font-mono shrink-0">{svc.code}</Badge>
                          <span className="font-medium text-gray-900 text-sm">{svc.name}</span>
                          {svc.subtitle && (
                            <span className="text-gray-500 text-xs hidden sm:block">{svc.subtitle}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setModal({ type: 'var-new', svcId: svc.id })}>
                            <Plus className="h-3 w-3" />
                            Variante
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setModal({ type: 'svc-edit', svc, catId: cat.id })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteService(svc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {svc.variants.length > 0 && (
                        <div className="border-t border-gray-100 divide-y divide-gray-100">
                          {svc.variants.map(v => (
                            <div key={v.id} className="flex items-center justify-between px-4 py-2 pl-8 bg-white rounded-b-lg">
                              <div className="flex items-center gap-2.5">
                                <span className="text-gray-700 text-sm">{v.name}</span>
                                {v.variable
                                  ? <Badge variant="warning" className="text-xs">prix libre</Badge>
                                  : <Badge variant="secondary" className="text-xs font-mono">{v.price?.toFixed(2)} CHF</Badge>
                                }
                                {v.code && (
                                  <span className="text-gray-400 text-xs font-mono">({v.code})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setModal({ type: 'var-edit', variant: v, svcId: svc.id })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteVariant(v.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <ModalContent
              modal={modal}
              onClose={() => setModal(null)}
              onDone={() => { setModal(null); load() }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ModalContent({
  modal,
  onClose,
  onDone,
}: {
  modal: ModalState
  onClose: () => void
  onDone: () => void
}) {
  switch (modal.type) {
    case 'cat-new': return <CategoryForm onClose={onClose} onDone={onDone} />
    case 'cat-edit': return <CategoryForm cat={modal.cat} onClose={onClose} onDone={onDone} />
    case 'svc-new': return <ServiceForm catId={modal.catId} onClose={onClose} onDone={onDone} />
    case 'svc-edit': return <ServiceForm svc={modal.svc} catId={modal.catId} onClose={onClose} onDone={onDone} />
    case 'var-new': return <VariantForm svcId={modal.svcId} onClose={onClose} onDone={onDone} />
    case 'var-edit': return <VariantForm variant={modal.variant} svcId={modal.svcId} onClose={onClose} onDone={onDone} />
  }
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {hint && <span className="text-gray-400 font-normal text-xs ml-1">({hint})</span>}
      </Label>
      {children}
    </div>
  )
}

function CategoryForm({
  cat,
  onClose,
  onDone,
}: {
  cat?: Category
  onClose: () => void
  onDone: () => void
}) {
  const [label, setLabel] = useState(cat?.label ?? '')
  const [compteCredit, setCompteCredit] = useState(cat?.compteCredit ?? '')
  const [journal, setJournal] = useState(cat?.journal ?? '')
  const [order, setOrder] = useState(cat?.order ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { label, compteCredit, journal, order }
      if (cat) await api.put(`/catalogue/categories/${cat.id}`, payload)
      else await api.post('/catalogue/categories', payload)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{cat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
      <FormField label="Libellé">
        <Input value={label} onChange={e => setLabel(e.target.value)} required />
      </FormField>
      <FormField label="Compte crédit">
        <Input value={compteCredit} onChange={e => setCompteCredit(e.target.value)} required />
      </FormField>
      <FormField label="Journal">
        <Input value={journal} onChange={e => setJournal(e.target.value)} required />
      </FormField>
      <FormField label="Ordre">
        <Input type="number" value={order} onChange={e => setOrder(+e.target.value)} />
      </FormField>
      {error && <Alert variant="destructive" className="error">{error}</Alert>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? '…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}

function ServiceForm({
  svc,
  catId,
  onClose,
  onDone,
}: {
  svc?: Service
  catId: string
  onClose: () => void
  onDone: () => void
}) {
  const [code, setCode] = useState(svc?.code ?? '')
  const [name, setName] = useState(svc?.name ?? '')
  const [subtitle, setSubtitle] = useState(svc?.subtitle ?? '')
  const [compteCredit, setCompteCredit] = useState(svc?.compteCredit ?? '')
  const [journal, setJournal] = useState(svc?.journal ?? '')
  const [order, setOrder] = useState(svc?.order ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      code,
      name,
      subtitle: subtitle || null,
      compteCredit: compteCredit || null,
      journal: journal || null,
      order,
      categoryId: catId,
    }
    try {
      if (svc) await api.put(`/catalogue/services/${svc.id}`, payload)
      else await api.post('/catalogue/services', payload)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{svc ? 'Modifier le service' : 'Nouveau service'}</h2>
      <FormField label="Code">
        <Input value={code} onChange={e => setCode(e.target.value)} required />
      </FormField>
      <FormField label="Nom">
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </FormField>
      <FormField label="Sous-titre" hint="optionnel">
        <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} />
      </FormField>
      <FormField label="Compte crédit" hint="hérite de la catégorie">
        <Input value={compteCredit} onChange={e => setCompteCredit(e.target.value)} />
      </FormField>
      <FormField label="Journal" hint="hérite de la catégorie">
        <Input value={journal} onChange={e => setJournal(e.target.value)} />
      </FormField>
      <FormField label="Ordre">
        <Input type="number" value={order} onChange={e => setOrder(+e.target.value)} />
      </FormField>
      {error && <Alert variant="destructive" className="error">{error}</Alert>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? '…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}

function VariantForm({
  variant,
  svcId,
  onClose,
  onDone,
}: {
  variant?: Variant
  svcId: string
  onClose: () => void
  onDone: () => void
}) {
  const [name, setName] = useState(variant?.name ?? '')
  const [price, setPrice] = useState(variant?.price?.toString() ?? '')
  const [variable, setVariable] = useState(variant?.variable ?? false)
  const [code, setCode] = useState(variant?.code ?? '')
  const [compteCredit, setCompteCredit] = useState(variant?.compteCredit ?? '')
  const [journal, setJournal] = useState(variant?.journal ?? '')
  const [order, setOrder] = useState(variant?.order ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      name,
      price: variable ? null : (price ? parseFloat(price) : null),
      variable,
      code: code || null,
      compteCredit: compteCredit || null,
      journal: journal || null,
      order,
      serviceId: svcId,
    }
    try {
      if (variant) await api.put(`/catalogue/variants/${variant.id}`, payload)
      else await api.post(`/catalogue/services/${svcId}/variants`, payload)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{variant ? 'Modifier la variante' : 'Nouvelle variante'}</h2>
      <FormField label="Nom">
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </FormField>
      <div className="flex items-center gap-2.5 py-1">
        <input
          type="checkbox"
          id="variable-check"
          checked={variable}
          onChange={e => setVariable(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600"
        />
        <Label htmlFor="variable-check" className="cursor-pointer">Prix libre (saisie manuelle du montant)</Label>
      </div>
      {!variable && (
        <FormField label="Prix (CHF)">
          <Input
            type="number"
            step="0.05"
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </FormField>
      )}
      <FormField label="Code" hint="optionnel">
        <Input value={code} onChange={e => setCode(e.target.value)} />
      </FormField>
      <FormField label="Compte crédit" hint="hérite du service/catégorie">
        <Input value={compteCredit} onChange={e => setCompteCredit(e.target.value)} />
      </FormField>
      <FormField label="Journal" hint="hérite du service/catégorie">
        <Input value={journal} onChange={e => setJournal(e.target.value)} />
      </FormField>
      <FormField label="Ordre">
        <Input type="number" value={order} onChange={e => setOrder(+e.target.value)} />
      </FormField>
      {error && <Alert variant="destructive" className="error">{error}</Alert>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? '…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}
