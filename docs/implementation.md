# Plan d'implémentation — Ça décoiffe

> Application SaaS légère de caisse + export comptable Winbiz.
> Stack : ASP.NET Core (Minimal API) · React + Vite + TypeScript · PostgreSQL · Docker

---

## État du scaffolding

- [x] Projet .NET créé avec packages EF Core, JWT, BCrypt
- [x] Modèles de données (`Tenant`, `User`, `Category`, `Service`, `Variant`, `Encaissement`, `Export`)
- [x] `AppDbContext` avec relations et contraintes
- [x] Endpoints squelettes (Auth, Catalogue, Encaissements, Export, Admin)
- [x] Frontend React + Vite + TypeScript avec routing 8 pages
- [x] `docker-compose.yml` (postgres + api + frontend)
- [ ] Migration EF Core initiale

---

## Epic 1 — Infrastructure & Auth

### 1.1 Migration EF Core initiale
- Générer la migration initiale : `dotnet ef migrations add InitialCreate`
- Vérifier le SQL généré
- Les migrations s'appliquent automatiquement au démarrage (`db.Database.Migrate()`)

### 1.2 Seed super admin
- Au démarrage, si aucun super admin n'existe → créer le compte admin par défaut
- Email et mot de passe depuis les variables d'environnement (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Utiliser `BCrypt.Net.BCrypt.HashPassword()`

### 1.3 Endpoint POST /api/auth/login
- ✅ Squelette existant dans `AuthEndpoints.cs`
- Retourne `{ token, user }` avec claims `tenant_id` + `is_super_admin`
- Durée de validité : 7 jours

### 1.4 Frontend — LoginPage
- Formulaire email + mot de passe
- Appel `POST /api/auth/login`
- Stocker le token JWT dans `localStorage`
- Redirection vers `/saisie` après connexion
- Guard de route : rediriger vers `/login` si pas de token valide

### 1.5 Frontend — Auth guard & hook
- Hook `useAuth()` : lire le token, décoder les claims, exposer `user` et `logout()`
- Composant `ProtectedRoute` : vérifie le token avant de rendre la page
- Composant `AdminRoute` : vérifie `is_super_admin` en plus

---

## Epic 2 — Catalogue (backend)

### 2.1 GET /api/catalogue/
- ✅ Squelette existant
- Retourne toutes les catégories du tenant avec services et variantes imbriqués
- Ordonné par `Category.Order`, `Service.Order`, `Variant.Order`

### 2.2 CRUD Catégories
- `POST /api/catalogue/categories` — créer une catégorie
- `PUT /api/catalogue/categories/{id}` — modifier label, compteCredit, journal, order
- `DELETE /api/catalogue/categories/{id}` — supprimer (cascade sur services + variantes)

### 2.3 CRUD Services
- `POST /api/catalogue/services` — créer un service dans une catégorie
- `PUT /api/catalogue/services/{id}` — modifier code, name, subtitle, overrides comptables, order
- `DELETE /api/catalogue/services/{id}`

### 2.4 CRUD Variantes
- `POST /api/catalogue/services/{id}/variants` — ajouter une variante
- `PUT /api/catalogue/variants/{id}` — modifier name, price, variable, code, overrides comptables, order
- `DELETE /api/catalogue/variants/{id}`

### 2.5 Logique d'héritage comptable (helper)
- Créer `AccountingResolver` (service ou méthode statique)
- Résout `(compteDebit, compteCredit, journal)` pour un encaissement donné
- Cascade : variante → service → catégorie → tenant
- Utilisé à la saisie pour snapshot les valeurs comptables

---

## Epic 3 — Catalogue (frontend)

### 3.1 Page Catalogue — liste
- Afficher les catégories avec leurs services et variantes
- UI en accordéon (catégorie → services → variantes)
- Boutons Ajouter / Modifier / Supprimer à chaque niveau

### 3.2 Formulaires catégorie
- Modale : label, compteCredit, journal, order
- Validation : tous les champs requis

### 3.3 Formulaires service
- Modale : code, name, subtitle, compteCredit (optionnel), journal (optionnel)
- Sélection de la catégorie parente

### 3.4 Formulaires variante
- Modale : name, price ou variable (toggle), code (optionnel), compteCredit (optionnel), journal (optionnel)
- Si `variable = true` → champ price désactivé

---

## Epic 4 — Saisie (backend)

### 4.1 GET /api/encaissements/?date=dd.MM.yyyy
- ✅ Squelette existant
- Filtre par date (optionnel), scoped au tenant
- Retourne liste ordonnée par `CreatedAt`

### 4.2 POST /api/encaissements/
- ✅ Squelette existant
- Reçoit `{ date, libelle, montant, compteDebit, compteCredit, journal }`
- Les valeurs comptables sont résolues côté client (via catalogue) avant l'envoi — snapshot

### 4.3 DELETE /api/encaissements/{id}
- ✅ Squelette existant
- Interdit si `exported = true`

---

## Epic 5 — Saisie (frontend)

### 5.1 Page Saisie — layout
- En-tête : date du jour, total de la session
- Section : catalogue de prestations (catégories en accordéon)
- Section : liste des encaissements du jour
- Section : saisie manuelle

### 5.2 Boutons de prestations
- Afficher les catégories avec leurs services
- Comportement selon le nombre de variantes :
  - **1 variante prix fixe** → tap → encaissement direct
  - **N variantes** → tap → modale picker de variante → encaissement
  - **Prix libre** → tap → modale saisie montant → encaissement
  - **Variante + prix libre** → modale picker + saisie montant

