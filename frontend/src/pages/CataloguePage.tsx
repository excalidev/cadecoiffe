import { useState, useEffect, type FormEvent } from 'react'
import { api } from '@/api/client'
import type { Category, Service, Variant } from '@/types'

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

  if (loading) return <p>Chargement…</p>

  return (
    <div className="catalogue-page">
      <div className="page-header">
        <h1>Catalogue</h1>
        <button onClick={() => setModal({ type: 'cat-new' })}>+ Catégorie</button>
      </div>
      {error && <p className="error">{error}</p>}

      {categories.length === 0 && (
        <p className="empty">Aucune catégorie — cliquez « + Catégorie » pour commencer</p>
      )}

      {categories.map(cat => (
        <div key={cat.id} className="category-block">
          <div className="category-header">
            <button className="expand-btn" onClick={() => toggleExpand(cat.id)}>
              {expanded.has(cat.id) ? '▼' : '▶'}
            </button>
            <span className="category-label">{cat.label}</span>
            <span className="category-meta">{cat.compteCredit} · {cat.journal}</span>
            <div className="actions">
              <button onClick={() => setModal({ type: 'svc-new', catId: cat.id })}>+ Service</button>
              <button onClick={() => setModal({ type: 'cat-edit', cat })}>Modifier</button>
              <button className="btn-danger" onClick={() => deleteCategory(cat.id)}>Supprimer</button>
            </div>
          </div>

          {expanded.has(cat.id) && (
            <div className="services-list">
              {cat.services.length === 0 && (
                <p className="empty">Aucun service</p>
              )}
              {cat.services.map(svc => (
                <div key={svc.id} className="service-row">
                  <div className="service-header">
                    <span className="service-code">{svc.code}</span>
                    <span className="service-name">{svc.name}</span>
                    {svc.subtitle && <span className="service-subtitle">{svc.subtitle}</span>}
                    <div className="actions">
                      <button onClick={() => setModal({ type: 'var-new', svcId: svc.id })}>+ Variante</button>
                      <button onClick={() => setModal({ type: 'svc-edit', svc, catId: cat.id })}>Modifier</button>
                      <button className="btn-danger" onClick={() => deleteService(svc.id)}>Supprimer</button>
                    </div>
                  </div>
                  {svc.variants.length > 0 && (
                    <div className="variants-list">
                      {svc.variants.map(v => (
                        <div key={v.id} className="variant-row">
                          <span className="variant-name">{v.name}</span>
                          {v.variable
                            ? <span className="variant-price tag-libre">prix libre</span>
                            : <span className="variant-price">{v.price?.toFixed(2)} CHF</span>
                          }
                          {v.code && <span className="variant-code">({v.code})</span>}
                          <div className="actions">
                            <button onClick={() => setModal({ type: 'var-edit', variant: v, svcId: svc.id })}>Modifier</button>
                            <button className="btn-danger" onClick={() => deleteVariant(v.id)}>Supprimer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-content">
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
    <form onSubmit={handleSubmit}>
      <h2>{cat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
      <div className="form-group">
        <label>Libellé</label>
        <input value={label} onChange={e => setLabel(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Compte crédit</label>
        <input value={compteCredit} onChange={e => setCompteCredit(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Journal</label>
        <input value={journal} onChange={e => setJournal(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Ordre</label>
        <input type="number" value={order} onChange={e => setOrder(+e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" onClick={onClose}>Annuler</button>
        <button type="submit" disabled={loading}>{loading ? '…' : 'Enregistrer'}</button>
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
    <form onSubmit={handleSubmit}>
      <h2>{svc ? 'Modifier le service' : 'Nouveau service'}</h2>
      <div className="form-group">
        <label>Code</label>
        <input value={code} onChange={e => setCode(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Nom</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Sous-titre <span className="optional">(optionnel)</span></label>
        <input value={subtitle} onChange={e => setSubtitle(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Compte crédit <span className="optional">(hérite de la catégorie)</span></label>
        <input value={compteCredit} onChange={e => setCompteCredit(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Journal <span className="optional">(hérite de la catégorie)</span></label>
        <input value={journal} onChange={e => setJournal(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Ordre</label>
        <input type="number" value={order} onChange={e => setOrder(+e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" onClick={onClose}>Annuler</button>
        <button type="submit" disabled={loading}>{loading ? '…' : 'Enregistrer'}</button>
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
    <form onSubmit={handleSubmit}>
      <h2>{variant ? 'Modifier la variante' : 'Nouvelle variante'}</h2>
      <div className="form-group">
        <label>Nom</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="form-group checkbox-group">
        <label>
          <input type="checkbox" checked={variable} onChange={e => setVariable(e.target.checked)} />
          Prix libre (saisie manuelle du montant)
        </label>
      </div>
      {!variable && (
        <div className="form-group">
          <label>Prix (CHF)</label>
          <input
            type="number"
            step="0.05"
            min="0"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>
      )}
      <div className="form-group">
        <label>Code <span className="optional">(optionnel)</span></label>
        <input value={code} onChange={e => setCode(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Compte crédit <span className="optional">(hérite du service/catégorie)</span></label>
        <input value={compteCredit} onChange={e => setCompteCredit(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Journal <span className="optional">(hérite du service/catégorie)</span></label>
        <input value={journal} onChange={e => setJournal(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Ordre</label>
        <input type="number" value={order} onChange={e => setOrder(+e.target.value)} />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button type="button" onClick={onClose}>Annuler</button>
        <button type="submit" disabled={loading}>{loading ? '…' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}

