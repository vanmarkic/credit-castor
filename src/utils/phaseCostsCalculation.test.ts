import { describe, it, expect } from 'vitest';
import { calculatePhaseCosts, type PhaseCosts } from './phaseCostsCalculation';
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
