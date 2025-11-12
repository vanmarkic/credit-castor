import { describe, it, expect } from 'vitest';
import { calculateCooproTransaction } from './transactionCalculations';
import type { Participant } from './calculatorUtils';
import type { TimelineSnapshot } from '../types/timeline';

describe('Copro redistribution - Surface-based distribution', () => {
  it('should distribute copro proceeds based on surface quotité, not time', () => {
    const deedDate = new Date('2024-01-01');

    // Founder 1: 100m²
    const founder1: Participant = {
      name: 'Founder1',
      surface: 100,
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: deedDate,
      unitId: 1,
      quantity: 1
    };

    // Founder 2: 50m²
    const founder2: Participant = {
      name: 'Founder2',
      surface: 50,
      capitalApporte: 50000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: deedDate,
      unitId: 2,
      quantity: 1
    };

    // Newcomer buying from Copropriété for €200,000
    const newcomer: Participant = {
      name: 'Newcomer',
      surface: 80,
      capitalApporte: 60000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2025-01-01'),
      unitId: 3,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 100,
        purchasePrice: 200000
      }
    };

    const allParticipants = [founder1, founder2, newcomer];

    const mockSnapshot: TimelineSnapshot = {
      date: new Date('2025-01-01'),
      participantName: 'Founder1',
      participantIndex: 0,
      totalCost: 300000,
      loanNeeded: 200000,
      monthlyPayment: 1000,
      isT0: false,
      colorZone: 1,
      showFinancingDetails: true
    };

    // Calculate transaction for Founder1 (100m²)
    const transaction1 = calculateCooproTransaction(
      founder1,
      newcomer,
      mockSnapshot,
      allParticipants,
      25 // 25% to copro reserves, 75% to participants
    );

    // Expected calculation:
    // Copro gets: 200,000 × 25% = 50,000
    // Participants get: 200,000 × 75% = 150,000
    // Total founder surface: 100 + 50 = 150m²
    // Founder1 quotité: 100/150 = 66.67%
    // Founder1 gets: 150,000 × (100/150) = 100,000

    expect(transaction1.delta.totalCost).toBe(-100000);
    expect(transaction1.delta.loanNeeded).toBe(-100000);

    // Calculate transaction for Founder2 (50m²)
    const mockSnapshot2: TimelineSnapshot = {
      ...mockSnapshot,
      participantName: 'Founder2',
      participantIndex: 1
    };

    const transaction2 = calculateCooproTransaction(
      founder2,
      newcomer,
      mockSnapshot2,
      allParticipants,
      25 // 25% to copro reserves, 75% to participants
    );

    // Founder2 quotité: 50/150 = 33.33%
    // Founder2 gets: 150,000 × (50/150) = 50,000

    expect(transaction2.delta.totalCost).toBe(-50000);
    expect(transaction2.delta.loanNeeded).toBe(-50000);
  });

  it('should handle custom coproReservesShare percentages', () => {
    const deedDate = new Date('2024-01-01');

    const founder: Participant = {
      name: 'Founder',
      surface: 100,
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: true,
      entryDate: deedDate,
      unitId: 1,
      quantity: 1
    };

    const newcomer: Participant = {
      name: 'Newcomer',
      surface: 80,
      capitalApporte: 60000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 25,
      isFounder: false,
      entryDate: new Date('2025-01-01'),
      unitId: 2,
      quantity: 1,
      purchaseDetails: {
        buyingFrom: 'Copropriété',
        lotId: 100,
        purchasePrice: 100000
      }
    };

    const allParticipants = [founder, newcomer];

    const mockSnapshot: TimelineSnapshot = {
      date: new Date('2025-01-01'),
      participantName: 'Founder',
      participantIndex: 0,
      totalCost: 300000,
      loanNeeded: 200000,
      monthlyPayment: 1000,
      isT0: false,
      colorZone: 1,
      showFinancingDetails: true
    };

    // With 30% to copro reserves (default)
    const transaction30 = calculateCooproTransaction(
      founder,
      newcomer,
      mockSnapshot,
      allParticipants,
      30
    );

    // 100,000 × 70% = 70,000 (single founder gets 100%)
    expect(transaction30.delta.totalCost).toBe(-70000);

    // With 60% to copro reserves
    const transaction60 = calculateCooproTransaction(
      founder,
      newcomer,
      mockSnapshot,
      allParticipants,
      60
    );

    // 100,000 × 40% = 40,000 (single founder gets 100%)
    expect(transaction60.delta.totalCost).toBe(-40000);
  });
});
