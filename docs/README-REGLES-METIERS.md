# Documentation Règles Métiers - Guide de Navigation

> **Objectif**: Documentation visuelle et pédagogique complète des règles métiers de Credit Castor

## 📚 Documents Disponibles

### 1. [Règles Métiers - Diagrammes Pédagogiques](./regles-metiers-diagrammes-pedagogiques.md)

**Pour qui**: Tous les membres du projet (développeurs, product owners, stakeholders)

**Contenu**:
- Vue d'ensemble du système
- Cycle de vie du projet (State Machine complète)
- Mécanisme de redistribution copropriété (avec exemples)
- Calculs de portage détaillés
- Types de ventes (Portage, Copropriété, Classique)
- Financement simple vs double prêt
- Frais généraux dynamiques
- Rent-to-Own workflow
- Structures de données (diagrammes de classes)

**Format**: Diagrammes Mermaid (flowcharts, state diagrams, class diagrams)

**Utilisation**:
- Comprendre l'architecture globale
- Visualiser les transitions d'états
- Maîtriser les formules de calcul
- Référence technique pour implémentation

---

### 2. [Cas d'Usage et Flux de Décision](./cas-usage-flux-decision.md)

**Pour qui**: Product Owners, UX/UI designers, QA testers, nouveaux développeurs

**Contenu**:
- Parcours utilisateur complets (Fondateur, Nouveau Venu)
- Arbres de décision pratiques
- Scénarios réels avec séquences détaillées
- Règles de validation
- Matrice de compatibilité actions/états
- Formules de référence rapide

**Format**: Diagrammes Mermaid (journey maps, sequence diagrams, decision trees)

**Utilisation**:
- Comprendre les parcours utilisateurs
- Tester les scénarios edge cases
- Valider les règles métiers
- Onboarding nouveaux membres équipe

---

### 3. [Guide Complet - Mécanismes et Règles](./guide-complet-mecanismes-regles.md)

**Pour qui**: Référence textuelle complète

**Contenu**:
- Explications détaillées de chaque mécanisme
- Exemples chiffrés
- Formules mathématiques
- Intégration calculateur ↔ state machine

**Format**: Markdown avec sections thématiques

**Utilisation**:
- Référence textuelle détaillée
- Complémentaire aux diagrammes visuels
- Documentation des formules

---

## 🎯 Par Rôle

### Développeur Backend
1. Commencer par: [Règles Métiers - Diagrammes Pédagogiques](./regles-metiers-diagrammes-pedagogiques.md)
   - Section 2: State Machine
   - Section 9: Structures de données
2. Approfondir avec: [Guide Complet](./guide-complet-mecanismes-regles.md)
   - Section Machine d'État
   - Section Intégration Calculateur

