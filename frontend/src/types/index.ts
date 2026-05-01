// Types partagés alignés sur le modèle de données

export interface Variant {
  id: string
  name: string
  price: number | null
  variable: boolean
  code?: string
  compteCredit?: string
  journal?: string
}

export interface Service {
  id: string
  code: string
  name: string
  subtitle?: string
  compteCredit?: string
  journal?: string
  variants: Variant[]
}

export interface Category {
  id: string
  label: string
  compteCredit: string
  journal: string
  order: number
  services: Service[]
}

export interface Encaissement {
  id: string
  date: string
  libelle: string
  montant: number
  compteDebit: string
  compteCredit: string
  journal: string
  exported: boolean
}

export interface Export {
  id: string
  createdAt: string
  filename: string
  encaissementCount: number
  total: number
}

export interface Tenant {
  id: string
  name: string
  compteCaisse: string
}

export interface User {
  id: string
  email: string
  tenantId: string
  isSuperAdmin: boolean
}

export interface AuthResponse {
  token: string
  user: User
}
