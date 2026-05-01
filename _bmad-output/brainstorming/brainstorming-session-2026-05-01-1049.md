---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: "Conception d'une vraie application à partir du POC Ça décoiffe"
session_goals: "Explorer fonctionnalités, architecture, UX et modèle de données pour passer du POC HTML monofichier à une application complète et configurable"
selected_approach: 'ai-recommended'
techniques_used: ['question-storming', 'scamper', 'six-thinking-hats']
ideas_generated: [12]
context_file: ''
workflow_completed: true
---

# Brainstorming Session Results

**Facilitateur :** Romain
**Date :** 2026-05-01

## Vue d'ensemble de la session

**Sujet :** Conception d'une vraie application à partir du POC *Ça décoiffe*
**Objectifs :** Explorer fonctionnalités, architecture, UX et modèle de données pour passer du POC HTML monofichier à une application complète et configurable

## Sélection des techniques

**Approche :** Recommandation IA
**Contexte :** POC HTML monofichier (salon de coiffure, prestations CHF, sync JSONBin, export Winbiz) → vraie app

**Techniques recommandées :**
- **Question Storming** : Cartographier le vrai périmètre avant de concevoir
- **SCAMPER** : Faire évoluer chaque élément du POC systématiquement
- **Six Thinking Hats** : Évaluer les décisions clés sous 6 angles

**Raisonnement IA :** Séquence optimale pour une phase de conception — explorer le quoi (Question Storming), générer des idées concrètes à partir de l'existant (SCAMPER), puis valider les choix (Six Thinking Hats)

---

## Technique 1 — Question Storming : Résultats

### Contexte du POC actuel

Le POC est un fichier HTML unique gérant :
- Un catalogue de prestations (catégories → items)
- 3 types de tarification : **prix fixe**, **double variante AVS/Normal** (tarif social suisse), **prix libre** (variable)
- Chaque item a un code comptable Winbiz (parfois dual ex: `020/021` pour AVS/Normal)
- Sync JSONBin + localStorage
- Export CSV/Winbiz

### Ce qui manque (identifié par Romain)

1. **Authentification** — login utilisateur
2. **Base de données** — pour persister : config des prestations, prestations encaissées, historique des exports
3. **Gestion des prestations** — modifier prix, noms, catégories, variantes, codes comptables Winbiz

### Vision produit clarifiée

- **Pas de rôles** — tous les utilisateurs ont les mêmes droits, on reste simple
- **Multi-tenant** — plusieurs organisations indépendantes sur la même plateforme
- **Générique** — pas juste pour coiffeurs, n'importe quel prestataire de services avec export comptable
- **Historique exports** — possibilité de rejouer un export pour une période donnée
- **Petit outil SaaS léger** — pas de surenchère fonctionnelle

### Questions clés ouvertes

- Les variantes de prix (AVS/Normal) sont-elles un concept fixe de l'app ou configurables par tenant ?

---

## Technique 2 — SCAMPER : En cours

### S — Substitute (Substituer)

