import { describe, it, expect } from 'vitest';
import type { ExpenseCategories, ExpenseLineItem } from './calculatorUtils';
import { calculateExpenseCategoriesTotal } from './calculatorUtils';

describe('ExpenseCategories data structure', () => {
  it('should define CONSERVATOIRE category with all line items', () => {
    const conservatoire: ExpenseLineItem[] = [
      { label: 'Traitement Mérule', amount: 40000 },
      { label: 'Démolition (mérule)', amount: 20000 },
      { label: 'nettoyage du site', amount: 6000 },
      { label: 'toitures', amount: 10000 },
      { label: 'sécurité du site? (portes, accès..)', amount: 2000 },
    ];

    const total = conservatoire.reduce((sum, item) => sum + item.amount, 0);
    expect(total).toBe(78000);
  });

  it('should define HABITABILITE SOMMAIRE category with all line items', () => {
    const habitabiliteSommaire: ExpenseLineItem[] = [
      { label: 'plomberie', amount: 1000 },
      { label: 'électricité (refaire un tableau)', amount: 1000 },
      { label: 'retirer des lignes (électrique)', amount: 2000 },
      { label: 'isolation thermique', amount: 1000 },
      { label: 'cloisons', amount: 2000 },
      { label: 'chauffage', amount: 0 }, // defaults to 0
    ];

    const total = habitabiliteSommaire.reduce((sum, item) => sum + item.amount, 0);
    expect(total).toBe(7000);
  });

  it('should define PREMIER TRAVAUX category with all line items', () => {
    const premierTravaux: ExpenseLineItem[] = [
      { label: 'poulailler', amount: 150 },
      { label: 'atelier maintenance (et reparation)', amount: 500 },
      { label: 'stockage ressources/énergie/consommables (eau, bois,...)', amount: 700 },
      { label: 'verger prix par 1ha', amount: 2000 },
      { label: 'atelier construction', amount: 2500 },
      { label: 'Cuisine (commune)', amount: 3000 },
      { label: 'travaux chapelle rudimentaires', amount: 5000 },
      { label: 'local + outil jardin', amount: 5000 },
    ];

    const total = premierTravaux.reduce((sum, item) => sum + item.amount, 0);
    expect(total).toBe(18850);
  });

  it('should allow updating expense amounts', () => {
    const expenses: ExpenseLineItem[] = [
      { label: 'Test expense', amount: 1000 },
    ];

    expenses[0].amount = 2000;
    expect(expenses[0].amount).toBe(2000);
  });

  it('should compute total from all categories', () => {
    const categories: ExpenseCategories = {
      conservatoire: [
        { label: 'Traitement Mérule', amount: 40000 },
        { label: 'Démolition (mérule)', amount: 20000 },
        { label: 'nettoyage du site', amount: 6000 },
        { label: 'toitures', amount: 10000 },
        { label: 'sécurité du site? (portes, accès..)', amount: 2000 },
      ],
      habitabiliteSommaire: [
        { label: 'plomberie', amount: 1000 },
        { label: 'électricité (refaire un tableau)', amount: 1000 },
        { label: 'retirer des lignes (électrique)', amount: 2000 },
        { label: 'isolation thermique', amount: 1000 },
        { label: 'cloisons', amount: 2000 },
        { label: 'chauffage', amount: 0 },
      ],
      premierTravaux: [
        { label: 'poulailler', amount: 150 },
        { label: 'atelier maintenance (et reparation)', amount: 500 },
        { label: 'stockage ressources/énergie/consommables (eau, bois,...)', amount: 700 },
        { label: 'verger prix par 1ha', amount: 2000 },
        { label: 'atelier construction', amount: 2500 },
        { label: 'Cuisine (commune)', amount: 3000 },
        { label: 'travaux chapelle rudimentaires', amount: 5000 },
        { label: 'local + outil jardin', amount: 5000 },
      ],
    };

    const conservatoireTotal = categories.conservatoire.reduce((sum, item) => sum + item.amount, 0);
    const habitabiliteSommaireTotal = categories.habitabiliteSommaire.reduce((sum, item) => sum + item.amount, 0);
    const premierTravauxTotal = categories.premierTravaux.reduce((sum, item) => sum + item.amount, 0);
    const grandTotal = conservatoireTotal + habitabiliteSommaireTotal + premierTravauxTotal;

    expect(conservatoireTotal).toBe(78000);
    expect(habitabiliteSommaireTotal).toBe(7000);
    expect(premierTravauxTotal).toBe(18850);
    expect(grandTotal).toBe(103850);
  });
});

describe('Expense categories in ProjectParams', () => {
  it('should include expenseCategories field in ProjectParams', () => {
    const projectParams = {
      totalPurchase: 1000000,
      globalCascoPerM2: 1590,
      expenseCategories: {
        conservatoire: [
          { label: 'Traitement Mérule', amount: 40000 },
        ],
        habitabiliteSommaire: [
          { label: 'plomberie', amount: 1000 },
        ],
        premierTravaux: [
          { label: 'poulailler', amount: 150 },
        ],
      },
    };

    expect(projectParams.expenseCategories).toBeDefined();
    expect(projectParams.expenseCategories.conservatoire).toHaveLength(1);
  });
});

describe('calculateExpenseCategoriesTotal', () => {
  it('should return 0 when expenseCategories is undefined', () => {
    const total = calculateExpenseCategoriesTotal(undefined);
    expect(total).toBe(0);
  });

  it('should return 0 when all categories are empty', () => {
    const categories: ExpenseCategories = {
      conservatoire: [],
      habitabiliteSommaire: [],
      premierTravaux: [],
    };
    const total = calculateExpenseCategoriesTotal(categories);
    expect(total).toBe(0);
  });

  it('should sum all line items across all categories', () => {
    const categories: ExpenseCategories = {
      conservatoire: [
        { label: 'Traitement Mérule', amount: 40000 },
        { label: 'Démolition (mérule)', amount: 20000 },
        { label: 'nettoyage du site', amount: 6000 },
        { label: 'toitures', amount: 10000 },
        { label: 'sécurité du site? (portes, accès..)', amount: 2000 },
      ],
      habitabiliteSommaire: [
        { label: 'plomberie', amount: 1000 },
        { label: 'électricité (refaire un tableau)', amount: 1000 },
        { label: 'retirer des lignes (électrique)', amount: 2000 },
        { label: 'isolation thermique', amount: 1000 },
        { label: 'cloisons', amount: 2000 },
        { label: 'chauffage', amount: 0 },
      ],
      premierTravaux: [
        { label: 'poulailler', amount: 150 },
        { label: 'atelier maintenance (et reparation)', amount: 500 },
        { label: 'stockage ressources/énergie/consommables (eau, bois,...)', amount: 700 },
        { label: 'verger prix par 1ha', amount: 2000 },
        { label: 'atelier construction', amount: 2500 },
        { label: 'Cuisine (commune)', amount: 3000 },
        { label: 'travaux chapelle rudimentaires', amount: 5000 },
        { label: 'local + outil jardin', amount: 5000 },
      ],
    };

    const total = calculateExpenseCategoriesTotal(categories);
    expect(total).toBe(103850); // 78000 + 7000 + 18850
  });

  it('should handle partial categories', () => {
    const categories: ExpenseCategories = {
      conservatoire: [
        { label: 'Test 1', amount: 1000 },
      ],
      habitabiliteSommaire: [],
      premierTravaux: [
        { label: 'Test 2', amount: 500 },
      ],
    };

    const total = calculateExpenseCategoriesTotal(categories);
    expect(total).toBe(1500);
  });
});
