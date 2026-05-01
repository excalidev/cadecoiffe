import { useState, useEffect, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { resolveAccounting, buildLibelle, todayFormatted } from '@/utils/accounting'
import type { Category, Service, Variant, Encaissement, Tenant } from '@/types'

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

  if (loading) return <p>Chargement…</p>

  return (
    <div className="saisie-page">
      {/* Header */}
      <div className="saisie-header">
        <div>
          <h1>Saisie</h1>
          <span className="saisie-date">{today}</span>
        </div>
        <div className="saisie-total">
          Total du jour&nbsp;
          <strong>{total.toFixed(2)} CHF</strong>
        </div>
      </div>

      {error && <p className="error" onClick={() => setError(null)}>{error} ✕</p>}

      {/* Catalogue */}
      <section className="catalogue-section">
        {categories.length === 0 && (
          <p className="empty">Catalogue vide — configurez-le dans l'onglet Catalogue</p>
        )}
        {categories.map(cat => (
          <div key={cat.id} className="saisie-category">
            <button className="category-toggle" onClick={() => toggleExpand(cat.id)}>
              {expanded.has(cat.id) ? '▼' : '▶'} {cat.label}
            </button>
            {expanded.has(cat.id) && (
              <div className="service-buttons">
                {cat.services.map(svc => (
                  <button
                    key={svc.id}
                    className="service-btn"
                    onClick={() => handleServiceTap(svc, cat)}
                  >
                    <span className="svc-name">{svc.name}</span>
                    {svc.variants.length === 1 && !svc.variants[0].variable && svc.variants[0].price != null && (
                      <span className="svc-price">{svc.variants[0].price.toFixed(2)}</span>
                    )}
                    {svc.variants.length === 1 && svc.variants[0].variable && (
                      <span className="svc-price tag-libre">libre</span>
                    )}
                    {svc.variants.length > 1 && (
                      <span className="svc-price tag-variants">{svc.variants.length} var.</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Saisie manuelle */}
      <section className="manual-section">
        <h2>Saisie manuelle</h2>
        <form onSubmit={handleManualSubmit} className="manual-form">
          <div className="form-row">
            <div className="form-group">
              <label>Libellé</label>
              <input
                value={manLibelle}
                onChange={e => setManLibelle(e.target.value)}
                placeholder="Ex : Pourboire"
                required
              />
            </div>
            <div className="form-group">
              <label>Montant CHF</label>
              <input
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
            className="btn-link"
            onClick={() => setShowAdvanced(v => !v)}
          >
            {showAdvanced ? '▼' : '▶'} Comptabilité
          </button>

          {showAdvanced && (
            <div className="form-row">
              <div className="form-group">
                <label>Compte crédit</label>
                <input
                  value={manCompteCredit}
                  onChange={e => setManCompteCredit(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Journal</label>
                <input
                  value={manJournal}
                  onChange={e => setManJournal(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit">Ajouter</button>
        </form>
      </section>

      {/* Liste du jour */}
      <section className="encaissements-section">
        <h2>Encaissements du jour</h2>
        {encaissements.length === 0 && <p className="empty">Aucun encaissement</p>}
        <ul className="encaissement-list">
          {encaissements.map(enc => (
            <li key={enc.id} className="encaissement-row">
              <span className="enc-libelle">{enc.libelle}</span>
              <span className="enc-montant">{enc.montant.toFixed(2)} CHF</span>
              {!enc.exported && (
                <button
                  className="btn-delete"
                  onClick={() => deleteEncaissement(enc.id)}
                  title="Supprimer"
                >
                  ✕
                </button>
              )}
              {enc.exported && <span className="tag-exported">exporté</span>}
            </li>
          ))}
        </ul>
        {encaissements.length > 0 && (
          <div className="encaissement-total">
            Total <strong>{total.toFixed(2)} CHF</strong>
          </div>
        )}
      </section>

      {/* Modales */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-content">
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
    <div className="variant-picker">
      <h2>{service.name}</h2>
      <p className="subtitle">{service.subtitle}</p>
      <div className="variant-buttons">
        {service.variants.map(v => (
          <button key={v.id} className="variant-btn" onClick={() => onPick(v, service, category)}>
            <span>{v.name || service.name}</span>
            {v.variable
              ? <span className="tag-libre">prix libre</span>
              : <span>{v.price?.toFixed(2)} CHF</span>
            }
          </button>
        ))}
      </div>
      <button className="btn-cancel" onClick={onClose}>Annuler</button>
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
    <form onSubmit={handleSubmit} className="amount-modal">
      <h2>{libelle}</h2>
      <div className="form-group">
        <label>Montant CHF</label>
        <input
          type="number"
          step="0.05"
          min="0.05"
          value={montant}
          onChange={e => setMontant(e.target.value)}
          autoFocus
          required
        />
      </div>
      <div className="form-actions">
        <button type="button" onClick={onClose}>Annuler</button>
        <button type="submit">Ajouter</button>
      </div>
    </form>
  )
}

