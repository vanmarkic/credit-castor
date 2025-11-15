# Cas d'Usage et Flux de Décision

> **Version actuelle** : 1.37.0
> **Dernière mise à jour** : 2025-11-15
> **Statut** : ✅ Complet et à jour

> Guide pratique des scénarios réels et arbres de décision pour Credit Castor
>
> **Objectif**: Comprendre comment les règles métiers s'appliquent dans des situations concrètes

> **📚 Navigation Documentation**
> - **Guide textuel complet** : [`guide-complet-mecanismes-regles.md`](./guide-complet-mecanismes-regles.md)
> - **Diagrammes visuels** : [`regles-metiers-diagrammes-pedagogiques.md`](./regles-metiers-diagrammes-pedagogiques.md)
> - **Guide de navigation** : [`README-REGLES-METIERS.md`](./README-REGLES-METIERS.md)

## Table des Matières

1. [Parcours Fondateur](#1-parcours-fondateur)
2. [Parcours Nouveau Venu](#2-parcours-nouveau-venu)
3. [Arbres de Décision](#3-arbres-de-décision)
4. [Scénarios Complets](#4-scénarios-complets)
5. [Règles de Validation](#5-règles-de-validation)

---

## 1. Parcours Fondateur

### Lifecycle Complet

```mermaid
journey
    title Parcours d'un Fondateur
    section Acquisition
        Signe compromis: 3: Fondateur
        Obtient prêt bancaire: 4: Fondateur, Banque
        Signe acte notarié: 5: Fondateur, Notaire
        Acte transcrit (T0): 5: Fondateur
    section Copropriété
        Rapport technique: 3: Fondateur, Expert
        Demande PRECAD: 4: Fondateur, Notaire
        PRECAD approuvé: 5: Autorité
        Acte base copro signé: 5: Fondateur
        Acte transcrit: 5: Fondateur
    section Permis
        Demande permis: 4: Fondateur, Architecte
        Permis accordé: 5: Autorité
        Permis promulgué: 5: Autorité
    section Construction
        Déclare lots cachés: 4: Fondateur
        Démarre rénovations: 4: Fondateur
        Complète son lot: 5: Fondateur
    section Portage
        Décide portage lot B: 3: Fondateur
        Paie frais mensuels: 2: Fondateur
        Vend lot B à Gen1: 5: Fondateur, Gen1
        Récupère frais portage: 5: Fondateur
```

### Décisions Clés du Fondateur

```mermaid
flowchart TB
    Start([Fondateur acquiert bâtiment])

    Start --> D1{Combien de lots<br/>pour moi?}

    D1 -->|1 lot| Keep1[Garder 1 lot<br/>Mettre reste en portage]
    D1 -->|2+ lots| Keep2[Garder plusieurs lots<br/>Portage optionnel]

    Keep1 --> Strategy
    Keep2 --> Strategy

    Strategy{Stratégie de vente?}

    Strategy -->|Attendre bons acheteurs| Portage[Portage avec<br/>récupération frais]
    Strategy -->|Vendre vite| CoproFast[Vendre à copropriété<br/>puis copro revend]

    Portage --> PortageWait{Acheteur trouvé?}
    PortageWait -->|Oui| PortageSale[Vente portage<br/>100% au fondateur]
    PortageWait -->|Non, trop long| TransferCopro[Transférer à copropriété]

    CoproFast --> CoproManage[Copropriété gère<br/>Fondateur reçoit 70%<br/>via redistribution]

    TransferCopro --> CoproManage

    PortageSale --> End([Lot vendu])
    CoproManage --> End

    style Portage fill:#e3f2fd
    style PortageSale fill:#c8e6c9
    style CoproManage fill:#fff9c4
```

### Calcul Coûts Fondateur

```mermaid
flowchart LR
    subgraph "Coûts Directs"
        P[Part achat<br/>= surface × prix/m²]
        R[Frais enregistrement<br/>= part × taux %]
        N[Notaire fixe<br/>= 1000€ × nb_lots]
        C[CASCO<br/>= surface × prix/m²]
        Pa[Parachèvements<br/>= surface × prix/m²]
    end

    subgraph "Coûts Partagés"
        FG[Frais généraux 3 ans<br/>÷ nb participants]
        TC[Travaux communs<br/>÷ nb participants]
    end

    subgraph "Financement"
        Cap[Capital apporté]
        Tot[Total coûts]
        Loan[Prêt = Total - Capital]
    end

    P --> Tot
    R --> Tot
    N --> Tot
    C --> Tot
    Pa --> Tot
    FG --> Tot
    TC --> Tot

    Tot --> Loan
    Cap --> Loan

    Loan --> Monthly[Mensualité PMT<br/>ou Double Prêt]

    style Tot fill:#ffccbc
    style Loan fill:#fff9c4
    style Monthly fill:#c8e6c9
```

---

## 2. Parcours Nouveau Venu

### Journey Map

```mermaid
journey
    title Parcours d'un Nouveau Venu
    section Découverte
        Visite projet: 4: Gen1
        Rencontre fondateurs: 5: Gen1, Fondateurs
        Choisit lot disponible: 4: Gen1
    section Négociation
        Calcul prix via quotité: 3: Système
        Reçoit détails financement: 4: Gen1, Banque
        Demande prêt personnel: 4: Gen1, Banque
    section Approbation
        Interview copropriété: 5: Gen1, Tous
        Vote communauté: 5: Tous
        Approbation obtenue: 5: Gen1
    section Achat
        Paie prix convenu: 5: Gen1
        30% va réserves copro: 3: Copro
        70% redistribué fondateurs: 5: Fondateurs
        Devient copropriétaire: 5: Gen1
    section Vie en Copropriété
        Paie charges mensuelles: 3: Gen1
        Participe aux AG: 4: Gen1
        Vote sur nouveaux arrivants: 4: Gen1, Gen2
        Reçoit redistribution Gen2: 5: Gen1
```

### Arbre de Décision Achat

```mermaid
flowchart TB
    Start([Gen1 veut acheter])

    Start --> Source{D'où acheter?}

    Source -->|Lot fondateur portage| Portage
    Source -->|Lot copropriété| Copro

    subgraph Portage[Achat Portage]
        P1[Surface imposée<br/>lot tel quel]
        P2[Prix = Base + Index + Frais]
        P3[100% au fondateur]
        P4[Pas de redistribution]
        P5[Pas d'approbation requise]
    end

    subgraph Copro[Achat Copropriété]
        C1[Surface libre choix<br/>min/max configurable]
        C2[Prix via quotité<br/>proportionnel projet]
        C3[30% réserves copro]
        C4[70% redistribué à TOUS]
        C5[Approbation si classique]
    end

    Portage --> Finance
    Copro --> Finance

    Finance{Financement?}

    Finance -->|Prêt perso| BankLoan[Demande prêt bancaire<br/>Taux personnel]
    Finance -->|Prêt ACP| ACPLoan[Participe prêt collectif<br/>Vote + capital]

    BankLoan --> Complete[Achat complété]
    ACPLoan --> Complete

    Complete --> NewStatus[Nouveau statut:<br/>Copropriétaire]

    NewStatus --> Benefits[Bénéfices:<br/>✓ Reçoit redistributions futures<br/>✓ Vote en AG<br/>✓ Propriétaire de lot]

    style Portage fill:#e3f2fd
    style Copro fill:#c8e6c9
    style Benefits fill:#fff9c4
```

### Calcul Prix Nouveau Venu (Copropriété)

```mermaid
flowchart TB
    Start([Gen1 choisit 60 m²])

    Start --> Context[Contexte:<br/>Surface totale: 300 m²<br/>Coût projet: 600,000€<br/>Années depuis T0: 3 ans]

    Context --> Step1[1. Quotité =<br/>60 / (300 + 60) = 16.67%]

    Step1 --> Step2[2. Prix base =<br/>600,000 × 16.67% = 100,000€]

    Step2 --> Step3[3. Indexation 2%/an composé =<br/>100,000 × 1.02³ - 1 = 6,121€]

    Step3 --> Step4[4. Frais portage =<br/>Copro frais × quotité × 100%<br/>= 30,000 × 16.67% = 5,000€]

    Step4 --> Total[Total Prix:<br/>100,000 + 6,121 + 5,000<br/>= 111,121€]

    Total --> Split{Répartition}

    Split -->|30%| Reserves[Réserves Copro:<br/>33,336€]
    Split -->|70%| Redistrib[Redistribution:<br/>77,785€]

    Redistrib --> Founders[Fondateurs reçoivent<br/>selon leurs quotités<br/>proportionnellement]

    Founders --> Example[Exemple:<br/>Alice 200m² → 66.67% → 51,857€<br/>Bob 100m² → 33.33% → 25,928€]

    style Total fill:#fff9c4
    style Reserves fill:#c8e6c9
    style Redistrib fill:#ffccbc
    style Example fill:#e1f5ff
```

---

## 3. Arbres de Décision

### Choix Type de Financement

```mermaid
flowchart TB
    Start{Participant<br/>a besoin financement?}

    Start -->|Oui| Amount{Montant?}
    Start -->|Non, paie cash| NoCost[Pas de prêt<br/>Pas d'intérêts]

    Amount -->|< 200k| Simple[Prêt Simple<br/>Plus facile<br/>Mensualité constante]

    Amount -->|> 200k| Complex{Veut optimiser<br/>mensualités?}

    Complex -->|Non| Simple
    Complex -->|Oui| Double{A du capital<br/>pour attendre?}

    Double -->|Oui| TwoLoans[Double Prêt<br/>Mensualité basse début<br/>Monte après 2 ans]

    Double -->|Non| CheckACP{Copro a projet<br/>collectif?}

    CheckACP -->|Oui| ACPOption[Prêt ACP Collectif<br/>Taux avantageux<br/>Vote requis]

    CheckACP -->|Non| Simple

    Simple --> End([Décision prise])
    TwoLoans --> End
    ACPOption --> End
    NoCost --> End

    style Simple fill:#c8e6c9
    style TwoLoans fill:#fff9c4
    style ACPOption fill:#e3f2fd
```

### Validation Prix Vente

```mermaid
flowchart TB
    Start([Vente initiée])

    Start --> Type{Type de vente?}

    Type -->|Portage| ValidPortage
    Type -->|Copropriété| ValidCopro
    Type -->|Classique| ValidClassic

    subgraph ValidPortage[Validation Portage]
        VP1{Prix > 0?}
        VP1 -->|Non| VP_ERR[❌ ERREUR]
        VP1 -->|Oui| VP2{Fondateur est<br/>propriétaire lot?}
        VP2 -->|Non| VP_ERR
        VP2 -->|Oui| VP3{Lot marqué<br/>portage?}
        VP3 -->|Non| VP_ERR
        VP3 -->|Oui| VP_OK[✓ VALIDE]
    end

    subgraph ValidCopro[Validation Copropriété]
        VC1{Surface choisie<br/>> 0?}
        VC1 -->|Non| VC_ERR[❌ ERREUR]
        VC1 -->|Oui| VC2{Surface ≤<br/>surface disponible?}
        VC2 -->|Non| VC_ERR
        VC2 -->|Oui| VC3{Quotité calculée<br/>cohérente?}
        VC3 -->|Non| VC_ERR
        VC3 -->|Oui| VC_OK[✓ VALIDE]
    end

    subgraph ValidClassic[Validation Classique]
        VCL1{Acheteur approuvé<br/>par communauté?}
        VCL1 -->|Non| VCL_ERR[❌ ERREUR]
        VCL1 -->|Oui| VCL2{Prix ≤ coût × 1.10?}
        VCL2 -->|Non| VCL_ERR[❌ Prix trop élevé]
        VCL2 -->|Oui| VCL_OK[✓ VALIDE]
    end

    VP_OK --> Process[Traiter vente]
    VC_OK --> Process
    VCL_OK --> Process

    VP_ERR --> Reject[Rejeter vente]
    VC_ERR --> Reject
    VCL_ERR --> Reject

    style VP_OK fill:#c8e6c9
    style VC_OK fill:#c8e6c9
    style VCL_OK fill:#c8e6c9
    style VP_ERR fill:#ffccbc
    style VC_ERR fill:#ffccbc
    style VCL_ERR fill:#ffccbc
```

### Gestion Rent-to-Own

```mermaid
flowchart TB
    Start{Période d'essai<br/>se termine}

    Start --> Buyer{Acheteur<br/>veut acheter?}

    Buyer -->|Oui| Vote[Vote communauté]
    Buyer -->|Non| Extension{Veut prolonger?}
    Buyer -->|Abandonne| Decline[Acheteur renonce<br/>Équité perdue<br/>Lot redevient dispo]

    Extension -->|Oui| ExtCheck{Extensions<br/>restantes?}
    Extension -->|Non| Decline

    ExtCheck -->|Oui| ExtVote[Vote prolongation]
    ExtCheck -->|Non| NoMoreExt[❌ Max extensions<br/>atteint]

    ExtVote -->|Approuvé| AddTime[+ 6 mois période<br/>Continue paiements]
    ExtVote -->|Rejeté| Decline

    Vote -->|Approuvé| Purchase[Finaliser achat<br/>Équité déduite du prix<br/>Complète avec prêt]
    Vote -->|Rejeté| Reject[Communauté refuse<br/>Équité remboursée?<br/>À décider par contrat]

    NoMoreExt --> Decline

    AddTime --> Start
    Purchase --> Success[✓ Achat complété<br/>Nouveau propriétaire]
    Decline --> End([Accord terminé])
    Reject --> End
    Success --> End

    style Success fill:#c8e6c9
    style Purchase fill:#e3f2fd
    style Decline fill:#ffccbc
    style Reject fill:#ffccbc
```

---

## 4. Scénarios Complets

### Scénario 1: Projet 4 Fondateurs → 2 Nouveaux Venus

```mermaid
sequenceDiagram
    participant A as Alice (Fond. 150m²)
    participant B as Bob (Fond. 100m²)
    participant C as Carol (Fond. 75m²)
    participant D as Dave (Fond. 75m²)
    participant Copro as Copropriété
    participant E as Emma (Gen1)
    participant F as Frank (Gen1)

    Note over A,D: T0: Acte transcription<br/>Surface totale: 400 m²<br/>Coût projet: 800,000€

    rect rgb(230, 242, 255)
        Note over A,D: Phase 1: Fondateurs Établissent Copropriété
        A->>Copro: Quotité: 150/400 = 37.5%
        B->>Copro: Quotité: 100/400 = 25%
        C->>Copro: Quotité: 75/400 = 18.75%
        D->>Copro: Quotité: 75/400 = 18.75%
    end

    rect rgb(255, 249, 196)
        Note over E,Copro: Phase 2: Emma achète 50m² de copro
        E->>Copro: Demande achat 50 m²
        Copro->>E: Quotité: 50/(400+50) = 11.11%
        Copro->>E: Prix: 88,889€ (base) + index + frais
        E->>Copro: Paie 100,000€

        Copro->>Copro: Réserves: 30% = 30,000€
        Copro->>A: 70% × 37.5% = 26,250€
        Copro->>B: 70% × 25% = 17,500€
        Copro->>C: 70% × 18.75% = 13,125€
        Copro->>D: 70% × 18.75% = 13,125€

        Note over A,E: Total redistribué: 70,000€<br/>Emma ne reçoit rien (acheteuse)
    end

    rect rgb(255, 235, 238)
        Note over F,Copro: Phase 3: Frank achète 50m² de copro
        F->>Copro: Demande achat 50 m²
        Note over Copro: Surface totale maintenant: 450 + 50 = 500 m²
        Copro->>F: Quotité: 50/500 = 10%
        Copro->>F: Prix: 80,000€ + index + frais
        F->>Copro: Paie 90,000€

        Copro->>Copro: Réserves: 30% = 27,000€

        Note over A,F: Redistribution 70% = 63,000€
        Copro->>A: 63,000 × (150/500) = 18,900€
        Copro->>B: 63,000 × (100/500) = 12,600€
        Copro->>C: 63,000 × (75/500) = 9,450€
        Copro->>D: 63,000 × (75/500) = 9,450€
        Copro->>E: 63,000 × (50/500) = 6,300€ ✨

        Note over E: Emma reçoit maintenant!<br/>Elle était Gen1, Frank est Gen2
    end

    Note over A,F: Résultat Final:<br/>6 copropriétaires<br/>Réserves copro: 57,000€<br/>Dilution quotités progressive
```

### Scénario 2: Fondateur Portage → Vente

```mermaid
sequenceDiagram
    participant F as Fondateur
    participant L as Lot Portage (100m²)
    participant Bank as Banque
    participant N as Nouveau Venu
    participant Copro as Copropriété

    Note over F,L: T0: Fondateur acquiert<br/>Coût: 150,000€<br/>Notaire: 12,500€<br/>Construction: 40,000€

    F->>L: Marque lot portage
    F->>Bank: Prêt 180,000€ @ 4%

    loop Chaque mois pendant 30 mois
        F->>Bank: Paie intérêts: 600€
        F->>Copro: Taxe inoccupé: 32€
        F->>Copro: Assurance: 167€
        Note over F: Frais mensuels: ~800€
    end

    Note over F: Total frais portage: 24,000€<br/>Indexation 2.5 ans: 7,600€

    N->>F: Intéressé par le lot
    F->>N: Prix calculé:<br/>Base: 202,500€<br/>+ Index: 7,600€<br/>+ Frais: 24,000€<br/>= Total: 234,100€

    N->>F: Accepte et paie 234,100€

    F->>Bank: Rembourse prêt
    F->>F: Récupère tous frais
    F->>F: Profit sur indexation

    Note over F,N: Fondateur récupère:<br/>✓ Coût initial<br/>✓ Tous frais portage<br/>✓ Indexation<br/>100% du prix au fondateur
```

### Scénario 3: Prêt ACP Collectif

```mermaid
sequenceDiagram
    participant A as Alice (Fond)
    participant B as Bob (Fond)
    participant C as Carol (Gen1)
    participant Copro as ACP
    participant Bank as Banque

    Note over A,Copro: Besoin: Travaux communs<br/>Coût: 100,000€<br/>Capital requis: 20,000€

    A->>Copro: Propose prêt ACP collectif
    Copro->>Copro: Crée proposition prêt
    Copro->>A: Vote programmé AG

    rect rgb(230, 242, 255)
        Note over A,C: Phase Vote
        A->>Copro: Vote OUI (quotité 40%)
        B->>Copro: Vote OUI (quotité 35%)
        C->>Copro: Vote NON (quotité 25%)

        Copro->>Copro: Calcul résultat hybride:<br/>Démo: 67% OUI<br/>Quotité: 75% OUI<br/>Hybrid: 71% OUI ✓
    end

    Note over Copro: Vote approuvé!<br/>Quorum: ✓<br/>Majorité: ✓

    rect rgb(255, 249, 196)
        Note over A,C: Phase Capital
        Copro->>A: Capital requis: 8,000€ (40%)
        Copro->>B: Capital requis: 7,000€ (35%)
        Copro->>C: Capital requis: 5,000€ (25%)

        A->>Copro: Paie 8,000€
        B->>Copro: Paie 7,000€
        C->>Copro: Paie 5,000€
    end

    rect rgb(200, 230, 201)
        Note over Copro,Bank: Phase Prêt
        Copro->>Bank: Demande prêt 80,000€
        Bank->>Copro: Approuve @ 3% (taux collectif)
        Bank->>Copro: Débloque fonds
    end

    Copro->>Copro: Lance travaux avec 100,000€

    loop Chaque mois
        Copro->>Bank: Rembourse mensualité
        Note over Copro: Charges communes<br/>partagées proportionnellement
    end

    Note over A,C: Avantage prêt collectif:<br/>✓ Taux avantageux (3% vs 4-5%)<br/>✓ Coût partagé<br/>✓ Décision démocratique
```

---

## 5. Règles de Validation

### Validation Participant

```mermaid
flowchart TB
    Start([Ajouter/Modifier<br/>Participant])

    Start --> V1{Nom non vide?}
    V1 -->|Non| E1[❌ Nom requis]
    V1 -->|Oui| V2{Surface > 0?}

    V2 -->|Non| E2[❌ Surface invalide]
    V2 -->|Oui| V3{Capital ≥ 0?}

    V3 -->|Non| E3[❌ Capital négatif]
    V3 -->|Oui| V4{Taux intérêt > 0?}

    V4 -->|Non| E4[❌ Taux invalide]
    V4 -->|Oui| V5{Durée > 0?}

    V5 -->|Non| E5[❌ Durée invalide]
    V5 -->|Oui| V6{Type?}

    V6 -->|Fondateur| VF{Date entrée<br/>= T0?}
    V6 -->|Nouveau| VN{A purchase<br/>details?}

    VF -->|Non| E6[❌ Fondateur doit<br/>entrer à T0]
    VF -->|Oui| Check2Loans

    VN -->|Non| E7[❌ Nouveau venu doit<br/>avoir détails achat]
    VN -->|Oui| Check2Loans

    Check2Loans{Double prêt<br/>activé?}

    Check2Loans -->|Non| OK
    Check2Loans -->|Oui| VL1{loan2Renovation<br/>Amount > 0?}

    VL1 -->|Non| E8[❌ Montant réno<br/>prêt 2 requis]
    VL1 -->|Oui| VL2{Capital1 + Capital2<br/>= Total capital?}

    VL2 -->|Non| E9[❌ Répartition capital<br/>incorrecte]
    VL2 -->|Oui| OK[✓ Participant valide]

    E1 --> Reject[Rejeter]
    E2 --> Reject
    E3 --> Reject
    E4 --> Reject
    E5 --> Reject
    E6 --> Reject
    E7 --> Reject
    E8 --> Reject
    E9 --> Reject

    OK --> Save[Sauvegarder]

    style OK fill:#c8e6c9
    style E1 fill:#ffccbc
    style E2 fill:#ffccbc
    style E3 fill:#ffccbc
    style E4 fill:#ffccbc
    style E5 fill:#ffccbc
    style E6 fill:#ffccbc
    style E7 fill:#ffccbc
    style E8 fill:#ffccbc
    style E9 fill:#ffccbc
```

### Validation Projet

```mermaid
flowchart LR
    subgraph "Validations Structurelles"
        VS1[✓ Au moins 1 participant actif]
        VS2[✓ Total lots ≤ maxTotalLots]
        VS3[✓ Au moins 1 fondateur]
        VS4[✓ Tous fondateurs à même date]
    end

    subgraph "Validations Financières"
        VF1[✓ Prix total > 0]
        VF2[✓ Frais généraux calculés]
        VF3[✓ CASCO global > 0]
        VF4[✓ Tous participants:<br/>coût total > 0]
    end

    subgraph "Validations Timeline"
        VT1[✓ Dates cohérentes<br/>compromis < acte < transcription]
        VT2[✓ Nouveaux venus<br/>après T0]
        VT3[✓ Renovation start<br/>après T0]
    end

    subgraph "Validations Ventes"
        VV1[✓ Acheteur ≠ vendeur]
        VV2[✓ Lot disponible]
        VV3[✓ Prix > 0]
        VV4[✓ Quotités cohérentes]
    end

    VS1 --> Valid
    VS2 --> Valid
    VS3 --> Valid
    VS4 --> Valid
    VF1 --> Valid
    VF2 --> Valid
    VF3 --> Valid
    VF4 --> Valid
    VT1 --> Valid
    VT2 --> Valid
    VT3 --> Valid
    VV1 --> Valid
    VV2 --> Valid
    VV3 --> Valid
    VV4 --> Valid

    Valid{Tout valide?}
    Valid -->|Oui| OK[✓ Projet valide]
    Valid -->|Non| Errors[❌ Afficher erreurs<br/>spécifiques]

    style OK fill:#c8e6c9
    style Errors fill:#ffccbc
```

### Cohérence Quotités

```mermaid
flowchart TB
    Start([Vérifier cohérence quotités])

    Start --> Calc[Calculer somme quotités<br/>de tous participants]

    Calc --> Check{Somme ≈ 1.0?<br/>tolérance 0.01}

    Check -->|Non| Error1{Somme < 0.99?}
    Check -->|Oui| Valid

    Error1 -->|Oui| E1[❌ ERREUR<br/>Surface totale manquante<br/>Vérifier lots copropriété]
    Error1 -->|Non| Error2{Somme > 1.01?}

    Error2 -->|Oui| E2[❌ ERREUR<br/>Surface totale excessive<br/>Double comptage?]
    Error2 -->|Non| Valid

    Valid --> Check2[Vérifier chaque participant]

    Check2 --> Loop{Pour chaque<br/>participant}

    Loop --> Q1{Quotité ≥ 0?}
    Q1 -->|Non| E3[❌ Quotité négative]
    Q1 -->|Oui| Q2{Quotité ≤ 1?}

    Q2 -->|Non| E4[❌ Quotité > 100%]
    Q2 -->|Oui| Q3{Surface > 0?}

    Q3 -->|Non| E5[❌ Surface nulle]
    Q3 -->|Oui| Next{Participant<br/>suivant?}

    Next -->|Oui| Loop
    Next -->|Non| AllValid[✓ Toutes quotités valides]

    E1 --> Report[Rapport erreurs]
    E2 --> Report
    E3 --> Report
    E4 --> Report
    E5 --> Report

    AllValid --> Success[✓ Cohérence validée]

    style Success fill:#c8e6c9
    style E1 fill:#ffccbc
    style E2 fill:#ffccbc
    style E3 fill:#ffccbc
    style E4 fill:#ffccbc
    style E5 fill:#ffccbc
```

---

## Matrice de Compatibilité

### Actions par État du Projet

| Action | pre_purchase | compromis | deed_pending | ownership | copro_creation | copro_established | permit_active | sales_active |
|--------|--------------|-----------|--------------|-----------|----------------|-------------------|---------------|--------------|
| **Ajouter fondateur** | ✓ | ✓ | ✓ | ⚠️ | ⚠️ | ✗ | ✗ | ✗ |
| **Modifier fondateur** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Ajouter nouveau venu** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (via vente) |
| **Marquer lot portage** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Vendre lot** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Modifier params projet** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠️ |
| **Créer prêt ACP** | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |

**Légende:**
- ✓ : Autorisé
- ✗ : Interdit
- ⚠️ : Autorisé mais attention (peut impacter calculs existants)

---

## Formules de Référence Rapide

### 1. Quotité
```
quotité = surface_participant / surface_totale_à_date_vente
```
**Important**: Dénominateur inclut l'acheteur pour calculer son prix

### 2. Indexation Composée
```
indexation = montant_base × [(1 + taux/100)^années - 1]
```
**Défaut**: 2% par an

### 3. Prix Portage
```
prix_total = (achat + notaire + construction) + indexation + frais_portage + rénovations
```
**Récupération**: 100% au fondateur vendeur

### 4. Prix Copropriété
```
base = (coût_projet / surface_totale) × surface_achetée
total = base + indexation + (frais_portage × quotité)
```
**Répartition**: 30% réserves + 70% redistribution

### 5. Redistribution
```
montant_participant = (70% × prix_total) × quotité_participant
```
**Récursif**: Tous participants existants reçoivent (sauf acheteur)

### 6. Frais Généraux
```
honoraires_3ans = CASCO_hors_TVA × 15% × 30%
honoraires_annuels = honoraires_3ans / 3
total_annuel = honoraires_annuels + frais_récurrents (7,988.38€)
total_3ans = total_annuel × 3
par_participant = total_3ans / nb_participants
```

### 7. Double Prêt
```
prêt1 = achat + notaire + frais - capital1
prêt2 = loan2RenovationAmount - capital2
mensualité_période1 = PMT(prêt1)
mensualité_période2 = PMT(prêt1) + PMT(prêt2)
```

---

## Note sur les Espaces Partagés (v1.36.0+)

Ce document se concentre sur les parcours fondateurs et nouveaux venus pour l'acquisition et la gestion des lots.

Pour les **espaces partagés** (ateliers, salles communes, jardins, etc.) avec leurs trois modèles de gouvernance (solidaire, commercial, quota), consulter :
- **Diagrammes complets** : [`regles-metiers-diagrammes-pedagogiques.md` - Section 10](./regles-metiers-diagrammes-pedagogiques.md#10-gestion-des-espaces-partagés)
- **Guide textuel** : [`guide-complet-mecanismes-regles.md` - Section 11](./guide-complet-mecanismes-regles.md#gestion-des-espaces-partagés)

---

**Note**: Ces diagrammes sont des guides pédagogiques. Pour l'implémentation exacte, consulter le code source dans:
- **State Machines** : `src/stateMachine/creditCastorMachine.ts`, `rentToOwnMachine.ts`, `sharedSpaceMachine.ts`
- **Calculs** : `src/utils/portageCalculations.ts`, `calculatorUtils.ts`
- **Types & Événements** : `src/stateMachine/types.ts`, `events.ts`

**Dernière mise à jour**: 2025-11-15
**Version**: 1.37.0
