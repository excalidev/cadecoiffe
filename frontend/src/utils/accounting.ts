import type { Category, Service, Variant, Tenant } from '@/types'

export function resolveAccounting(
  tenant: Tenant,
  category: Category,
  service: Service,
  variant?: Variant,
): { compteDebit: string; compteCredit: string; journal: string } {
  return {
    compteDebit: tenant.compteCaisse,
    compteCredit: (variant?.compteCredit ?? service.compteCredit ?? category.compteCredit)!,
    journal: (variant?.journal ?? service.journal ?? category.journal)!,
  }
}

export function buildLibelle(service: Service, variant: Variant): string {
  if (service.variants.length <= 1 || !variant.name) return service.name
  return `${service.name} ${variant.name}`
}

export function todayFormatted(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}
