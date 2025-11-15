# Guide Complet - Mécanismes et Règles de Credit Castor

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
11. [Machine d'État](#machine-détat)
12. [Intégration Calculateur](#intégration-calculateur)

---

## Vue d'ensemble

Credit Castor est une application de calcul pour projets de division immobilière en Wallonie, Belgique. Elle gère :

- **Division équitable** des coûts entre participants fondateurs
- **Système de portage** permettant aux fondateurs de conserver des lots en attendant des acheteurs
- **Ventes copropriété** avec redistribution proportionnelle aux participants existants
- **Calculs financiers** complets (achat, construction, frais, financement)
- **Financement flexible** (prêt unique ou double prêt)

---

## Mécanisme de Redistribution Copropriété

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

## Machine d'État

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

---

## Conclusion

Ce guide couvre tous les mécanismes et règles de calcul de Credit Castor. Pour toute question spécifique, consulter :
- Code source : `src/utils/calculatorUtils.ts` (calculs)
- Machine d'État : `src/stateMachine/creditCastorMachine.ts` (workflow)
- Documentation développement : `docs/development/`