### Développeur Frontend
1. Commencer par: [Cas d'Usage et Flux de Décision](./cas-usage-flux-decision.md)
   - Section 1: Parcours Fondateur
   - Section 2: Parcours Nouveau Venu
2. Approfondir avec: [Règles Métiers - Diagrammes Pédagogiques](./regles-metiers-diagrammes-pedagogiques.md)
   - Section 5: Types de Ventes
   - Section 6: Financement

### Product Owner / Business Analyst
1. Commencer par: [Cas d'Usage et Flux de Décision](./cas-usage-flux-decision.md)
   - Section 4: Scénarios Complets
2. Approfondir avec: [Guide Complet](./guide-complet-mecanismes-regles.md)
   - Toutes les sections

### QA Tester
1. Commencer par: [Cas d'Usage et Flux de Décision](./cas-usage-flux-decision.md)
   - Section 3: Arbres de Décision
   - Section 5: Règles de Validation
2. Référence: [Règles Métiers - Diagrammes Pédagogiques](./regles-metiers-diagrammes-pedagogiques.md)
   - Résumé des Règles Métiers Critiques

### Nouveau Membre Équipe
**Parcours recommandé** (3 étapes):

1. **Jour 1**: Vue d'ensemble
   - Lire: [Règles Métiers - Diagrammes Pédagogiques](./regles-metiers-diagrammes-pedagogiques.md) - Section 1 (Vue d'ensemble)
   - Objectif: Comprendre les concepts clés (Fondateurs, Quotité, Portage, Redistribution)

2. **Jour 2**: Cycle de vie
   - Lire: [Règles Métiers - Diagrammes Pédagogiques](./regles-metiers-diagrammes-pedagogiques.md) - Section 2 (State Machine)
   - Lire: [Cas d'Usage et Flux de Décision](./cas-usage-flux-decision.md) - Sections 1 & 2 (Parcours utilisateurs)
   - Objectif: Maîtriser le workflow projet

3. **Jour 3+**: Mécanismes spécifiques
   - Selon votre rôle, approfondir les sections pertinentes
   - Consulter le [Guide Complet](./guide-complet-mecanismes-regles.md) pour détails

---

## 🔍 Par Sujet

### Redistribution Copropriété
- **Visuel**: [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 3
- **Exemple concret**: [Cas d'Usage](./cas-usage-flux-decision.md) - Scénario 1
- **Texte**: [Guide Complet](./guide-complet-mecanismes-regles.md) - Section Mécanisme Redistribution

### Portage
- **Visuel**: [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 4
- **Exemple concret**: [Cas d'Usage](./cas-usage-flux-decision.md) - Scénario 2
- **Texte**: [Guide Complet](./guide-complet-mecanismes-regles.md) - Section Calculs Portage

### Financement
- **Visuel**: [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 6
- **Arbre décision**: [Cas d'Usage](./cas-usage-flux-decision.md) - Section 3 (Choix Type Financement)
- **Texte**: [Guide Complet](./guide-complet-mecanismes-regles.md) - Section Financement à Deux Prêts

### Ventes
- **Visuel**: [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 5
- **Validation**: [Cas d'Usage](./cas-usage-flux-decision.md) - Section 3 (Validation Prix Vente)
- **Texte**: [Guide Complet](./guide-complet-mecanismes-regles.md) - Section Machine d'État (Types de Ventes)

### Frais Généraux
- **Visuel**: [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 7
- **Texte**: [Guide Complet](./guide-complet-mecanismes-regles.md) - Section Frais Généraux Dynamiques

### Rent-to-Own
- **Visuel**: [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 8
- **Arbre décision**: [Cas d'Usage](./cas-usage-flux-decision.md) - Section 3 (Gestion Rent-to-Own)

---

## 📖 Glossaire Rapide

| Terme | Définition | Document Référence |
|-------|------------|-------------------|
| **T0** | Date acte transcription - Point de départ calculs | [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 2 |
| **Quotité** | Part propriété = surface / surface totale | [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 3 |
| **Fondateur** | Participant original à T0 | [Guide Complet](./guide-complet-mecanismes-regles.md) |
| **Gen1, Gen2** | Nouveaux venus (générations après T0) | [Cas d'Usage](./cas-usage-flux-decision.md) - Scénario 1 |
| **Portage** | Fondateur conserve lot en attendant acheteur | [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 4 |
| **CASCO** | Coût construction coque (hors finitions) | [Guide Complet](./guide-complet-mecanismes-regles.md) |
| **Parachèvements** | Coûts finition après CASCO | [Guide Complet](./guide-complet-mecanismes-regles.md) |
| **ACP** | Association de Co-Propriétaires | [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 2 |
| **PRECAD** | Pré-cadastre (étape légale copropriété) | [Règles Métiers](./regles-metiers-diagrammes-pedagogiques.md) - Section 2 |

---

## 🎨 Visualisation des Diagrammes

Les diagrammes Mermaid sont automatiquement rendus sur:
- **GitHub**: Affichage natif dans les fichiers .md
- **GitLab**: Affichage natif dans les fichiers .md
- **VS Code**: Extension "Markdown Preview Mermaid Support"
- **En ligne**: https://mermaid.live/ (copier-coller code)

### Exporter les Diagrammes

Pour exporter en PNG/SVG:
1. Ouvrir https://mermaid.live/
2. Copier le code Mermaid d'un diagramme
3. Cliquer "Actions" → "Export PNG" ou "Export SVG"

---

## 📝 Formules de Référence Ultra-Rapide

```
Quotité = surface_participant / surface_totale

Indexation = base × [(1 + 2%)^années - 1]

Prix Portage = base + indexation + frais_portage

Prix Copro = base + indexation + (frais × quotité)

Redistribution = 70% × quotité_participant

Frais Généraux = (CASCO × 4.5%) / 3 + 7,988€
```

---

## 🔗 Références Code Source

| Mécanisme | Fichier Source |
|-----------|----------------|
| State Machine | `src/stateMachine/creditCastorMachine.ts` |
| Redistribution Copro | `creditCastorMachine.ts:243-397` |
| Calculs Portage | `src/utils/portageCalculations.ts` |
| Calculateur Principal | `src/utils/calculatorUtils.ts` |
| Rent-to-Own | `src/stateMachine/rentToOwnMachine.ts` |
| Timeline | `src/utils/timelineCalculations.ts` |
| Transactions | `src/utils/transactionCalculations.ts` |

---

## 💡 Questions Fréquentes

### Q: Pourquoi la quotité inclut l'acheteur au dénominateur?
**R**: Pour calculer le prix juste basé sur la proportion du projet total. L'acheteur paie pour sa part du projet, donc sa surface doit être incluse dans le calcul. Voir [Règles Métiers - Section 3](./regles-metiers-diagrammes-pedagogiques.md#3-mécanisme-de-redistribution-copropriété).

### Q: Gen1 reçoit-il de l'argent quand Gen2 arrive?
**R**: Oui! C'est le mécanisme de redistribution récursive. Voir [Cas d'Usage - Scénario 1](./cas-usage-flux-decision.md#scénario-1-projet-4-fondateurs--2-nouveaux-venus).

### Q: Quelle différence entre vente portage et copropriété?
**R**:
- **Portage**: Fondateur vend son lot → 100% au fondateur
- **Copropriété**: Copro vend lot caché → 30% réserves + 70% redistribution à tous

Voir [Règles Métiers - Section 5](./regles-metiers-diagrammes-pedagogiques.md#5-types-de-ventes).

### Q: Comment choisir entre prêt simple et double prêt?
**R**: Double prêt si:
- Montant > 200k€
- Volonté d'optimiser mensualités
- Capital disponible pour attendre période initiale

Voir [Cas d'Usage - Arbres de Décision](./cas-usage-flux-decision.md#choix-type-de-financement).

---

## 📊 Statistiques Documentation

- **3 documents principaux**
- **~50 diagrammes Mermaid**
- **10+ scénarios complets**
- **Couverture**: 100% des règles métiers
- **Formats**: State diagrams, Flowcharts, Sequence diagrams, Class diagrams, Journey maps

---

## 🔄 Maintenance

Cette documentation doit être mise à jour lors de:
- ✅ Modification des règles métiers
- ✅ Ajout de nouveaux mécanismes
- ✅ Changements dans la state machine
- ✅ Nouvelles formules de calcul
- ✅ Breaking changes dans les interfaces

**Responsable**: Équipe de développement
**Fréquence**: À chaque changement métier significatif

---

**Créé**: 2025-11-15
**Version**: 1.36.0
**Statut**: ✅ Complet et à jour
