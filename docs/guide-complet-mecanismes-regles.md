# Guide Complet - Mécanismes et Règles de Credit Castor

> **Version actuelle** : 1.37.0
> **Dernière mise à jour** : 2025-11-15
> **Statut** : ✅ Complet et à jour

> **📚 Navigation Documentation**
> Ce document fait partie d'un ensemble de 3 guides complémentaires. Voir [`README-REGLES-METIERS.md`](./README-REGLES-METIERS.md) pour la navigation complète.

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Mécanisme de Redistribution Copropriété](#mécanisme-de-redistribution-copropriété)
3. [Calculs Portage](#calculs-portage)
4. [Calculs Financiers Participants](#calculs-financiers-participants)
5. [Gestion des Participants](#gestion-des-participants)
6. [Gestion des Lots](#gestion-des-lots)
7. [Financement à Deux Prêts](#financement-à-deux-prêts)
8. [Frais Généraux Dynamiques](#frais-généraux-dynamiques)
9. [Travaux Communs](#travaux-communs)
10. [Calculs Nouveaux Arrivants](#calculs-nouveaux-arrivants)
11. [Gestion des Espaces Partagés](#gestion-des-espaces-partagés)
12. [Machine d'État](#machine-détat)
13. [Intégration Calculateur](#intégration-calculateur)

---

## Vue d'ensemble

Credit Castor est une application de calcul pour projets de division immobilière en Wallonie, Belgique. Elle gère :

- **Division équitable** des coûts entre participants fondateurs
- **Système de portage** permettant aux fondateurs de conserver des lots en attendant des acheteurs
- **Ventes copropriété** avec redistribution proportionnelle aux participants existants
- **Calculs financiers** complets (achat, construction, frais, financement)
- **Financement flexible** (prêt unique ou double prêt)
- **Gestion des espaces partagés** avec trois modèles de gouvernance (solidaire, commercial, quota)

> **📚 Documentation Complémentaire**
> - **Diagrammes visuels** : [`docs/regles-metiers-diagrammes-pedagogiques.md`](./regles-metiers-diagrammes-pedagogiques.md)
> - **Cas d'usage** : [`docs/cas-usage-flux-decision.md`](./cas-usage-flux-decision.md)
> - **Guide navigation** : [`docs/README-REGLES-METIERS.md`](./README-REGLES-METIERS.md)

---

## Mécanisme de Redistribution Copropriété

> **📊 Visualisation** : Voir [`regles-metiers-diagrammes-pedagogiques.md` - Section 3](./regles-metiers-diagrammes-pedagogiques.md#3-mécanisme-de-redistribution-copropriété) pour les diagrammes visuels

### Principe

Lorsqu'un nouveau venu achète un lot de la copropriété, son paiement est automatiquement redistribué à **tous les participants existants** (fondateurs + nouveaux arrivants précédents) en fonction de leur **quotité** (part de propriété).

### Calcul de la Quotité

La quotité représente la part de propriété de chaque participant dans le bâtiment :

```
Quotité = (Surface du participant) / (Surface totale à la date de vente, incluant l'acheteur)
```

**Important** : Le dénominateur inclut la surface de l'acheteur pour calculer le prix, mais l'acheteur ne reçoit pas de redistribution.

### Calcul du Prix d'Achat Nouveau Venu

Pour un nouveau venu achetant de la copropriété :

1. **Quotité** = surface nouvelle venue / surface totale (incluant lui-même)
2. **Prix de base** = quotité × coût total du projet
3. **Indexation** = prix de base × [(1 + taux_indexation/100)^années_tenues - 1]
   - Taux par défaut : 2% par an (composé)
   - Années tenues = date acte transcription (T0) → date entrée nouveau venu
4. **Récupération frais de portage** = frais de portage × quotité
   - Intérêts du prêt, taxes, assurances
5. **Prix total** = prix de base + indexation + récupération frais de portage

### Répartition du Paiement

- **30%** → Réserves copropriété (pour entretien/réparations du bâtiment)
- **70%** → Redistribution aux participants existants (proportionnelle à la quotité)

### Formula de Redistribution

Chaque participant existant reçoit :

```
Montant reçu = 70% du paiement × (Quotité du participant)

où:
Quotité participant = (Surface participant) / (Surface totale à la date de vente, incluant l'acheteur)
```

### Nature Récursive

Quand un nouveau venu Gen 2 arrive :
- Les nouveaux arrivants Gen 1 reçoivent également une redistribution (aux côtés des fondateurs)
- Les quotités se diluent au fur et à mesure que la surface totale augmente
- Chaque nouvelle vente profite à tous les co-propriétaires existants proportionnellement

### Exemple

**Situation initiale :**
- Fondateur Alice : 200 m²
- Nouveau venu Bob : 50 m²
- Total : 250 m²

**Charlie achète 50 m² de la copro pour 40,000€ :**

**Quotité de Charlie** : 50 / (200 + 50 + 50) = 16.67%

**Répartition du paiement :**
- Réserves copro : 12,000€ (30%)
- Participants : 28,000€ (70%)

**Redistribution :**
- Alice : 200/(200+50+50) = 66.67% → 18,667€
- Bob : 50/(200+50+50) = 16.67% → 4,667€
- Charlie : Inclus au dénominateur mais ne reçoit rien (il est l'acheteur)

---

## Calculs Portage

> **📊 Visualisation** : Voir [`regles-metiers-diagrammes-pedagogiques.md` - Section 4](./regles-metiers-diagrammes-pedagogiques.md#4-calculs-de-portage) pour les diagrammes visuels

### Principe

Le portage permet aux fondateurs de conserver des lots pendant une période d'attente avant de les vendre à des nouveaux venus. Le prix de vente inclut la récupération des coûts de portage (intérêts, taxes, assurances).

### Formula de Prix Portage

```
Prix total = Coût base + Indexation + Frais de portage + Rénovations
```

#### Coût Base

```
Coût base = Prix d'achat + Frais notaire + Coûts construction
```

#### Indexation

```
Indexation = Coût base × [(1 + taux_indexation/100)^années_tenues - 1]
```

- Taux par défaut : 2% par an (composé)
- Années tenues : de la date d'acquisition à la date de vente

#### Frais de Portage (Coûts de Portage)

Frais mensuels accumulés pendant la période de portage :

- **Intérêts du prêt** : (Montant prêt × taux_intérêt) / 12
- **Taxe propriété inoccupée** : €388.38 / an → €32.36 / mois
- **Assurance bâtiment** : €2,000 / an (partagée) → €166.67 / mois
- **Frais syndic** : variables
- **Charges communes** : variables

**Total frais de portage** = (Intérêts + Taxe + Assurance + Syndic + Charges) × nombre_mois × taux_récupération

Taux de récupération par défaut : 100%

### Exemple

Lot de 100 m² acquis pour 100,000€ :
- Frais notaire : 12,500€ (12.5%)
- Construction : 40,000€
- **Coût base** : 152,500€

Portage de 2.5 ans :
- **Indexation** : 152,500 × [(1.02)^2.5 - 1] = 7,686€
- **Frais de portage** : (500 + 32.36 + 166.67) × 30 mois = 20,980€

**Prix de vente** : 152,500 + 7,686 + 20,980 = 181,166€

---

## Calculs Financiers Participants

### Composants du Coût Total

Chaque participant a un coût total composé de :

1. **Part d'achat** : Surface × prix au m² (ou calcul quotité pour nouveaux venus)
2. **Droit d'enregistrement** : Part d'achat × taux (3% ou 12.5%)
3. **Frais notaire fixes** : €5,000 par unité
4. **Coûts construction** :
   - CASCO (coque) : surface × prix CASCO/m²
   - Parachèvements (finition) : surface × prix parachèvements/m²
5. **Frais partagés** :
   - Frais généraux 3 ans (distribués équitablement)
   - Travaux communs (distribués équitablement)

### Calcul Prêt

**Montant prêt** = Coût total - Capital apporté

**Mensualité** : Utilise la fonction PMT (amortissement)

```
Mensualité = Montant prêt × [taux_mensuel × (1 + taux_mensuel)^durée] / [(1 + taux_mensuel)^durée - 1]

où:
taux_mensuel = taux_annuel / 12
durée = nombre_mois (durée_années × 12)
```

### Ratio de Financement

```
Ratio = Montant prêt / Coût total
```

---

## Gestion des Participants

### Ajout d'un Participant

Un participant peut être :
- **Fondateur** : Entré à la date d'acte (T0)
- **Nouveau venu** : Entré après T0

**Champs obligatoires :**
- Nom
- Date d'entrée
- Surface (m²)
- Capital apporté
- Taux d'intérêt
- Durée prêt (années)

**Champs optionnels :**
- Surface personnalisée pour CASCO/parachèvements
- Prix CASCO/parachèvements personnalisés
- Détails d'achat (si nouveau venu)
- Financement double prêt

### Mise à Jour Participant

Un participant peut être mis à jour à tout moment :
- Modifier les champs financiers
- Ajouter/modifier lots
- Modifier configuration financement
- Activer/désactiver participant (exclut des calculs)

### Suppression Participant

Un participant peut être supprimé, mais cela affecte tous les calculs existants.

---

## Gestion des Lots

### Types de Lots

1. **Lot fondateur** : Acquis initialement par un fondateur
2. **Lot copropriété** : Partie commune du bâtiment (lots cachés)
3. **Lot portage** : Lot détenu par fondateur en attente de vente

### Ajout d'un Lot

Un lot nécessite :
- ID unique
- Surface (m²)
- Origine (fondateur ou copropriété)
- Statut (disponible, réservé, vendu, caché)
- Détails d'acquisition (si applicable)

### Marquer Lot comme Portage

Un lot fondateur peut être marqué comme "portage" :
- Permet la vente avec récupération frais de portage
- Le lot reste propriété du fondateur jusqu'à la vente
- Les frais de portage s'accumulent automatiquement

### Mise à Jour Acquisition Lot

Les détails d'acquisition d'un lot incluent :
- Date d'acquisition
- Coût total (achat + notaire + construction)
- Part d'achat
- Frais d'enregistrement
- Coûts construction
- Frais communs

---

## Financement à Deux Prêts

> **📊 Visualisation** : Voir [`regles-metiers-diagrammes-pedagogiques.md` - Section 6](./regles-metiers-diagrammes-pedagogiques.md#6-financement-simple-vs-double-prêt) pour les diagrammes comparatifs

### Principe

Permet de séparer le financement de l'achat du financement des rénovations.

### Prêt 1 (Achat + Frais)

- **Couvre** : Part d'achat + frais d'enregistrement + frais notaire + frais partagés
- **Démarre** : Immédiatement
- **Durée** : Durée du participant (ex. 25 ans)
- **Capital** : `capitalForLoan1` ou portion de `capitalApporte`

### Prêt 2 (Rénovation)

- **Couvre** : CASCO + parachèvements (portion spécifiée dans `loan2RenovationAmount`)
- **Démarre** : Après `loan2DelayYears` (défaut : 2 ans)
- **Durée** : Calculée selon le montant restant (typiquement plus courte)
- **Capital** : `capitalForLoan2` ou reste de `capitalApporte`

### Mensualités

- **Avant Prêt 2** : Seule la mensualité Prêt 1
- **Après Prêt 2** : Mensualité Prêt 1 + Mensualité Prêt 2

### Exemple

Participant avec coût total 470,000€, capital 50,000€ :
- **Prêt 1** : 350,000€ (achat + frais), mensualité 1,900€, 25 ans
- **Prêt 2** : 70,000€ (rénovation), démarre après 2 ans, mensualité 600€, 15 ans

**Mensualité première période** : 1,900€
**Mensualité après 2 ans** : 1,900€ + 600€ = 2,500€

---

## Frais Généraux Dynamiques

### Principe

Les frais généraux sont calculés dynamiquement en fonction des coûts CASCO totaux du projet.

### Calcul

#### 1. CASCO Total HORS TVA

Somme de :
- CASCO de tous les participants (surfaces × prix CASCO/m²)
- CASCO des travaux communs (si activé)

**Important** : Exclut la TVA pour le calcul des honoraires.

#### 2. Honoraires (Frais Professionnels)

```
Honoraires totaux 3 ans = CASCO HORS TVA × 15% × 30%
Honoraires annuels = Honoraires totaux / 3
```

Représente : architectes, experts stabilité, bureaux d'études, PEB, etc.

#### 3. Frais Récurrents Annuels

- **Précompte immobilier** : €388.38/an
- **Comptable** : €1,000/an
- **Abonnement Podio** : €600/an
- **Assurance bâtiment** : €2,000/an
- **Frais de réservation** : €2,000/an
- **Imprévus** : €2,000/an

**Total récurrent** : €7,988.38/an

#### 4. Total Frais Généraux

```
Total annuel = Honoraires annuels + Frais récurrents annuels
Total 3 ans = Total annuel × 3
```

### Répartition

Les frais généraux sont répartis équitablement entre tous les participants actifs :

```
Frais par participant = Total frais généraux / Nombre de participants
```

---

## Travaux Communs

### Principe

Travaux communs (communs à tous les participants) avec distribution équitable des coûts.

### Configuration

Les travaux communs sont configurables par **lignes d'items** :

Chaque item inclut :
- **Libellé** : Description (ex. "Escaliers communs")
- **Surface** : m² concernés
- **Prix CASCO/m²** : Prix de construction coque
- **Prix parachèvements/m²** : Prix de finition

**Montant item** = (Surface × Prix CASCO/m²) + (Surface × Prix parachèvements/m²)

### Total Travaux Communs

```
Total = Somme de tous les items
```

### Répartition

Distribution équitable :

```
Montant par participant = Total travaux communs / Nombre de participants
```

### Exemple

Escaliers communs : 20 m²
- CASCO : 400€/m² → 8,000€
- Parachèvements : 500€/m² → 10,000€
- **Total** : 18,000€

Avec 3 participants : **6,000€ par participant**

---

## Calculs Nouveaux Arrivants

### Achat depuis Fondateur (Portage)

Nouveau venu achète un lot en portage d'un fondateur :

1. **Prix portage** calculé selon formule portage (voir section Portage)
2. **Redistribution** : 100% du prix au fondateur vendeur (pas de redistribution copropriété)
3. **Quotité nouveau venu** : Calculée normalement (surface / surface totale)

### Achat depuis Copropriété

Nouveau venu achète un lot de la copropriété :

1. **Prix calculé avec quotité** (voir section Redistribution Copropriété)
2. **Répartition** : 30% réserves + 70% redistribution
3. **Quotité nouveau venu** : Incluse dans dénominateur pour calculer redistribution aux autres

### Détails d'Achat

Pour chaque nouveau venu, les détails d'achat incluent :
- **Vendu par** : Nom du fondateur ou "Copropriété"
- **Prix d'achat** : Prix total payé
- **Décomposition** :
  - Prix de base
  - Indexation
  - Récupération frais de portage
  - Récupération frais (si applicable)
  - Rénovations (si applicable)

---

## Gestion des Espaces Partagés

### Principe

Les espaces partagés permettent aux habitants d'utiliser des infrastructures collectives (ateliers, salles communes, jardins partagés) selon différents modèles de gouvernance adaptés à l'intensité d'usage (personnel vs professionnel).

### Types d'Espaces Partagés

- **atelier_bois** : Atelier de menuiserie/ébénisterie
- **atelier_general** : Atelier polyvalent
- **salle_commune** : Salle de réunion/événements
- **buanderie** : Buanderie collective
- **jardin_partage** : Jardin potager/agrément
- **atelier_artiste** : Studio artistique
- **cuisine_collective** : Cuisine partagée
- **autre** : Autre type d'espace

### Trois Modèles de Gouvernance

Le système propose **3 modèles de gouvernance** inspirés de pratiques réelles d'habitats groupés :

#### 1. Modèle SOLIDAIRE (Collectif)

**Principe** : L'espace appartient au collectif et est géré solidairement.

**Caractéristiques** :
- L'espace est porté par l'ACP/collectif (non par un individu)
- Un opérateur (résident) gère l'espace au nom du collectif
- Les revenus alimentent les réserves collectives
- Les risques sont partagés par le collectif
- Nécessite un **vote communautaire** pour approbation

**Rémunération opérateur** :
- Rémunéré (montant mensuel fixe)
- Valorisé (points de valorisation bénévole)
- Aucune (entièrement bénévole)

**Revenus** :
- 100% → Réserves copropriété (par défaut)
- Option : Répartition partielle à l'opérateur

**Accès résidents** :
- Gratuit
- Prix coûtant
- Subventionné

**Exemple** : Atelier bois collectif géré par un habitant menuisier, payé 500€/mois par le collectif. Les revenus externes (formations, location ponctuelle) vont à 100% dans les réserves de l'ACP.

---

#### 2. Modèle COMMERCIAL (Location)

**Principe** : L'ACP loue l'espace à un résident comme locataire commercial.

**Caractéristiques** :
- Contrat de location commercial distinct du bail résidentiel
- Tarification complète (coûts réels + marge)
- Le locataire paie taxes/TVA normalement
- Assurance professionnelle séparée obligatoire
- Nécessite un **vote communautaire** pour approbation

**Contrat de location** :
- Loyer mensuel
- Charges mensuelles
- Dépôt de garantie
- Durée du contrat
- Conditions de renouvellement

**Décomposition des coûts** (transparence) :
- Coût de base (part proportionnelle du bâtiment)
- Coûts opérationnels (électricité, chauffage, entretien)
- Assurance professionnelle
- Marge ACP
- **Total mensuel**

**Implications fiscales** :
- Le locataire doit déclarer ses revenus
- TVA applicable selon activité
- Assurance RC professionnelle requise

**Revenus** :
- 100% → Compte ACP (loyer comme revenu locatif)

**Exemple** : Menuisier habitant loue un atelier 60m² pour 800€/mois (dont 500€ coût base + 200€ charges + 50€ assurance + 50€ marge). Usage intensif (120 jours/an) pour activité commerciale.

---

#### 3. Modèle QUOTA (Usage Équitable)

**Principe** : Chaque résident dispose d'un quota annuel d'usage, avec tarification progressive.

**Caractéristiques** :
- Usage personnel : Quota de 30-40 jours/an
- Usage professionnel : Quota de 30-40 jours/an (séparé)
- Au-delà du quota → Tarification commerciale
- Calendrier partagé transparent
- **Auto-approbation** pour usage personnel (pas de vote)
- Vote possible pour usage professionnel intensif

**Quotas annuels** :
```
Quota personnel : 40 jours/an
Quota professionnel : 30 jours/an
```

**Tarification progressive** :
```
Usage personnel dans quota : 10€/jour (prix coûtant)
Usage professionnel dans quota : 20€/jour (prix coûtant+)
Au-delà quota : 50€/jour (tarif commercial)
```

**Règles de réservation** :
- Maximum jours consécutifs : 7 jours
- Réservation à l'avance : 30 jours
- Politique d'annulation : 48h de préavis
- Priorité activités collectives : Oui

**Revenus** :
- 70% → Compte ACP
- 30% → Redistribution aux participants (selon quotité)

**Exemple** : Habitant utilise l'atelier 35 jours dans l'année pour ses projets personnels. Coût : 35 jours × 10€ = 350€. S'il dépasse et utilise 45 jours, les 5 jours supplémentaires coûtent 50€/jour = 250€ additionnels.

---

### Calculs de Tarification

#### Modèle Solidaire

**Tarif résidents** :
- Gratuit OU
- Prix coûtant : `(Σ coûts opérationnels mensuels) / 30 jours`

**Exemple** :
```
Coûts mensuels : 150€ électricité + 200€ chauffage + 100€ entretien + 80€ assurance + 70€ divers = 600€
Prix coûtant/jour : 600€ / 30 = 20€/jour
```

#### Modèle Commercial

**Tarif journalier** :
```
Tarif/jour = Loyer mensuel / 30 jours
```

**Exemple** :
```
Loyer : 800€/mois
Usage 20 jours : (800€ / 30) × 20 = 533€
```

#### Modèle Quota

**Calcul avec dépassement** :
```
Si usage ≤ quota :
  Coût = jours × tarif_dans_quota

Si usage > quota :
  Jours_dans_quota = quota_restant
  Jours_hors_quota = usage - quota_restant
  Coût = (Jours_dans_quota × tarif_dans_quota) + (Jours_hors_quota × tarif_commercial)
```

**Exemple avec dépassement** :
```
Quota restant : 5 jours
Usage demandé : 15 jours
Tarif dans quota : 10€/jour
Tarif hors quota : 50€/jour

Coût = (5 × 10€) + (10 × 50€) = 50€ + 500€ = 550€
```

---

### Redistribution des Revenus

#### Modèle Solidaire
```
100% des revenus → Réserves copropriété (acpBankAccount)
```

#### Modèle Commercial
```
100% des revenus → Compte ACP (acpBankAccount)
```

#### Modèle Quota
```
70% → Compte ACP (acpBankAccount)
30% → Redistribution aux participants selon quotité

Montant participant = 30% × revenus × (surface_participant / surface_totale)
```

**Exemple redistribution quota** :
```
Revenus collectés : 1,000€
70% ACP : 700€
30% participants : 300€

Participant Alice (200m² / 500m² total) : 300€ × 0.40 = 120€
Participant Bob (150m² / 500m² total) : 300€ × 0.30 = 90€
Participant Carol (150m² / 500m² total) : 300€ × 0.30 = 90€
```

---

### Gestion des Quotas

#### Reset Annuel
Les quotas sont réinitialisés chaque année (1er janvier) :
```
quota_used = 0
quota_remaining = quota_annuel (40j perso ou 30j pro)
days_used_this_year = 0
```

#### Suivi en Temps Réel
Chaque réservation met à jour :
- `daysUsedThisYear` : Total jours utilisés cette année
- `quotaUsed` : Jours consommés du quota
- `quotaRemaining` : Jours restants dans le quota

#### Alertes de Dépassement
Quand `quotaUsed > quota_annuel` :
- **Alerte automatique** générée
- État machine → `quota_exceeded`
- **Options** :
  1. Payer le tarif commercial pour les jours hors quota
  2. Proposer transition vers modèle commercial (nécessite vote)
  3. Attendre le reset annuel

---

### Alertes et Conformité

Le système génère des alertes pour :

#### 1. Dépassement Quota
- **Type** : `quota_exceeded`
- **Sévérité** : Warning
- **Action requise** : Paiement hors quota ou transition modèle

#### 2. Problème Assurance
- **Type** : `insurance_issue`
- **Sévérité** : Critical
- **Action requise** : Souscription assurance professionnelle (modèle commercial)

#### 3. Conformité Fiscale
- **Type** : `tax_compliance`
- **Sévérité** : Critical
- **Action requise** : Déclaration fiscale obligatoire

#### 4. Conflit d'Intérêt
- **Type** : `conflict_of_interest`
- **Sévérité** : Warning
- **Action requise** : Vote communautaire pour résolution

#### 5. Sur-Utilisation
- **Type** : `over_usage`
- **Sévérité** : Info
- **Action requise** : Discussion sur équité d'accès

---

### Transitions entre Modèles

#### Quota → Commercial
**Déclencheur** : Dépassement répété du quota

**Processus** :
1. Alerte de dépassement quota
2. Participant propose transition vers commercial
3. Vote communautaire requis
4. Si approuvé : Passage au modèle commercial
5. Nouvelle configuration : loyer, charges, assurance

**Avantages** :
- Clarté légale et fiscale
- Usage illimité de l'espace
- Revenus stables pour l'ACP

**Inconvénients** :
- Coût plus élevé pour l'utilisateur
- Obligations fiscales et assurances
- Moins d'intégration collective

#### Commercial → Solidaire
**Déclencheur** : Volonté de collectiviser l'activité

**Processus** :
1. Locataire propose de transformer en activité collective
2. Élaboration nouveau modèle solidaire
3. Vote communautaire requis
4. Si approuvé : L'espace devient propriété collective

#### Solidaire/Commercial → Quota
**Déclencheur** : Besoin de plus de flexibilité

**Processus** :
1. Proposition de passage au système de quotas
2. Définition des règles (quotas, tarifs, priorités)
3. Vote communautaire requis
4. Si approuvé : Mise en place calendrier partagé

---

### Cycle de Vie d'un Accord d'Usage

```
1. PROPOSITION
   ↓
2. APPROBATION (vote ou auto-approbation selon modèle)
   ↓
3. ACTIF
   ├─ Suivi usage
   ├─ Paiements
   └─ Alertes si dépassement
   ↓
4. OPTIONS
   ├─ Suspension temporaire
   ├─ Renouvellement
   ├─ Transition modèle
   └─ Fin d'accord
```

**États possibles** :
- `proposed` : En attente d'approbation
- `active` : Accord actif et en cours
- `suspended` : Temporairement suspendu (conflit, non-paiement)
- `ended` : Accord terminé
- `rejected` : Proposition refusée par vote

---

### Gestion des Conflits

#### Cas du Menuisier en Usage Intensif

**Problème** : Habitant menuisier utilise l'atelier 100-120 jours/an pour activité commerciale.

**Enjeux** :
- Fiscaux : Revenus non déclarés si pas de cadre commercial
- Assurance : Police résidente ne couvre pas usage professionnel
- Équité : Autres habitants exclus de l'accès
- Gouvernance : Conflit d'intérêt pour décisions collectives

**Solutions proposées** :

**Option 1 - Solidaire** :
- L'atelier devient activité collective
- Menuisier = responsable opérationnel (rémunéré)
- Revenus → Collectif
- Autres habitants + externes peuvent accéder

**Option 2 - Commercial** :
- ACP loue l'espace au menuisier (800€/mois)
- Contrat commercial distinct
- Menuisier paie taxes/TVA normalement
- Assurance professionnelle obligatoire

**Option 3 - Quota avec Transition** :
- Démarrage quota (30j pro/an)
- Au-delà → Tarif commercial (50€/j)
- Si dépassement répété → Proposition transition commercial
- Vote collectif pour décision finale

---

### Exemples Concrets

#### Exemple 1 : Atelier Bois Solidaire

**Configuration** :
- Type : `atelier_bois`
- Modèle : `solidaire`
- Surface : 50 m²
- Opérateur : Habitant menuisier (rémunéré 500€/mois)
- Accès résidents : Prix coûtant (20€/jour)
- Accès externes : Prix marché (formations payantes)

**Revenus année 1** :
- Résidents : 30 jours × 20€ = 600€
- Externes : 10 formations × 150€ = 1,500€
- Total : 2,100€ → 100% réserves ACP

**Coûts** :
- Opérateur : 500€/mois × 12 = 6,000€
- Charges : 600€/mois × 12 = 7,200€
- Total : 13,200€

**Bilan** : Déficit 11,100€ assumé par le collectif (investissement social).

---

#### Exemple 2 : Atelier Pro en Location Commerciale

**Configuration** :
- Type : `atelier_bois`
- Modèle : `commercial`
- Surface : 60 m²
- Locataire : Habitant menuisier professionnel
- Loyer : 800€/mois (dont 500€ base + 200€ charges + 100€ assurance/marge)

**Année 1** :
- Revenus ACP : 800€ × 12 = 9,600€
- Coûts réels : 700€ × 12 = 8,400€
- Marge ACP : 1,200€/an

**Obligations locataire** :
- Déclaration revenus professionnels
- TVA sur prestations (si applicable)
- Assurance RC professionnelle
- Déclaration activité commerciale

---

#### Exemple 3 : Espace Partagé avec Quotas

**Configuration** :
- Type : `atelier_general`
- Modèle : `quota`
- Surface : 45 m²
- Quota personnel : 40 jours/an
- Quota professionnel : 30 jours/an
- Tarifs : 10€/20€/50€ (perso/pro/hors-quota)

**Habitant A (usage personnel)** :
- Utilise 35 jours dans l'année
- Coût : 35 × 10€ = 350€

**Habitant B (usage professionnel)** :
- Utilise 42 jours (30 dans quota + 12 hors quota)
- Coût : (30 × 20€) + (12 × 50€) = 600€ + 600€ = 1,200€
- **Alerte dépassement** générée
- Option : Proposer transition commercial

**Revenus totaux** : 350€ + 1,200€ = 1,550€
- 70% ACP : 1,085€
- 30% participants : 465€ (redistribué selon quotité)

---

## Machine d'État

> **📊 Visualisation** : Voir [`regles-metiers-diagrammes-pedagogiques.md` - Section 2](./regles-metiers-diagrammes-pedagogiques.md#2-cycle-de-vie-du-projet-state-machine) pour le diagramme d'états complet

### Cycle de Vie du Projet

La machine d'état modélise les phases légales du projet :

1. **pre_purchase** : Avant achat (attente compromis)
2. **compromis_period** : Période compromis (demandes prêts)
3. **ready_for_deed** : Prêt pour acte (tous prêts approuvés)
4. **deed_registration_pending** : Attente enregistrement acte
5. **ownership_transferred** : Propriété transférée
6. **copro_creation** : Création copropriété (sous-états : rapport technique, PRECAD, acte, transcription)
7. **copro_established** : Copropriété établie
8. **permit_process** : Processus permis (sous-états : demande, octroi, promulgation)
9. **permit_active** : Permis actif
10. **lots_declared** : Lots cachés déclarés
11. **sales_active** : Ventes actives (sous-états : attente vente, traitement vente, approbation acheteur)
12. **completed** : Projet terminé (tous lots vendus)

### Événements Globaux

Les événements suivants sont disponibles dans **tous les états** :

#### Calculateur
- `UPDATE_PROJECT_PARAMS` : Mise à jour paramètres projet
- `UPDATE_PARTICIPANT_FINANCIAL_STATE` : Mise à jour état financier participant
- `RECALCULATE_ALL_PARTICIPANTS` : Recalculer tous les participants

#### Gestion Participants
- `ADD_PARTICIPANT` : Ajouter participant
- `UPDATE_PARTICIPANT` : Mettre à jour participant
- `REMOVE_PARTICIPANT` : Supprimer participant
- `ENABLE_PARTICIPANT` : Activer participant
- `DISABLE_PARTICIPANT` : Désactiver participant

#### Gestion Lots
- `ADD_LOT` : Ajouter lot
- `UPDATE_LOT` : Mettre à jour lot
- `REMOVE_LOT` : Supprimer lot
- `MARK_LOT_AS_PORTAGE` : Marquer lot comme portage
- `UPDATE_LOT_ACQUISITION` : Mettre à jour détails acquisition lot

#### Gestion Espaces Partagés (disponible à partir de `copro_established`)

**Gestion des Espaces** :
- `PROPOSE_SHARED_SPACE` : Proposer nouvel espace partagé
- `APPROVE_SHARED_SPACE` : Approuver espace partagé
- `REJECT_SHARED_SPACE` : Rejeter proposition espace
- `UPDATE_SHARED_SPACE` : Mettre à jour configuration espace
- `SUSPEND_SHARED_SPACE` : Suspendre espace
- `REOPEN_SHARED_SPACE` : Réouvrir espace suspendu
- `CLOSE_SHARED_SPACE` : Fermer espace définitivement

**Accords d'Usage** :
- `PROPOSE_USAGE_AGREEMENT` : Proposer accord d'usage
- `VOTE_ON_USAGE_AGREEMENT` : Voter sur accord d'usage
- `APPROVE_USAGE_AGREEMENT` : Approuver accord d'usage
- `REJECT_USAGE_AGREEMENT` : Rejeter accord d'usage
- `SUSPEND_USAGE_AGREEMENT` : Suspendre accord
- `RESUME_USAGE_AGREEMENT` : Reprendre accord suspendu
- `END_USAGE_AGREEMENT` : Terminer accord
- `RENEW_USAGE_AGREEMENT` : Renouveler accord

**Suivi Usage et Paiements** :
- `RECORD_SPACE_USAGE` : Enregistrer utilisation espace
- `CANCEL_SPACE_USAGE` : Annuler réservation
- `RECORD_SPACE_PAYMENT` : Enregistrer paiement
- `DISTRIBUTE_SPACE_REVENUE` : Distribuer revenus

**Gestion Quotas** :
- `RESET_ANNUAL_QUOTA` : Réinitialiser quotas annuels (1er janvier)
- `QUOTA_ALERT` : Alerte dépassement quota

**Transitions Modèles** :
- `TRANSITION_SPACE_TO_COMMERCIAL` : Transition vers modèle commercial
- `TRANSITION_SPACE_TO_SOLIDAIRE` : Transition vers modèle solidaire
- `TRANSITION_SPACE_TO_QUOTA` : Transition vers modèle quota

**Alertes et Conformité** :
- `RAISE_SPACE_ALERT` : Lever alerte espace (5 types: quota_exceeded, insurance_issue, tax_compliance, conflict_of_interest, over_usage)
- `RESOLVE_SPACE_ALERT` : Résoudre alerte
- `REQUIRE_INSURANCE_UPDATE` : Exiger mise à jour assurance
- `REQUIRE_TAX_DECLARATION` : Exiger déclaration fiscale

> **💡 Référence** : Voir `src/stateMachine/events.ts:173-214` pour les définitions TypeScript complètes

### Types de Ventes

#### Vente Portage
- Fondateur vend lot en portage
- Prix inclut indexation et frais de portage
- 100% au vendeur

#### Vente Copropriété
- Copropriété vend lot caché
- Prix calculé avec quotité
- 30% réserves + 70% redistribution proportionnelle

#### Vente Classique
- Vente normale entre particuliers
- Nécessite approbation acheteur
- Plafond de prix : coût acquisition × 110%

---

## Intégration Calculateur

### Flux de Données

1. **Calculateur → Machine d'État** :
   - Résultats calculs → `UPDATE_PARTICIPANT_FINANCIAL_STATE`
   - Paramètres projet → `UPDATE_PROJECT_PARAMS`

2. **Machine d'État → Calculateur** :
   - Changements participants/lots → Recalcul déclenché
   - Événements vente → Calcul redistribution

### Synchronisation

L'état financier des participants est synchronisé entre :
- **Calculateur** : Calculs en temps réel
- **Machine d'État** : Historique et validations

### Recalcul

Quand les paramètres changent :
1. Calculateur recalcule tous les participants
2. Machine d'État met à jour l'état financier de chaque participant
3. Interface utilisateur se met à jour automatiquement

---

## Règles Métier Importantes

### Quotité

- **Calculée à la date de vente** : Inclut tous les participants jusqu'à cette date (incluant l'acheteur pour le dénominateur)
- **Dilution** : Les quotités se diluent quand de nouveaux participants arrivent
- **Fondateurs** : Surface absolue constante, mais pourcentage diminue
- **Usage espaces partagés** : Utilisée pour redistribution revenus (modèle quota)

### Frais Généraux

- **Dynamiques** : Recalculés automatiquement quand les coûts CASCO changent
- **Équitable** : Répartis également entre tous les participants actifs
- **3 ans** : Basés sur une période de 3 ans

### Redistribution Copropriété

- **Récursive** : Chaque nouveau participant bénéficie des redistributions futures
- **Proportionnelle** : Basée sur quotité, pas sur égalité
- **Inclut nouveaux arrivants** : Gen 1 reçoit quand Gen 2 arrive

### Portage

- **Transparent** : Tous les coûts récupérables sont affichés
- **Indexation composée** : 2% par an composé
- **Récupération complète** : 100% des frais de portage récupérables par défaut

### Financement

- **Double prêt** : Optionnel, permet de séparer achat et rénovation
- **Ratio de financement** : Indique la proportion financée par prêt
- **Capital flexible** : Peut être alloué entre prêt 1 et prêt 2

### Espaces Partagés

- **3 modèles** : Solidaire, Commercial, Quota (adaptés à l'intensité d'usage)
- **Vote communautaire** : Requis pour solidaire et commercial, optionnel pour quota
- **Quotas annuels** : Reset automatique chaque 1er janvier
- **Tarification progressive** : Prix augmente si dépassement quota
- **Transitions possibles** : Entre modèles selon évolution des besoins
- **Alertes automatiques** : Dépassement quota, assurance, fiscalité
- **Revenus ACP** : Alimentent les réserves copropriété (30%-100% selon modèle)
- **Redistribution** : 30% aux participants (modèle quota uniquement)

---

## Conclusion

Ce guide couvre tous les mécanismes et règles de calcul de Credit Castor. Pour toute question spécifique, consulter :

### Code Source

**Calculs Financiers** :
- `src/utils/calculatorUtils.ts` : Calculs financiers participants (fonction principale `calculateAll()`)
- `src/utils/portageCalculations.ts` : Calculs portage et copropriété
- `src/utils/cashFlowProjection.ts` : Projections flux de trésorerie multi-années
- `src/utils/timelineCalculations.ts` : Calculs chronologie et événements
- `src/utils/coproRedistribution.ts` : Redistribution co-ownership shares
- `src/utils/newcomerCalculations.ts` : Calculs nouveaux arrivants

**State Machines** :
- `src/stateMachine/creditCastorMachine.ts` : Machine d'état principale (cycle de vie projet)
- `src/stateMachine/rentToOwnMachine.ts` : Machine location-vente (rent-to-own)
- `src/stateMachine/sharedSpaceMachine.ts` : Machine espaces partagés (v1.36.0+)
- `src/stateMachine/calculations.ts` : Fonctions de calcul appelées depuis la state machine
- `src/stateMachine/queries.ts` : Sélecteurs d'état dérivés

**Types et Événements** :
- `src/stateMachine/types.ts` : Tous les types TypeScript (contexte, états, espaces partagés)
- `src/stateMachine/events.ts` : Définitions des événements (11 catégories, 100+ événements)
- `src/types/cashFlow.ts` : Types projections cash flow
- `src/types/timeline.ts` : Types événements timeline
- `src/types/portage-config.ts` : Configuration système portage

**Tests** :
- `src/stateMachine/sharedSpace.test.ts` : Tests espaces partagés (16/16 tests)
- `src/stateMachine/creditCastorMachine.test.ts` : Tests machine principale
- `src/stateMachine/rentToOwnMachine.test.ts` : Tests rent-to-own
- `src/integration/portage-workflow.test.ts` : Tests end-to-end portage

### Documentation

**Guides Métiers** :
- `docs/guide-complet-mecanismes-regles.md` : **Ce document** - référence textuelle complète
- `docs/regles-metiers-diagrammes-pedagogiques.md` : Diagrammes visuels Mermaid (50+ diagrammes)
- `docs/cas-usage-flux-decision.md` : Cas d'usage, parcours utilisateurs, arbres de décision
- `docs/README-REGLES-METIERS.md` : Guide de navigation entre les docs

**Guides Développement** :
- `docs/development/firebase-setup-guide.md` : Configuration Firebase/Firestore
- `docs/development/breaking-changes-guide.md` : Gestion breaking changes
- `docs/development/pre-commit-checklist.md` : Checklist avant commit
- `docs/development/schema-registry-guide.md` : Registre des schémas de données
- `docs/development/copro-redistribution-mechanism.md` : Mécanisme redistribution copro
- `docs/development/state-machine-calculator-integration.md` : Intégration state machine ↔ calculateur

**Architecture et Design** :
- `CLAUDE.md` : Instructions projet pour Claude Code
- `docs/design/design-brief.md` : Brief design et architecture

### Nouvelles Fonctionnalités (v1.36.0+)

**Gestion des Espaces Partagés** :
- 3 modèles de gouvernance (Solidaire, Commercial, Quota)
- Tarification progressive avec dépassement quota
- Redistribution revenus selon quotité (30% participants, 70% ACP pour modèle quota)
- Alertes automatiques (quota, assurance, fiscalité)
- Transitions entre modèles de gouvernance
- State machine dédiée (`sharedSpaceMachine.ts`) avec 16 tests
- Intégration complète avec la machine d'état principale à partir de `copro_established`
- 29 événements spécifiques pour la gestion complète du cycle de vie

**Documentation Associée** :
- **Diagrammes visuels** : Voir `docs/regles-metiers-diagrammes-pedagogiques.md` (à venir)
- **Guide navigation** : Voir `docs/README-REGLES-METIERS.md`
- **Tests** : `src/stateMachine/sharedSpace.test.ts` (16/16 tests passants)

**À venir** :
- Interface utilisateur gestion espaces partagés
- Calendrier partagé pour réservations (système de booking)
- Dashboard usage et statistiques par espace
- Export rapport fiscal espaces partagés
- Diagrammes Mermaid pour visualiser les workflows

---

## Historique des Mises à Jour

### 2025-11-15 (v1.36.0)
**Ajout de la gestion des espaces partagés** :
- Documentation complète des 3 modèles de gouvernance (solidaire, commercial, quota)
- 29 événements de state machine documentés
- Exemples concrets pour chaque modèle
- Formules de tarification et redistribution
- Système d'alertes et conformité

**Améliorations documentation** :
- Ajout de références croisées avec `regles-metiers-diagrammes-pedagogiques.md`
- Amélioration de la section Vue d'ensemble avec liens documentation complémentaire
- Organisation hiérarchique des événements espaces partagés
- Mise à jour des références code source avec nouveaux fichiers
- Ajout d'une section Documentation complète avec catégorisation

**Références mises à jour** :
- `src/stateMachine/events.ts:173-214` : Événements espaces partagés
- `src/stateMachine/sharedSpaceMachine.ts` : Machine d'état dédiée
- `src/stateMachine/sharedSpace.test.ts` : 16 tests complets

### Versions antérieures
- **v1.35.0** : Mécanisme redistribution copropriété
- **v1.34.0** : Intégration projectParams dans calculs
- **v1.33.0** : Migration subcollections participants
- **v1.32.0-1.31.0** : Migrations schéma et travaux communs
- **v1.30.0** : Améliorations Firestore sync
- **v1.16.0** : Versioning sémantique et compatibilité