**[Infra #1]** : JSONBin → vraie base de données persistante (PostgreSQL)
**[Config #1]** : Variantes de prix génériques et configurables (pas AVS/Normal en dur)
- _Concept_ : Une prestation peut avoir N variantes (nom + prix fixe ou libre + code Winbiz). AVS/Normal n'est qu'un cas particulier.
- _Novelty_ : Rend l'app utilisable par n'importe quel secteur (kiné, plombier, coach...)

### C — Combine (Combiner)

**Décision :** Pas de notion de client — on reste sur les prestations encaissées anonymement. Simplicité assumée.

### R — Reverse (Inverser)

**Hors scope explicite :** analytics, notifications, rapports, gestion de stock, tableaux de bord.
L'outil fait une chose bien : **encaisser des prestations et exporter vers Winbiz**.

---

## Technique 3 — Six Thinking Hats : En cours

### 🎯 Décisions clés à évaluer

**Stack :** API .NET + React + PostgreSQL + Docker (DB incluse)

### 🎩 Blanc — Faits

- API .NET (probablement ASP.NET Core minimal API ou controllers)
- Front React (SPA)
- PostgreSQL en Docker
- Multi-tenant → isolation des données par tenant_id
- Export CSV windows-1252
- Auth nécessaire (pas de rôles)

### 🎩 Jaune — Bénéfices

- Docker → déploiement reproductible, onboarding simple
- PostgreSQL → JSONB possible pour stocker le CSV exporté en blob ou colonne text
- .NET → typage fort, bon pour la logique d'héritage comptable
- React → UI dynamique adaptée au picker de variantes

### 🎩 Noir — Risques

- Multi-tenant sans rôles : attention à l'isolation — chaque requête API doit être scopée au tenant de l'utilisateur connecté
- windows-1252 : encoding à gérer côté API à l'export, pas trivial en .NET (faut register les encodings legacy)
- PostgreSQL dans Docker pour prod : OK pour commencer, à migrer vers managed DB plus tard

### 🎩 Vert — Idées créatives

- **[Arch #1]** : Tenant résolu via JWT claim — chaque token contient le tenant_id, pas besoin de le passer dans les URLs
- **[Arch #2]** : Le CSV exporté stocké en `text` dans PostgreSQL — simple, pas de filesystem

### 🎩 Bleu — Prochaines étapes suggérées

---

## Ajout hors SCAMPER — Super Admin

**[Auth #1]** : Deux niveaux d'accès
- _Concept_ :
  - **Super admin** (Romain) : gère la plateforme — CRUD tenants, création d'accès utilisateurs, import JSON catalogue
  - **Utilisateur tenant** : saisie + export uniquement dans son tenant
- _Novelty_ : Pas de rôles complexes dans un tenant — juste un flag `is_super_admin` au niveau utilisateur

**[Admin #2]** : Format JSON d'import du catalogue (format canonique)
```json
{
  "tenant": { "compteCaisse": "1010" },
  "categories": [
    {
      "label": "Hommes",
      "compteCredit": "3022",
      "journal": "VE",
      "services": [
        { "code": "010", "name": "Coupe homme", "subtitle": "dès 20 ans", "price": 25 },
        {
          "code": "020", "name": "Brushing + shampooing",
          "variants": [
            { "name": "AVS", "code": "020", "price": 35 },
            { "name": "Normal", "code": "021", "price": 36 }
          ]
        },
        { "code": "033", "name": "Mèches papiers", "subtitle": "2.50 / pièce", "variable": true }
      ]
    }
  ]
}
```
Règles : `price` = variante fixe unique, `variable: true` = saisie libre, `variants[]` = picker nommé. Héritage comptable : catégorie → service → variante.

**[UX #2]** : Chips AVS/Standard/Prix libre → remplacés par variantes génériques configurées
- _Concept_ : L'UI s'adapte dynamiquement au nombre de variantes. 1 variante fixe = tap direct. N variantes = picker avec les noms configurés. Prix libre = saisie montant.
- _Novelty_ : Aucune logique spécifique AVS dans le front — juste des variantes nommées.

**[Config #3]** : Saisie manuelle avec config comptable
- _Concept_ : La saisie manuelle (libellé libre + montant) permet aussi de choisir/overrider compte crédit + journal. Valeurs par défaut = celles du tenant.
- _Novelty_ : Cohérence totale du modèle — tout passe par le même pipeline comptable.

**[Export #1]** : Stockage du CSV en base + re-téléchargement
- _Concept_ : À l'export, le fichier CSV généré est sauvegardé en base (contenu brut). L'historique permet de re-télécharger exactement le même fichier.
- _Novelty_ : Pas de recalcul à rejouer — le fichier est immuable une fois exporté, ce qui garantit la cohérence comptable.

**Format CSV Winbiz :**
```
Date;N° Pièce;Cpte Débit;Cpte Crédit;Libellé;Montant;Journal
01.05.2026;1;1010;3022;Coupe homme;25.00;VE
```
- Encodage : `windows-1252`
- N° Pièce : séquentiel au sein de l'export
- Cpte Débit : compte caisse (tenant)
- Cpte Crédit : compte produit (catégorie → prestation → variante)

**[UX #1]** : 3 écrans principaux — Saisie / Export / Historique
- _Concept_ :
  - **Saisie** : vue du jour, encaisser une prestation
  - **Export** : toutes les prestations non encore exportées (multi-jours possible), action "Exporter → Winbiz"
  - **Historique** : liste des exports passés avec bouton "Relancer l'export"
- _Novelty_ : Pas de notion de "session" complexe — juste un statut `exporté / en attente` sur chaque prestation. Simple et robuste.

**[Config #2]** : Configuration comptable Winbiz par héritage
- _Concept_ : Cascade tenant → catégorie → prestation → variante. Chaque niveau peut surcharger le niveau supérieur.
  - **Tenant** : compte caisse (ex: 1010)
  - **Catégorie** : compte de produit + journal (ex: 3022 / VE)
  - **Prestation** : override optionnel
  - **Variante** : override optionnel
- _Novelty_ : Permet une config simple pour 90% des cas, précise pour les exceptions sans complexifier l'UI courante

---

## Synthèse — Vision produit complète

### Positionnement

**Petit outil SaaS léger** de caisse + export comptable configurable.
Pas juste pour coiffeurs — n'importe quel prestataire de services avec export Winbiz.

**Hors scope :** analytics, notifications, rapports, gestion de stock, tableau de bord.

---

### Modèle de données

```
Tenant
  ├── compteCaisse (ex: "1010")
  ├── Users[]
  ├── Categories[]
  │     ├── label
  │     ├── compteCredit (ex: "3022")
  │     ├── journal (ex: "VE")
  │     └── Services[]
  │           ├── code, name, subtitle
  │           ├── compteCredit? (override)
  │           ├── journal? (override)
  │           └── Variants[]
  │                 ├── name (ex: "AVS", "Normal", "Adulte"...)
  │                 ├── price (number | null si variable)
  │                 ├── variable (bool)
  │                 ├── code? (code Winbiz, override)
  │                 ├── compteCredit? (override)
  │                 └── journal? (override)
  ├── Encaissements[]
  │     ├── date, libelle, montant
  │     ├── compteDebit (résolu au moment de la saisie)
  │     ├── compteCredit (résolu au moment de la saisie)
  │     ├── journal (résolu au moment de la saisie)
  │     └── exported (bool)
  └── Exports[]
        ├── createdAt
        ├── filename
        ├── csvContent (text, stocké en base)
        └── encaissementIds[]

User
  ├── email, passwordHash
  ├── tenantId
  └── isSuperAdmin (bool)
```

**Règle d'héritage comptable :** variante → service → catégorie → tenant (premier non-null remonte la chaîne)

---

### Écrans utilisateur tenant

| Écran | Description |
|-------|-------------|
| **Connexion** | Login simple (email + mot de passe) |
| **Saisie** | Catalogue du jour — boutons par catégorie, picker de variante si N variantes, saisie montant si variable. + saisie manuelle (libellé + montant + compte/journal overridable). Liste des encaissements du jour + total. |
| **Export** | Liste de tous les encaissements non exportés (multi-jours). Bouton "Exporter → Winbiz" → génère CSV windows-1252, sauvegarde en base, télécharge. |
| **Historique** | Liste des exports passés (date, nb lignes, total). Bouton "Re-télécharger" par export. |
| **Catalogue** | CRUD catégories, services, variantes. Config comptable par niveau. |

---

### Écrans super admin (Romain uniquement)

| Écran | Description |
|-------|-------------|
| **Tenants** | Liste des clients. Créer / modifier / désactiver un tenant. |
| **Utilisateurs** | Créer des accès pour un tenant (email + mot de passe temporaire). |
| **Import catalogue** | Uploader un fichier JSON pour initialiser/remplacer le catalogue d'un tenant. Format canonique défini. |

---

### Format JSON d'import catalogue

```json
{
  "tenant": { "compteCaisse": "1010" },
  "categories": [
    {
      "label": "Hommes",
      "compteCredit": "3022",
      "journal": "VE",
      "services": [
        { "code": "010", "name": "Coupe homme", "subtitle": "dès 20 ans", "price": 25 },
        {
          "code": "020", "name": "Brushing + shampooing",
          "variants": [
            { "name": "AVS", "code": "020", "price": 35 },
            { "name": "Normal", "code": "021", "price": 36 }
          ]
        },
        { "code": "033", "name": "Mèches papiers", "subtitle": "2.50 / pièce", "variable": true }
      ]
    }
  ]
}
```

---

### Format CSV Winbiz

```
Date;N° Pièce;Cpte Débit;Cpte Crédit;Libellé;Montant;Journal
01.05.2026;1;1010;3022;Coupe homme;25.00;VE
```
- Encodage : `windows-1252`
- N° Pièce : séquentiel au sein de l'export
- Valeurs comptables : résolues au moment de la saisie (snapshot)

---

### Stack technique

| Couche | Technologie |
|--------|-------------|
| API | ASP.NET Core |
| Front | React (SPA) |
| DB | PostgreSQL |
| Auth | JWT avec claim `tenant_id` + `is_super_admin` |
| Déploiement | Docker Compose (API + front + PostgreSQL) |

**Points d'attention :**
- Toutes les requêtes API scopées au `tenant_id` du JWT
- Encoding `windows-1252` : `Encoding.RegisterProvider(CodePagesEncodingProvider.Instance)` côté .NET
- CSV exporté stocké en colonne `text` PostgreSQL (pas de filesystem)

---

### Prochaines étapes suggérées

1. **Modèle de données SQL** — définir les tables PostgreSQL
2. **API endpoints** — CRUD catalogue, encaissements, export, auth
3. **Wireframes** — les 4 écrans tenant + 3 écrans admin
4. **Projet .NET + React** — scaffolding initial avec Docker Compose