### 5.3 Résolution comptable côté front
- Au tap, résoudre `(compteDebit, compteCredit, journal)` via l'héritage :
  - `compteDebit` = `tenant.compteCaisse`
  - `compteCredit` = premier non-null : variant → service → category
  - `journal` = premier non-null : variant → service → category

### 5.4 Saisie manuelle
- Champs : libellé (texte libre), montant (CHF)
- Champs avancés (repliés par défaut) : compteCredit, journal (préremplis avec valeurs tenant)
- Bouton Ajouter → POST /api/encaissements/

### 5.5 Liste des encaissements du jour
- Afficher date, libellé, montant pour chaque encaissement
- Bouton supprimer (si pas exporté)
- Total en bas de liste

---

## Epic 6 — Export Winbiz (backend)

### 6.1 GET /api/exports/pending
- ✅ Squelette existant
- Retourne les encaissements non exportés, triés par date puis heure

### 6.2 POST /api/exports/
- ✅ Squelette existant
- Génère le CSV windows-1252 (colonnes : Date;N° Pièce;Cpte Débit;Cpte Crédit;Libellé;Montant;Journal)
- Sauvegarde `csvContent` en base
- Marque les encaissements comme `exported = true`
- Retourne les métadonnées de l'export

### 6.3 GET /api/exports/
- ✅ Squelette existant
- Liste des exports passés (sans csvContent)

### 6.4 GET /api/exports/{id}/download
- ✅ Squelette existant
- Retourne le fichier CSV en `windows-1252` avec header `Content-Disposition`

---

## Epic 7 — Export (frontend)

### 7.1 Page Export
- Afficher la liste des encaissements non exportés avec total
- Si liste vide : message "Rien à exporter"
- Bouton "Exporter vers Winbiz" → `POST /api/exports/` → télécharge le fichier CSV

### 7.2 Téléchargement du CSV
- Après POST, appeler `GET /api/exports/{id}/download`
- Déclencher le téléchargement navigateur via lien temporaire (`URL.createObjectURL` ou lien direct)

---

## Epic 8 — Historique (frontend)

### 8.1 Page Historique
- Liste des exports passés : date, nom de fichier, nb lignes, total CHF
- Bouton "Re-télécharger" → `GET /api/exports/{id}/download`

---

## Epic 9 — Admin (backend)

### 9.1 CRUD Tenants
- `GET /api/admin/tenants` — liste (super admin uniquement)
- `POST /api/admin/tenants` — créer un tenant
- `PUT /api/admin/tenants/{id}` — modifier nom et compteCaisse

### 9.2 Gestion utilisateurs
- `GET /api/admin/users?tenantId=` — liste filtrée par tenant
- `POST /api/admin/users` — créer un utilisateur avec mot de passe + tenantId

### 9.3 Import catalogue JSON
- `POST /api/admin/tenants/{tenantId}/import-catalogue`
- ✅ Squelette existant
- Supprime l'ancien catalogue, importe le nouveau
- Met à jour `compteCaisse` si fourni dans le JSON

---

## Epic 10 — Admin (frontend)

### 10.1 Page Admin — Tenants
- Liste des tenants (nom, compteCaisse)
- Formulaire créer / modifier un tenant
- Bouton supprimer (avec confirmation)

### 10.2 Page Admin — Utilisateurs
- Liste des utilisateurs par tenant
- Formulaire créer un utilisateur : email, mot de passe temporaire, tenant
- Sélecteur de tenant (dropdown)

### 10.3 Page Admin — Import catalogue
- Sélecteur de tenant
- Upload d'un fichier JSON
- Bouton "Importer" → `POST /api/admin/tenants/{id}/import-catalogue`
- Afficher le résultat (nb catégories importées, erreurs)

---

## Ordre d'implémentation suggéré

1. **Epic 1** — Migration + seed admin + login + auth guard
2. **Epic 2** (backend catalogue) + **Epic 3** (front catalogue)
3. **Epic 4** (backend saisie) + **Epic 5** (front saisie)
4. **Epic 6** (backend export) + **Epic 7** (front export)
5. **Epic 8** (front historique)
6. **Epic 9** (backend admin) + **Epic 10** (front admin)

---

## Notes techniques

### Encoding windows-1252
```csharp
// Dans Program.cs — déjà en place
Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
// Dans ExportEndpoints.cs
var encoding = Encoding.GetEncoding("windows-1252");
```

### Format CSV Winbiz
```
Date;N° Pièce;Cpte Débit;Cpte Crédit;Libellé;Montant;Journal
01.05.2026;1;1010;3022;Coupe homme;25.00;VE
```

### Format JSON import catalogue
```json
{
  "tenant": { "compteCaisse": "1010" },
  "categories": [
    {
      "label": "Hommes",
      "compteCredit": "3022",
      "journal": "VE",
      "services": [
        { "code": "010", "name": "Coupe homme", "price": 25 },
        {
          "code": "020", "name": "Brushing",
          "variants": [
            { "name": "AVS", "code": "020", "price": 35 },
            { "name": "Normal", "code": "021", "price": 36 }
          ]
        },
        { "code": "033", "name": "Mèches papiers", "variable": true }
      ]
    }
  ]
}
```

### Sécurité multi-tenant
- Toutes les requêtes API scopées au `tenant_id` extrait du JWT
- `HttpContextExtensions.GetTenantId()` lève une exception si manquant
- `RequireSuperAdmin()` vérifie le claim `is_super_admin = true`

### Variables d'environnement requises
| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_KEY` | Clé secrète JWT (min. 32 caractères) |
| `ADMIN_EMAIL` | Email du super admin initial |
| `ADMIN_PASSWORD` | Mot de passe du super admin initial |
