import { describe, it, expect } from 'vitest';
import { calculatePhaseCosts, suggestLoanAllocation, type PhaseCosts } from './phaseCostsCalculation';
import type { ParticipantCalculation } from './calculatorUtils';

describe('calculatePhaseCosts', () => {
  it('should group costs by payment phase', () => {
    const participantCalc: Partial<ParticipantCalculation> = {
      purchaseShare: 35000,
      droitEnregistrements: 5200,
      fraisNotaireFixe: 5000,
      casco: 60000,
      sharedCosts: 15000,
      travauxCommunsPerUnit: 12500,
      parachevements: 25000,
    };

    const result = calculatePhaseCosts(participantCalc as ParticipantCalculation);

    expect(result.signature.total).toBe(45200); // 35000 + 5200 + 5000
    expect(result.construction.total).toBe(87500); // 60000 + 15000 + 12500
    expect(result.emmenagement.total).toBe(25000);
    expect(result.grandTotal).toBe(157700);
  });

  it('should include itemized breakdown for each phase', () => {
    const participantCalc: Partial<ParticipantCalculation> = {
      purchaseShare: 35000,
      droitEnregistrements: 5200,
      fraisNotaireFixe: 5000,
      casco: 60000,
      sharedCosts: 15000,
      travauxCommunsPerUnit: 12500,
      parachevements: 25000,
    };

    const result = calculatePhaseCosts(participantCalc as ParticipantCalculation);

    expect(result.signature.purchaseShare).toBe(35000);
    expect(result.signature.registrationFees).toBe(5200);
    expect(result.signature.notaryFees).toBe(5000);

    expect(result.construction.casco).toBe(60000);
    expect(result.construction.commun).toBe(15000);
    expect(result.construction.travauxCommuns).toBe(12500);

    expect(result.emmenagement.parachevements).toBe(25000);
  });

  it('should handle zero values gracefully', () => {
    const participantCalc: Partial<ParticipantCalculation> = {
      purchaseShare: 0,
      droitEnregistrements: 0,
      fraisNotaireFixe: 0,
      casco: 0,
      sharedCosts: 0,
      travauxCommunsPerUnit: 0,
      parachevements: 0,
    };

    const result = calculatePhaseCosts(participantCalc as ParticipantCalculation);

    expect(result.signature.total).toBe(0);
    expect(result.construction.total).toBe(0);
    expect(result.emmenagement.total).toBe(0);
    expect(result.grandTotal).toBe(0);
  });
});

describe('suggestLoanAllocation', () => {
  it('should allocate signature costs to loan 1 minus capital', () => {
    const phaseCosts: PhaseCosts = {
      signature: { purchaseShare: 35000, registrationFees: 5200, notaryFees: 5000, total: 45200 },
      construction: { casco: 60000, travauxCommuns: 12500, commun: 15000, total: 87500 },
      emmenagement: { parachevements: 25000, total: 25000 },
      grandTotal: 157700,
    };

    const result = suggestLoanAllocation(phaseCosts, 20000, false);

    expect(result.loan1Amount).toBe(25200); // 45200 - 20000 capital
    expect(result.loan2Amount).toBe(87500); // construction costs
    expect(result.includeParachevements).toBe(false);
  });

  it('should include parachevements in loan 2 when toggled', () => {
    const phaseCosts: PhaseCosts = {
      signature: { purchaseShare: 35000, registrationFees: 5200, notaryFees: 5000, total: 45200 },
      construction: { casco: 60000, travauxCommuns: 12500, commun: 15000, total: 87500 },
      emmenagement: { parachevements: 25000, total: 25000 },
      grandTotal: 157700,
    };

    const result = suggestLoanAllocation(phaseCosts, 20000, true);

    expect(result.loan2Amount).toBe(112500); // 87500 + 25000
    expect(result.includeParachevements).toBe(true);
  });

  it('should not go negative if capital exceeds signature costs', () => {
    const phaseCosts: PhaseCosts = {
      signature: { purchaseShare: 35000, registrationFees: 5200, notaryFees: 5000, total: 45200 },
      construction: { casco: 60000, travauxCommuns: 0, commun: 15000, total: 75000 },
      emmenagement: { parachevements: 25000, total: 25000 },
      grandTotal: 145200,
    };

    const result = suggestLoanAllocation(phaseCosts, 50000, false);

    expect(result.loan1Amount).toBe(0); // Capital covers signature
    expect(result.loan2Amount).toBe(70200); // 75000 - (50000 - 45200) excess capital
  });
});
