# Règles Métiers - Diagrammes Pédagogiques

> **Version actuelle** : 1.37.0
> **Dernière mise à jour** : 2025-11-15
> **Statut** : ✅ Complet et à jour

> Documentation visuelle complète des règles métiers de Credit Castor
>
> **Objectif**: Fournir une compréhension claire et visuelle des mécanismes complexes du système pour tous les membres du projet.

> **📚 Navigation Documentation**
> - **Guide textuel complet** : [`guide-complet-mecanismes-regles.md`](./guide-complet-mecanismes-regles.md)
> - **Cas d'usage et flux** : [`cas-usage-flux-decision.md`](./cas-usage-flux-decision.md)
> - **Guide de navigation** : [`README-REGLES-METIERS.md`](./README-REGLES-METIERS.md)

## Table des Matières

1. [Vue d'Ensemble du Système](#1-vue-densemble-du-système)
2. [Cycle de Vie du Projet (State Machine)](#2-cycle-de-vie-du-projet-state-machine)
3. [Mécanisme de Redistribution Copropriété](#3-mécanisme-de-redistribution-copropriété)
4. [Calculs de Portage](#4-calculs-de-portage)
5. [Types de Ventes](#5-types-de-ventes)
6. [Financement (Simple vs Double Prêt)](#6-financement-simple-vs-double-prêt)
7. [Frais Généraux Dynamiques](#7-frais-généraux-dynamiques)
8. [Rent-to-Own](#8-rent-to-own)
9. [Structures de Données](#9-structures-de-données)
10. [Gestion des Espaces Partagés](#10-gestion-des-espaces-partagés)

---

## 1. Vue d'Ensemble du Système

```mermaid
graph TB
    subgraph "Acteurs"
        F[Fondateurs]
        N[Nouveaux Arrivants]
        C[Copropriété]
    end

    subgraph "Mécanismes Principaux"
        P[Portage]
        R[Redistribution Copropriété]
        V[Ventes]
        FG[Frais Généraux]
    end

    subgraph "Calculs"
        Q[Quotité]
        I[Indexation]
        FC[Frais de Portage]
        PR[Prix de Vente]
    end

    F -->|Détient lots| P
    P -->|Vend à| N
    C -->|Vend à| N
    C -->|Redistribue à| F
    C -->|Redistribue à| N

    V -->|Utilise| Q
    V -->|Applique| I
    P -->|Accumule| FC
    V -->|Calcule| PR

    FG -->|Basé sur CASCO| F
    FG -->|Distribué à| N

    style F fill:#e1f5ff
    style N fill:#fff4e1
    style C fill:#e8f5e9
    style R fill:#ffebee
```

### Concepts Clés

- **Fondateurs**: Participants originaux qui acquièrent le bâtiment à T0 (date acte transcription)
- **Quotité**: Part de propriété = (Surface participant) / (Surface totale)
- **Portage**: Mécanisme permettant aux fondateurs de conserver des lots en attendant des acheteurs
- **Redistribution**: 70% des ventes copropriété redistribués proportionnellement à tous les participants existants

---

## 2. Cycle de Vie du Projet (State Machine)

```mermaid
stateDiagram-v2
    [*] --> pre_purchase: Projet créé

    pre_purchase --> compromis_period: COMPROMIS_SIGNED

    compromis_period --> ready_for_deed: Tous prêts approuvés

    ready_for_deed --> deed_registration_pending: DEED_SIGNED

    deed_registration_pending --> ownership_transferred: DEED_REGISTERED

    ownership_transferred --> copro_creation: START_COPRO_CREATION

    state copro_creation {
        [*] --> awaiting_technical_report
        awaiting_technical_report --> awaiting_precad: Rapport prêt
        awaiting_precad --> precad_review: PRECAD_REQUESTED
        precad_review --> drafting_acte: PRECAD_APPROVED
        drafting_acte --> awaiting_signatures: Acte rédigé
        awaiting_signatures --> awaiting_transcription: ACTE_SIGNED
        awaiting_transcription --> [*]: ACTE_TRANSCRIBED
    }

    copro_creation --> copro_established: Copro transcrite

    copro_established --> permit_process: REQUEST_PERMIT

    state permit_process {
        [*] --> permit_review
        permit_review --> awaiting_enactment: PERMIT_GRANTED
        permit_review --> awaiting_request: PERMIT_REJECTED
        awaiting_request --> permit_review: Nouvelle demande
        awaiting_enactment --> [*]: PERMIT_ENACTED
    }

    permit_process --> permit_active: Permis promulgué

    permit_active --> lots_declared: DECLARE_HIDDEN_LOTS

    lots_declared --> sales_active: FIRST_SALE

    state sales_active {
        [*] --> awaiting_sale
        awaiting_sale --> awaiting_buyer_approval: Vente classique initiée
        awaiting_sale --> processing_sale: Vente portage/copro initiée
        awaiting_buyer_approval --> processing_sale: BUYER_APPROVED
        awaiting_buyer_approval --> awaiting_sale: BUYER_REJECTED
        processing_sale --> awaiting_sale: COMPLETE_SALE
        processing_sale --> awaiting_sale: INITIATE_RENT_TO_OWN
    }

    sales_active --> completed: ALL_LOTS_SOLD

    completed --> [*]

    note right of copro_creation
        T0 = Date acte transcription
        Point de départ pour calculs
        - Indexation
        - Frais de portage
        - Quotité fondateurs
    end note

    note right of sales_active
        Types de ventes:
        - Portage (fondateur → nouveau)
        - Copropriété (copro → nouveau)
        - Classique (participant → participant)
    end note
```

### Événements Globaux

Ces événements sont disponibles dans **TOUS** les états:

```mermaid
graph LR
    subgraph "Événements Calculateur"
        UPP[UPDATE_PROJECT_PARAMS]
        UPFS[UPDATE_PARTICIPANT_FINANCIAL_STATE]
        REC[RECALCULATE_ALL_PARTICIPANTS]
    end

    subgraph "Gestion Participants"
        AP[ADD_PARTICIPANT]
        UP[UPDATE_PARTICIPANT]
        RP[REMOVE_PARTICIPANT]
        EN[ENABLE_PARTICIPANT]
        DIS[DISABLE_PARTICIPANT]
    end

    subgraph "Gestion Lots"
        AL[ADD_LOT]
        UL[UPDATE_LOT]
        RL[REMOVE_LOT]
        MP[MARK_LOT_AS_PORTAGE]
        UA[UPDATE_LOT_ACQUISITION]
    end

    style UPP fill:#e3f2fd
    style AP fill:#f3e5f5
    style AL fill:#fff9c4
```

---

## 3. Mécanisme de Redistribution Copropriété

### Vue d'Ensemble

```mermaid
flowchart TB
    Start([Nouveau venu achète de la copropriété])

    Start --> CalcQuotite[Calculer quotité nouveau venu<br/>quotité = surface NV / surface totale<br/>incluant le nouveau venu]

    CalcQuotite --> CalcPrice[Calculer prix d'achat<br/>Prix = quotité × coût projet total<br/>+ indexation 2%/an<br/>+ récup frais portage]

    CalcPrice --> Split[Diviser le paiement]

    Split --> Reserve[30% → Réserves Copropriété]
    Split --> Redistrib[70% → Redistribution]

    Redistrib --> CalcAllQuotites[Pour chaque participant existant:<br/>quotité_p = surface_p / surface_totale<br/>incluant le nouveau venu]

    CalcAllQuotites --> Distribute[Chaque participant reçoit:<br/>montant = 70% × quotité_p]

    Distribute --> Recursive{Récursif}

    Recursive -->|Gen 2 arrive| IncludeGen1[Gen 1 reçoit redistribution<br/>aux côtés des fondateurs]

    IncludeGen1 --> End([Redistribution complète])

    Reserve --> End

    style Start fill:#e3f2fd
    style CalcPrice fill:#fff9c4
    style Split fill:#f3e5f5
    style Reserve fill:#c8e6c9
    style Redistrib fill:#ffccbc
    style Recursive fill:#ffebee
    style End fill:#e3f2fd
```

### Exemple Concret

```mermaid
graph TB
    subgraph "État Initial"
        A1[Alice: 200 m²]
        B1[Bob Gen1: 50 m²]
        T1[Total: 250 m²]
    end

    subgraph "Charlie Gen2 Achète 50 m²"
        C[Charlie: 50 m²<br/>Prix: 40,000€]
    end

    subgraph "Calcul Quotité"
        QC[Quotité Charlie:<br/>50 / 300 = 16.67%]
        QA[Quotité Alice:<br/>200 / 300 = 66.67%]
        QB[Quotité Bob:<br/>50 / 300 = 16.67%]
    end

    subgraph "Répartition Paiement"
        R1[30% Réserves: 12,000€]
        R2[70% Redistrib: 28,000€]
    end

    subgraph "Redistribution Finale"
        RA[Alice reçoit:<br/>28,000 × 66.67% = 18,667€]
        RB[Bob reçoit:<br/>28,000 × 16.67% = 4,667€]
        RC[Charlie reçoit: 0€<br/>il est l'acheteur]
    end

    A1 --> QA
    B1 --> QB
    C --> QC

    C --> R1
    C --> R2

    R2 --> RA
    R2 --> RB

    style C fill:#fff9c4
    style R1 fill:#c8e6c9
    style R2 fill:#ffccbc
    style RA fill:#e1f5ff
    style RB fill:#e1f5ff
```

### Formules Clés

```mermaid
graph LR
    subgraph "1. Prix Nouveau Venu"
        direction TB
        B1[Base = quotité_NV × coût_projet]
        I1[Indexation = base × 1.02^années - 1]
        F1[Frais = frais_portage × quotité_NV]
        T1[Total = base + indexation + frais]

        B1 --> I1 --> F1 --> T1
    end

    subgraph "2. Quotité"
        direction TB
        Q[quotité = surface_participant /<br/>surface_totale_à_date_vente]
        Q2[IMPORTANT: Dénominateur inclut<br/>la surface de l'acheteur]
    end

    subgraph "3. Redistribution"
        direction TB
        R1[Montant participant =<br/>70% paiement × quotité_participant]
        R2[Acheteur ne reçoit rien]
    end

    style T1 fill:#fff9c4
    style Q2 fill:#ffebee
    style R2 fill:#ffebee
```

---

## 4. Calculs de Portage

```mermaid
flowchart TB
    Start([Fondateur vend lot en portage])

    Start --> Base[Coût Base =<br/>Prix achat + Frais notaire + Construction]

    Base --> Years[Calculer années détenues<br/>années = date_vente - date_acquisition]

    Years --> Index[Indexation composée<br/>indexation = base × 1.02^années - 1]

    Index --> Carrying[Frais de Portage Mensuels]

    Carrying --> Interest[Intérêts prêt:<br/>montant_prêt × taux / 12]
    Carrying --> Tax[Taxe inoccupé:<br/>388.38€ / 12 = 32.36€/mois]
    Carrying --> Insurance[Assurance:<br/>2000€ / 12 = 166.67€/mois]
    Carrying --> Syndic[Frais syndic: variables]
    Carrying --> Charges[Charges communes: variables]

    Interest --> Total1[Total mensuel × nb_mois]
    Tax --> Total1
    Insurance --> Total1
    Syndic --> Total1
    Charges --> Total1

    Total1 --> Recovery[Récupération = total × taux_récup<br/>défaut: 100%]

    Recovery --> Reno[+ Rénovations après acquisition]

    Reno --> Final[Prix Final =<br/>Base + Indexation + Récup + Reno]

    Final --> Seller[100% au fondateur vendeur]

    Seller --> End([Vente complète])

    style Base fill:#e3f2fd
    style Index fill:#fff9c4
    style Total1 fill:#ffccbc
    style Final fill:#c8e6c9
    style Seller fill:#e1f5ff
```

### Exemple de Calcul

```mermaid
graph TB
    subgraph "Données de Départ"
        D1[Lot: 100 m²]
        D2[Achat: 100,000€]
        D3[Notaire: 12,500€]
        D4[Construction: 40,000€]
        D5[Portage: 2.5 ans]
    end

    subgraph "Calcul Base"
        C1[Base = 100,000 + 12,500 + 40,000<br/>= 152,500€]
    end

    subgraph "Indexation"
        I1[Indexation = 152,500 × 1.02^2.5 - 1<br/>= 152,500 × 0.0504<br/>= 7,686€]
    end

    subgraph "Frais Portage"
        F1[Mensuel = 500 + 32.36 + 166.67<br/>= 699€/mois]
        F2[30 mois × 699 = 20,970€]
    end

    subgraph "Prix Final"
        P1[Total = 152,500 + 7,686 + 20,970<br/>= 181,156€]
    end

    D1 --> C1
    D2 --> C1
    D3 --> C1
    D4 --> C1

    C1 --> I1
    D5 --> F1
    F1 --> F2

    C1 --> P1
    I1 --> P1
    F2 --> P1

    style C1 fill:#e3f2fd
    style I1 fill:#fff9c4
    style F2 fill:#ffccbc
    style P1 fill:#c8e6c9
```

---

## 5. Types de Ventes

```mermaid
stateDiagram-v2
    [*] --> InitiateS ale: SALE_INITIATED

    state "Déterminer Type" as DetermineType
    InitiateSale --> DetermineType

    state is_classic <<choice>>
    DetermineType --> is_classic

    is_classic --> ClassicSale: Vente entre participants
    is_classic --> PortageSale: Lot en portage
    is_classic --> CoproSale: Lot copropriété

    state "Vente Classique" as ClassicSale {
        [*] --> CheckApproval: Vérifier acheteur
        CheckApproval --> WaitApproval: Besoin approbation
        WaitApproval --> Approved: BUYER_APPROVED
        WaitApproval --> Rejected: BUYER_REJECTED
        Approved --> ValidatePrice: Vérifier plafond prix
        ValidatePrice --> Complete: Prix ≤ coût × 1.10
        Rejected --> [*]
        Complete --> [*]
    }

    state "Vente Portage" as PortageSale {
        [*] --> CalcPortage: Calculer prix portage
        CalcPortage --> AddCarrying: + Frais de portage
        AddCarrying --> AddIndex: + Indexation 2%
        AddIndex --> Payment: 100% au fondateur
        Payment --> [*]
    }

    state "Vente Copropriété" as CoproSale {
        [*] --> CalcQuotite: Calculer quotité
        CalcQuotite --> CalcBasePrice: Base = quotité × coût_projet
        CalcBasePrice --> AddIndexCopro: + Indexation
        AddIndexCopro --> AddCarryingCopro: + Récup frais
        AddCarryingCopro --> Split: Diviser paiement
        Split --> Reserves: 30% → Réserves
        Split --> Redistribute: 70% → Participants
        Reserves --> [*]
        Redistribute --> [*]
    }

    ClassicSale --> RecordSale
    PortageSale --> RecordSale
    CoproSale --> RecordSale

    RecordSale --> [*]: Vente enregistrée

    note right of ClassicSale
        Plafond prix:
        coût_acquisition × 110%

        Requiert approbation
        communauté
    end note

    note right of CoproSale
        Redistribution récursive:
        - Fondateurs reçoivent
        - Gen 1 reçoit
        - Gen 2 reçoit
        etc.
    end note
```

### Matrice de Décision

```mermaid
graph TB
    Start{Type de Vente?}

    Start -->|Fondateur vend lot portage| Portage[Vente Portage<br/>───────────<br/>✓ Surface imposée<br/>✓ Prix = base + index + frais<br/>✓ 100% au vendeur<br/>✗ Pas redistribution]

    Start -->|Copro vend lot caché| Copro[Vente Copropriété<br/>───────────<br/>✓ Surface libre choix<br/>✓ Prix via quotité<br/>✓ 30% réserves<br/>✓ 70% redistribution]

    Start -->|Participant vend à participant| Classic[Vente Classique<br/>───────────<br/>✓ Prix plafonné coût×1.10<br/>✓ Approbation requise<br/>✓ 100% au vendeur<br/>✗ Pas redistribution]

    style Portage fill:#e3f2fd
    style Copro fill:#c8e6c9
    style Classic fill:#fff9c4
```

---

## 6. Financement (Simple vs Double Prêt)

### Financement Simple

```mermaid
flowchart LR
    subgraph "Coût Total"
        A[Achat]
        N[Notaire]
        C[CASCO]
        P[Parachèvements]
        F[Frais partagés]
    end

    subgraph "Financement"
        Cap[Capital Apporté]
        Loan[Prêt Unique]
    end

    subgraph "Mensualité"
        M[Mensualité constante<br/>sur toute la durée]
    end

    A --> Total[Coût Total]
    N --> Total
    C --> Total
    P --> Total
    F --> Total

    Total --> Calc{Calcul}
    Cap --> Calc

    Calc --> Loan
    Loan --> M

    style Total fill:#e3f2fd
    style Loan fill:#fff9c4
    style M fill:#c8e6c9
```

### Financement Double Prêt

```mermaid
flowchart TB
    subgraph "Répartition Coûts"
        direction LR
        A1[Achat + Notaire + Frais]
        R1[CASCO + Parachèvements<br/>portion au prêt 2]
    end

    subgraph "Prêt 1: Achat + Frais"
        direction TB
        L1[Montant: Achat + Notaire + Frais - Capital1]
        D1[Démarre: Immédiatement]
        Dur1[Durée: Participant.durationYears<br/>ex: 25 ans]
        M1[Mensualité: PMT Prêt 1]
    end

    subgraph "Prêt 2: Rénovation"
        direction TB
        L2[Montant: loan2RenovationAmount - Capital2]
        D2[Démarre: Après loan2DelayYears<br/>défaut: 2 ans]
        Dur2[Durée: Calculée pour finir<br/>en même temps que Prêt 1]
        M2[Mensualité: PMT Prêt 2]
    end

    subgraph "Timeline Mensualités"
        direction LR
        T1[0 → 2 ans:<br/>Mensualité = M1]
        T2[2 ans → 25 ans:<br/>Mensualité = M1 + M2]
    end

    A1 --> L1
    R1 --> L2

    L1 --> M1
    L2 --> M2

    M1 --> T1
    M1 --> T2
    M2 --> T2

    style L1 fill:#e3f2fd
    style L2 fill:#fff9c4
    style T1 fill:#c8e6c9
    style T2 fill:#ffccbc
```

### Exemple Double Prêt

```mermaid
graph TB
    subgraph "Données"
        D1[Coût Total: 470,000€]
        D2[Capital: 50,000€]
        D3[Réno Prêt 2: 70,000€]
    end

    subgraph "Répartition Capital"
        C1[Capital Prêt 1: 40,000€]
        C2[Capital Prêt 2: 10,000€]
    end

    subgraph "Prêt 1"
        P1[Achat + Frais: 400,000€]
        P1M[Montant: 360,000€<br/>400k - 40k capital]
        P1D[Mensualité: 1,900€<br/>Durée: 25 ans]
    end

    subgraph "Prêt 2"
        P2[Rénovation: 70,000€]
        P2M[Montant: 60,000€<br/>70k - 10k capital]
        P2D[Mensualité: 600€<br/>Durée: 15 ans<br/>Démarre: Après 2 ans]
    end

    subgraph "Résultat"
        R1[Années 0-2:<br/>Mensualité = 1,900€]
        R2[Années 2-25:<br/>Mensualité = 2,500€<br/>1,900 + 600]
    end

    D1 --> P1
    D3 --> P2
    D2 --> C1
    D2 --> C2

    P1 --> P1M
    P2 --> P2M
    C1 --> P1M
    C2 --> P2M

    P1M --> P1D
    P2M --> P2D

    P1D --> R1
    P1D --> R2
    P2D --> R2

    style P1D fill:#e3f2fd
    style P2D fill:#fff9c4
    style R1 fill:#c8e6c9
    style R2 fill:#ffccbc
```

---

## 7. Frais Généraux Dynamiques

```mermaid
flowchart TB
    Start([Calcul Frais Généraux 3 ans])

    Start --> CASCO1[CASCO Participants<br/>Somme: surface × prix CASCO/m²]
    Start --> CASCO2[CASCO Travaux Communs<br/>Si activé]

    CASCO1 --> Total[Total CASCO HORS TVA]
    CASCO2 --> Total

    Total --> Honoraires[Honoraires = CASCO × 15% × 30%<br/>Représente: architectes, experts,<br/>bureaux études, PEB]

    Honoraires --> Annual1[Honoraires annuels =<br/>Honoraires totaux / 3]

    Start --> Recurring[Frais Récurrents Annuels]

    Recurring --> R1[Précompte: 388.38€]
    Recurring --> R2[Comptable: 1,000€]
    Recurring --> R3[Podio: 600€]
    Recurring --> R4[Assurance: 2,000€]
    Recurring --> R5[Réservation: 2,000€]
    Recurring --> R6[Imprévus: 2,000€]

    R1 --> RTotal[Total récurrent: 7,988.38€/an]
    R2 --> RTotal
    R3 --> RTotal
    R4 --> RTotal
    R5 --> RTotal
    R6 --> RTotal

    Annual1 --> Combined[Total annuel =<br/>Honoraires annuels + Récurrent]
    RTotal --> Combined

    Combined --> Final[Total 3 ans = Total annuel × 3]

    Final --> Distribution[Répartition équitable<br/>Montant par participant =<br/>Total / Nombre participants]

    Distribution --> End([Frais par participant])

    style Total fill:#e3f2fd
    style Honoraires fill:#fff9c4
    style RTotal fill:#ffccbc
    style Final fill:#c8e6c9
    style Distribution fill:#e1f5ff
```

### Formule Détaillée

```mermaid
graph LR
    subgraph "1. CASCO Total"
        C1[CASCO = Σ participants + travaux communs<br/>HORS TVA pour honoraires]
    end

    subgraph "2. Honoraires"
        H1[Honoraires 3 ans = CASCO × 15% × 30%<br/>= CASCO × 4.5%]
        H2[Honoraires annuels = Honoraires 3 ans / 3]
    end

    subgraph "3. Frais Récurrents"
        F1[Total = 7,988.38€/an]
    end

    subgraph "4. Total"
        T1[Annuel = Honoraires + Récurrent]
        T2[3 ans = Annuel × 3]
    end

    subgraph "5. Distribution"
        D1[Par participant = Total / N participants]
    end

    C1 --> H1 --> H2 --> T1
    F1 --> T1
    T1 --> T2
    T2 --> D1

    style H1 fill:#fff9c4
    style T2 fill:#c8e6c9
    style D1 fill:#e1f5ff
```

---

## 8. Rent-to-Own

```mermaid
stateDiagram-v2
    [*] --> trial_active: Accord créé

    trial_active --> trial_active: RECORD_PAYMENT<br/>Accumule équité

    trial_active --> trial_ending: Moins de 30 jours<br/>avant fin période

    trial_ending --> community_vote: BUYER_REQUEST_PURCHASE<br/>Acheteur veut acheter
    trial_ending --> buyer_declined: BUYER_DECLINE_PURCHASE<br/>Acheteur renonce
    trial_ending --> extension_vote: REQUEST_EXTENSION<br/>Demande prolongation

    extension_vote --> trial_active: EXTENSION_APPROVED<br/>+ 6 mois période
    extension_vote --> trial_ending: EXTENSION_REJECTED

    community_vote --> purchase_finalization: VOTE_APPROVED<br/>Communauté approuve
    community_vote --> community_rejected: VOTE_REJECTED<br/>Communauté refuse

    purchase_finalization --> completed: Achat finalisé

    buyer_declined --> [*]
    community_rejected --> [*]
    completed --> [*]

    note right of trial_active
        Paiements mensuels divisés:
        - Portion équité (vers achat)
        - Portion loyer (non récupérable)

        Formule configurable par projet
    end note

    note right of extension_vote
        Extensions limitées:
        - Max extensions configurables
        - Incrément: 6 mois par défaut

        Nécessite approbation copro
    end note

    note right of community_vote
        Vote communauté:
        - Méthode: hybride (démo + quotité)
        - Quorum: 50%
        - Majorité: 50%
    end note
```

### Calcul Paiements

```mermaid
flowchart LR
    subgraph "Accord"
        A1[Paiement mensuel fixe]
        A2[Formule rent-to-own]
        A3[Prix de vente sous-jacent]
    end

    subgraph "Chaque Paiement"
        P1[Total payé]
        P2{Diviser selon formule}
        P3[Portion Équité<br/>vers achat final]
        P4[Portion Loyer<br/>non récupérable]
    end

    subgraph "Accumulation"
        AC1[Équité accumulée]
        AC2[Loyer payé total]
    end

    A1 --> P1
    A2 --> P2
    P1 --> P2

    P2 --> P3
    P2 --> P4

    P3 --> AC1
    P4 --> AC2

    style A1 fill:#e3f2fd
    style P3 fill:#c8e6c9
    style P4 fill:#ffccbc
    style AC1 fill:#e1f5ff
```

---

## 9. Structures de Données

### Participant

```mermaid
classDiagram
    class Participant {
        +string name
        +number capitalApporte
        +number registrationFeesRate
        +number interestRate
        +number durationYears
        +boolean isFounder
        +Date entryDate
        +Date exitDate
        +Lot[] lotsOwned
        +boolean enabled

        Financement Simple
        +number loanNeeded
        +number monthlyPayment

        Financement Double
        +boolean useTwoLoans
        +number loan2DelayYears
        +number loan2RenovationAmount
        +number capitalForLoan1
        +number capitalForLoan2
        +number loan1Amount
        +number loan1MonthlyPayment
        +number loan2Amount
        +number loan2MonthlyPayment

        Nouveaux Arrivants
        +PurchaseDetails purchaseDetails
    }

    class PurchaseDetails {
        +string buyingFrom
        +number lotId
        +number purchasePrice
        +PriceBreakdown breakdown
    }

    class Lot {
        +number id
        +number surface
        +string origin
        +string status
        +boolean heldForPortage
        +Acquisition acquisition
    }

    Participant "1" --> "*" Lot : owns
    Participant "1" --> "0..1" PurchaseDetails : has
```

### ProjectParams

```mermaid
classDiagram
    class ProjectParams {
        +number totalPurchase
        +number fraisGeneraux3ans
        +number globalCascoPerM2
        +number cascoTvaRate
        +number maxTotalLots
        +string renovationStartDate
        +ExpenseCategories expenseCategories
        +TravauxCommuns travauxCommuns
    }

    class ExpenseCategories {
        +ExpenseLineItem[] conservatoire
        +ExpenseLineItem[] habitabiliteSommaire
        +ExpenseLineItem[] premierTravaux
    }

    class TravauxCommuns {
        +boolean enabled
        +TravauxCommunsItem[] items
    }

    class TravauxCommunsItem {
        +string label
        +number sqm
        +number cascoPricePerSqm
        +number parachevementPricePerSqm
    }

    ProjectParams "1" --> "1" ExpenseCategories
    ProjectParams "1" --> "1" TravauxCommuns
    TravauxCommuns "1" --> "*" TravauxCommunsItem
```

### State Machine Context

```mermaid
classDiagram
    class ProjectContext {
        Dates Légales
        +Date compromisDate
        +Date deedDate
        +Date registrationDate
        +Date acteTranscriptionDate
        +Date permitEnactedDate

        Données Projet
        +Participant[] participants
        +Lot[] lots
        +Sale[] salesHistory

        Financement
        +Map financingApplications
        +number requiredFinancing
        +number approvedFinancing

        ACP
        +Map acpLoans
        +number acpBankAccount

        Rent-to-Own
        +Map rentToOwnAgreements

        Financials
        +ProjectFinancials projectFinancials
    }

    class Sale {
        <<union>>
        +PortageSale
        +CoproSale
        +ClassicSale
    }

    class PortageSale {
        +string type = "portage"
        +string lotId
        +string buyer
        +string seller
        +Date saleDate
        +PortagePricing pricing
    }

    class CoproSale {
        +string type = "copro"
        +string lotId
        +string buyer
        +Date saleDate
        +number surface
        +CoproPricing pricing
    }

    class CoproPricing {
        +number totalPrice
        +number pricePerM2
        +PriceBreakdown breakdown
        +Distribution distribution
    }

    class Distribution {
        +number toCoproReserves
        +Map~string,number~ toParticipants
    }

    ProjectContext "1" --> "*" Sale
    Sale <|-- PortageSale
    Sale <|-- CoproSale
    CoproSale "1" --> "1" CoproPricing
    CoproPricing "1" --> "1" Distribution
```

---

## Résumé des Règles Métiers Critiques

### 1. Quotité (Clé de Voûte)

```
quotité = surface_participant / surface_totale_à_date
```

- **Utilisée pour**: Prix nouveaux venus, redistribution copropriété, votes
- **Caractéristique**: Dilution progressive quand nouveaux participants arrivent
- **Important**: Dénominateur inclut l'acheteur pour calculer son prix

### 2. Indexation (Portage & Copropriété)

```
indexation = montant × [(1 + taux/100)^années - 1]
taux défaut = 2% par an (composé)
```

### 3. Redistribution Copropriété

```
Paiement nouveau venu:
  30% → Réserves copropriété
  70% → Redistribué proportionnellement à TOUS participants existants

Montant participant = 70% × quotité_participant
```

- **Récursif**: Gen 1 reçoit quand Gen 2 arrive
- **Proportionnel**: Basé sur quotité, pas égalité

### 4. Frais Généraux Dynamiques

```
Honoraires 3 ans = CASCO_HORS_TVA × 15% × 30%
Honoraires annuels = Honoraires 3 ans / 3
Total annuel = Honoraires annuels + Récurrent (7,988.38€)
Total 3 ans = Total annuel × 3
Par participant = Total 3 ans / N participants
```

### 5. Types de Ventes

| Type | Prix | Redistribution | Approbation |
|------|------|----------------|-------------|
| **Portage** | Base + Index + Frais | 100% vendeur | Non |
| **Copropriété** | Via quotité | 30% réserves + 70% tous | Non |
| **Classique** | Plafonné coût×1.10 | 100% vendeur | Oui |

---

---

## 10. Gestion des Espaces Partagés

> **📖 Guide textuel** : Voir [`guide-complet-mecanismes-regles.md` - Section 11](./guide-complet-mecanismes-regles.md#gestion-des-espaces-partagés) pour descriptions détaillées

### Vue d'Ensemble des Trois Modèles

```mermaid
graph TB
    subgraph "Choix du Modèle de Gouvernance"
        Usage{Intensité d'Usage<br/>& Nature Activité}

        Usage -->|Usage occasionnel<br/>Personnel/Collectif| Quota[MODÈLE QUOTA<br/>━━━━━━━━━━━━<br/>✓ 40j perso + 30j pro/an<br/>✓ Auto-approbation<br/>✓ Tarif progressif<br/>✓ 70% ACP, 30% redistrib]

        Usage -->|Usage intensif<br/>Activité commerciale| Commercial[MODÈLE COMMERCIAL<br/>━━━━━━━━━━━━<br/>✓ Location formelle<br/>✓ Loyer mensuel fixe<br/>✓ Assurance obligatoire<br/>✓ 100% ACP<br/>✓ Vote requis]

        Usage -->|Activité collective<br/>Service communauté| Solidaire[MODÈLE SOLIDAIRE<br/>━━━━━━━━━━━━<br/>✓ Propriété collective<br/>✓ Opérateur rémunéré<br/>✓ Accès gratuit/coûtant<br/>✓ 100% réserves ACP<br/>✓ Vote requis]
    end

    subgraph "Transitions Possibles"
        Quota -.->|Dépassement<br/>répété| Commercial
        Commercial -.->|Collectivisation| Solidaire
        Solidaire -.->|Plus de<br/>flexibilité| Quota
    end

    style Quota fill:#e3f2fd
    style Commercial fill:#fff9c4
    style Solidaire fill:#c8e6c9
```

### Modèle QUOTA - Cycle de Vie

```mermaid
stateDiagram-v2
    [*] --> proposed: Participant propose usage

    proposed --> active: Auto-approbation<br/>(usage personnel)
    proposed --> voting: Vote requis<br/>(usage professionnel)

    voting --> active: Approuvé
    voting --> rejected: Rejeté

    state active {
        [*] --> within_quota: Utilisation normale

        within_quota --> within_quota: Réservations<br/>dans quota
        within_quota --> quota_exceeded: Dépassement

        quota_exceeded --> alert_raised: Alerte générée
        alert_raised --> within_quota: Paiement hors quota<br/>OU attente reset annuel
        alert_raised --> transition_vote: Proposition transition<br/>vers commercial

        state "Reset Annuel" as reset
        within_quota --> reset: 1er janvier
        quota_exceeded --> reset: 1er janvier
        reset --> within_quota: Quotas réinitialisés
    }

    active --> suspended: Problème conformité<br/>ou non-paiement
    suspended --> active: Problème résolu

    active --> ended: Fin d'accord
    transition_vote --> ended: Transition approuvée

    rejected --> [*]
    ended --> [*]

    note right of quota_exceeded
        Types d'alertes:
        - quota_exceeded
        - over_usage
        - insurance_issue
        - tax_compliance
    end note
```

### Modèle COMMERCIAL - Structure de Location

```mermaid
flowchart TB
    Start([Proposition Location Commerciale])

    Start --> Vote{Vote Communautaire}

    Vote -->|Rejeté| Rejected([Fin])
    Vote -->|Approuvé| Contract[Établir Contrat Location]

    Contract --> Terms[Définir Termes]

    subgraph "Termes du Contrat"
        Rent[Loyer Mensuel]
        Charges[Charges Mensuelles]
        Deposit[Dépôt de Garantie]
        Duration[Durée Contrat]
        Insurance[Assurance Professionnelle]
    end

    Terms --> Breakdown[Décomposition Transparente]

    subgraph "Coûts Détaillés"
        Base[Coût Base<br/>part proportionnelle]
        Ops[Coûts Opérationnels<br/>électricité, chauffage]
        Ins[Assurance RC Pro]
        Margin[Marge ACP]
        Total[Total Mensuel]
    end

    Breakdown --> Active[Accord Actif]

    Active --> Monthly[Paiement Mensuel]
    Monthly --> ACP[100% → Compte ACP]

    Active --> Compliance{Conformité}
    Compliance -->|OK| Active
    Compliance -->|Problème| Alert[Alerte Fiscale/Assurance]

    Alert --> Suspended[Suspension]
    Suspended -->|Résolu| Active

    Active --> End([Fin de Contrat])

    style Contract fill:#e3f2fd
    style Active fill:#c8e6c9
    style ACP fill:#fff9c4
    style Alert fill:#ffebee
```

### Modèle SOLIDAIRE - Revenus et Opérateur

```mermaid
flowchart LR
    subgraph "Structure Collective"
        ACP[ACP<br/>Propriétaire de l'Espace]
        Operator[Opérateur<br/>Résident Gestionnaire]
        Residents[Résidents<br/>Utilisateurs]
        External[Usagers Externes]
    end

    subgraph "Rémunération Opérateur"
        Option1[Rémunéré<br/>Salaire mensuel fixe]
        Option2[Valorisé<br/>Points bénévolat]
        Option3[Bénévole<br/>Aucune rémunération]
    end

    subgraph "Revenus de l'Espace"
        ResRev[Résidents<br/>Gratuit / Prix coûtant / Subventionné]
        ExtRev[Externes<br/>Prix marché]
        TotalRev[Total Revenus]
    end

    subgraph "Distribution"
        Reserves[100% → Réserves ACP]
    end

    ACP -.->|Nomme| Operator
    ACP -.->|Rémunère| Option1

    Operator -->|Gère| ResRev
    Operator -->|Anime| ExtRev

    Residents -->|Paient| ResRev
    External -->|Paient| ExtRev

    ResRev --> TotalRev
    ExtRev --> TotalRev

    TotalRev --> Reserves

    style ACP fill:#e8f5e9
    style Operator fill:#e3f2fd
    style Reserves fill:#c8e6c9
```

### Système de Quotas - Calcul Tarifaire

```mermaid
flowchart TB
    Request([Demande Réservation<br/>X jours])

    Request --> Check{Jours dans quota?}

    Check -->|Oui| WithinQuota[Tarif Dans Quota]
    Check -->|Non| Mixed[Tarif Mixte]

    subgraph "Tarification Dans Quota"
        Personal[Usage Personnel<br/>10€/jour]
        Professional[Usage Professionnel<br/>20€/jour]
    end

    WithinQuota --> CalcNormal[Coût = Jours × Tarif]

    subgraph "Tarification Mixte"
        direction TB
        JoursQuota[Jours dans quota<br/>× Tarif quota]
        JoursHors[Jours hors quota<br/>× 50€/jour]
        Somme[Total = Quota + Hors]
    end

    Mixed --> CalcMixed[Calcul Décomposé]
    CalcMixed --> JoursQuota
    CalcMixed --> JoursHors
    JoursQuota --> Somme
    JoursHors --> Somme

    CalcNormal --> Payment[Paiement]
    Somme --> Payment

    Payment --> Distribution[Distribution 70/30]

    Distribution --> ToACP[70% → Compte ACP]
    Distribution --> ToParticipants[30% → Redistribution<br/>selon quotité]

    style Personal fill:#e3f2fd
    style Professional fill:#fff9c4
    style JoursHors fill:#ffebee
    style ToACP fill:#c8e6c9
    style ToParticipants fill:#ffccbc
```

### Alertes et Conformité

```mermaid
graph TB
    subgraph "5 Types d'Alertes"
        A1[quota_exceeded<br/>Warning]
        A2[insurance_issue<br/>Critical]
        A3[tax_compliance<br/>Critical]
        A4[conflict_of_interest<br/>Warning]
        A5[over_usage<br/>Info]
    end

    subgraph "Détection Automatique"
        D1[Suivi Usage<br/>temps réel]
        D2[Vérification Assurance<br/>modèle commercial]
        D3[Contrôle Fiscal<br/>revenus déclarés]
        D4[Monitoring Équité<br/>accès partagé]
    end

    D1 --> A1
    D1 --> A5
    D2 --> A2
    D3 --> A3
    D4 --> A4

    A1 --> Actions1[Actions:<br/>- Payer hors quota<br/>- Attendre reset<br/>- Proposer transition]

    A2 --> Actions2[Actions:<br/>- Souscrire assurance<br/>- Suspendre activité]

    A3 --> Actions3[Actions:<br/>- Déclaration fiscale<br/>- Régularisation]

    A4 --> Actions4[Actions:<br/>- Vote communauté<br/>- Médiation]

    A5 --> Actions5[Actions:<br/>- Discussion équité<br/>- Ajustement règles]

    subgraph "Résolution"
        Actions1 --> Resolve[Alerte Résolue]
        Actions2 --> Resolve
        Actions3 --> Resolve
        Actions4 --> Resolve
        Actions5 --> Resolve
    end

    style A2 fill:#ffebee
    style A3 fill:#ffebee
    style A1 fill:#fff9c4
    style A4 fill:#fff9c4
    style A5 fill:#e3f2fd
    style Resolve fill:#c8e6c9
```

### Transitions entre Modèles

```mermaid
stateDiagram-v2
    [*] --> ChooseModel: Nouvel espace proposé

    state ChooseModel {
        [*] --> Quota: Usage modéré
        [*] --> Commercial: Usage intensif
        [*] --> Solidaire: Activité collective
    }

    state Quota {
        state "Usage Normal" as normal_q
        state "Dépassement Répété" as exceeded

        normal_q --> exceeded: Alerte récurrente
    }

    state Commercial {
        state "Location Active" as active_c
        state "Volonté Collectivisation" as collectivize

        active_c --> collectivize: Proposition opérateur
    }

    state Solidaire {
        state "Activité Collective" as active_s
        state "Besoin Flexibilité" as need_flex

        active_s --> need_flex: Demande participants
    }

    exceeded --> TransitionVote1: Proposer commercial
    collectivize --> TransitionVote2: Proposer solidaire
    need_flex --> TransitionVote3: Proposer quota

    state "Vote Communautaire" as vote

    TransitionVote1 --> vote
    TransitionVote2 --> vote
    TransitionVote3 --> vote

    vote --> Commercial: Approuvé → Commercial
    vote --> Solidaire: Approuvé → Solidaire
    vote --> Quota: Approuvé → Quota
    vote --> Quota: Rejeté (quota reste)
    vote --> Commercial: Rejeté (commercial reste)
    vote --> Solidaire: Rejeté (solidaire reste)

    Commercial --> [*]: Fin espace
    Solidaire --> [*]: Fin espace
    Quota --> [*]: Fin espace

    note right of vote
        Vote requis:
        - Quorum: 50%
        - Majorité: 50%
        - Méthode: hybride
          (démo + quotité)
    end note
```

### Événements State Machine

```mermaid
graph TB
    subgraph "Gestion Espaces (7 événements)"
        E1[PROPOSE_SHARED_SPACE]
        E2[APPROVE_SHARED_SPACE]
        E3[REJECT_SHARED_SPACE]
        E4[UPDATE_SHARED_SPACE]
        E5[SUSPEND_SHARED_SPACE]
        E6[REOPEN_SHARED_SPACE]
        E7[CLOSE_SHARED_SPACE]
    end

    subgraph "Accords Usage (8 événements)"
        A1[PROPOSE_USAGE_AGREEMENT]
        A2[VOTE_ON_USAGE_AGREEMENT]
        A3[APPROVE_USAGE_AGREEMENT]
        A4[REJECT_USAGE_AGREEMENT]
        A5[SUSPEND_USAGE_AGREEMENT]
        A6[RESUME_USAGE_AGREEMENT]
        A7[END_USAGE_AGREEMENT]
        A8[RENEW_USAGE_AGREEMENT]
    end

    subgraph "Suivi Usage (4 événements)"
        U1[RECORD_SPACE_USAGE]
        U2[CANCEL_SPACE_USAGE]
        U3[RECORD_SPACE_PAYMENT]
        U4[DISTRIBUTE_SPACE_REVENUE]
    end

    subgraph "Quotas (2 événements)"
        Q1[RESET_ANNUAL_QUOTA]
        Q2[QUOTA_ALERT]
    end

    subgraph "Transitions (3 événements)"
        T1[TRANSITION_SPACE_TO_COMMERCIAL]
        T2[TRANSITION_SPACE_TO_SOLIDAIRE]
        T3[TRANSITION_SPACE_TO_QUOTA]
    end

    subgraph "Alertes (4 événements)"
        L1[RAISE_SPACE_ALERT]
        L2[RESOLVE_SPACE_ALERT]
        L3[REQUIRE_INSURANCE_UPDATE]
        L4[REQUIRE_TAX_DECLARATION]
    end

    style E1 fill:#e3f2fd
    style A1 fill:#fff9c4
    style U1 fill:#c8e6c9
    style Q1 fill:#ffccbc
    style T1 fill:#e8f5e9
    style L1 fill:#ffebee
```

---

## Références Code

**State Machines** :
- **Machine principale** : `src/stateMachine/creditCastorMachine.ts`
- **Rent-to-Own** : `src/stateMachine/rentToOwnMachine.ts`
- **Espaces Partagés** : `src/stateMachine/sharedSpaceMachine.ts` *(v1.36.0+)*

**Calculs** :
- **Redistribution** : `src/stateMachine/creditCastorMachine.ts:243-397`
- **Portage** : `src/utils/portageCalculations.ts`
- **Calculateur Principal** : `src/utils/calculatorUtils.ts`

**Types et Événements** :
- **Types** : `src/stateMachine/types.ts`
- **Événements** : `src/stateMachine/events.ts:173-214` (espaces partagés)

**Tests** :
- **Espaces Partagés** : `src/stateMachine/sharedSpace.test.ts` (16/16 tests)

---

**Dernière mise à jour**: 2025-11-15
**Version**: 1.37.0
