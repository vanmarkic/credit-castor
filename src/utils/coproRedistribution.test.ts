/**
 * Test suite for copropriété redistribution calculations
 * 
 * When a newcomer buys from copropriété, the payment is redistributed to all existing
 * participants (founders + earlier newcomers) based on their quotités.
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateCoproRedistribution, 
  type ParticipantForRedistribution
} from './coproRedistribution';

describe('Copropriété Redistribution', () => {
  const T0 = new Date('2024-01-01');
  const T1 = new Date('2025-01-01'); // +1 year
  const T2 = new Date('2026-01-01'); // +2 years
  const T3 = new Date('2027-01-01'); // +3 years
  
  describe('Basic redistribution scenarios', () => {
    it('should redistribute newcomer payment to 2 founders based on quotités', () => {
      const founderA: ParticipantForRedistribution = {
        name: 'Founder A',
        surface: 100,
        isFounder: true,
        entryDate: T0
      };
      
      const founderB: ParticipantForRedistribution = {
        name: 'Founder B',
        surface: 100,
        isFounder: true,
        entryDate: T0
      };
      
      const existingParticipants = [founderA, founderB];
      const newcomerPayment = 343130; // What newcomer C pays for 200m²
      
      const redistribution = calculateCoproRedistribution(
        newcomerPayment,
        existingParticipants,
        T1
      );
      
      // Each founder has 50% quotité (100/200)
      expect(redistribution).toHaveLength(2);
      expect(redistribution[0].participantName).toBe('Founder A');
      expect(redistribution[0].quotite).toBe(0.5);
      expect(redistribution[0].share).toBeCloseTo(171565, 0);
      expect(redistribution[0].yearsHeld).toBeCloseTo(1, 1);
      
      expect(redistribution[1].participantName).toBe('Founder B');
      expect(redistribution[1].quotite).toBe(0.5);
      expect(redistribution[1].share).toBeCloseTo(171565, 0);
      expect(redistribution[1].yearsHeld).toBeCloseTo(1, 1);
      
      // Total redistribution should equal newcomer payment
      const totalRedistributed = redistribution.reduce((sum, r) => sum + r.share, 0);
      expect(totalRedistributed).toBeCloseTo(newcomerPayment, 0);
    });
    
    it('should redistribute to founders with unequal surfaces', () => {
      const founderA: ParticipantForRedistribution = {
        name: 'Founder A',
        surface: 150, // 75% quotité
        isFounder: true,
        entryDate: T0
      };
      
      const founderB: ParticipantForRedistribution = {
        name: 'Founder B',
        surface: 50, // 25% quotité
        isFounder: true,
        entryDate: T0
      };
      
      const existingParticipants = [founderA, founderB];
      const newcomerPayment = 100000;
      
      const redistribution = calculateCoproRedistribution(
        newcomerPayment,
        existingParticipants,
        T1
      );
      
      expect(redistribution[0].quotite).toBe(0.75);
      expect(redistribution[0].share).toBe(75000);
      
      expect(redistribution[1].quotite).toBe(0.25);
      expect(redistribution[1].share).toBe(25000);
    });
  });
  
  describe('Recursive redistribution with multiple newcomers', () => {
    it('should redistribute to founders + earlier newcomer when 2nd newcomer buys', () => {
      // At T+1: Founder A (100m²), Founder B (100m²), Newcomer C (200m²)
      const founderA: ParticipantForRedistribution = {
        name: 'Founder A',
        surface: 100,
        isFounder: true,
        entryDate: T0
      };
      
      const founderB: ParticipantForRedistribution = {
        name: 'Founder B',
        surface: 100,
        isFounder: true,
        entryDate: T0
      };
      
      const newcomerC: ParticipantForRedistribution = {
        name: 'Newcomer C',
        surface: 200,
        isFounder: false,
        entryDate: T1 // Entered at T+1
      };
      
      const existingParticipants = [founderA, founderB, newcomerC];
      const newcomerDPayment = 150000; // What newcomer D pays for 100m²
      
      const redistribution = calculateCoproRedistribution(
        newcomerDPayment,
        existingParticipants,
        T2 // D buys at T+2
      );
      
      // Total surface = 400m²
      // A quotité: 100/400 = 25% = 250/1000
      // B quotité: 100/400 = 25% = 250/1000
      // C quotité: 200/400 = 50% = 500/1000
      
      expect(redistribution).toHaveLength(3);
      
      expect(redistribution[0].participantName).toBe('Founder A');
      expect(redistribution[0].quotite).toBe(0.25);
      expect(redistribution[0].share).toBe(37500);
      expect(redistribution[0].yearsHeld).toBeCloseTo(2, 1); // T0 to T2
      
      expect(redistribution[1].participantName).toBe('Founder B');
      expect(redistribution[1].quotite).toBe(0.25);
      expect(redistribution[1].share).toBe(37500);
      expect(redistribution[1].yearsHeld).toBeCloseTo(2, 1); // T0 to T2
      
      expect(redistribution[2].participantName).toBe('Newcomer C');
      expect(redistribution[2].quotite).toBe(0.5);
      expect(redistribution[2].share).toBe(75000);
      expect(redistribution[2].yearsHeld).toBeCloseTo(1, 1); // T1 to T2 - C only held for 1 year!
      
      // Total redistribution should equal newcomer payment
      const totalRedistributed = redistribution.reduce((sum, r) => sum + r.share, 0);
      expect(totalRedistributed).toBe(newcomerDPayment);
    });
    
    it('should handle multiple generations of newcomers', () => {
      const founderA: ParticipantForRedistribution = {
        name: 'Founder A',
        surface: 100,
        isFounder: true,
        entryDate: T0
      };
      
      const newcomerB: ParticipantForRedistribution = {
        name: 'Newcomer B',
        surface: 100,
        isFounder: false,
        entryDate: T1 // Entered at T+1
      };
      
      const newcomerC: ParticipantForRedistribution = {
        name: 'Newcomer C',
        surface: 100,
        isFounder: false,
        entryDate: T2 // Entered at T+2
      };
      
      const existingParticipants = [founderA, newcomerB, newcomerC];
      const newcomerDPayment = 120000; // What newcomer D pays
      
      const redistribution = calculateCoproRedistribution(
        newcomerDPayment,
        existingParticipants,
        T3 // D buys at T+3
      );
      
      // Each has equal quotité: 100/300 = 1/3
      expect(redistribution).toHaveLength(3);
      
      expect(redistribution[0].quotite).toBeCloseTo(1/3, 5);
      expect(redistribution[0].share).toBeCloseTo(40000, 0);
      expect(redistribution[0].yearsHeld).toBeCloseTo(3, 1); // Founder held 3 years
      
      expect(redistribution[1].quotite).toBeCloseTo(1/3, 5);
      expect(redistribution[1].share).toBeCloseTo(40000, 0);
      expect(redistribution[1].yearsHeld).toBeCloseTo(2, 1); // Newcomer B held 2 years
      
      expect(redistribution[2].quotite).toBeCloseTo(1/3, 5);
      expect(redistribution[2].share).toBeCloseTo(40000, 0);
      expect(redistribution[2].yearsHeld).toBeCloseTo(1, 1); // Newcomer C held 1 year
    });
  });
  
  describe('Edge cases', () => {
    it('should handle single existing participant', () => {
      const founder: ParticipantForRedistribution = {
        name: 'Solo Founder',
        surface: 200,
        isFounder: true,
        entryDate: T0
      };
      
      const redistribution = calculateCoproRedistribution(
        100000,
        [founder],
        T1
      );
      
      expect(redistribution).toHaveLength(1);
      expect(redistribution[0].quotite).toBe(1.0); // 100%
      expect(redistribution[0].share).toBe(100000); // Gets everything
    });
    
    it('should handle zero payment', () => {
      const founder: ParticipantForRedistribution = {
        name: 'Founder',
        surface: 100,
        isFounder: true,
        entryDate: T0
      };
      
      const redistribution = calculateCoproRedistribution(
        0,
        [founder],
        T1
      );
      
      expect(redistribution[0].share).toBe(0);
    });
    
    it('should return empty array when no existing participants', () => {
      const redistribution = calculateCoproRedistribution(
        100000,
        [],
        T1
      );
      
      expect(redistribution).toHaveLength(0);
    });
    
    it('should handle fractional years correctly', () => {
      const founder: ParticipantForRedistribution = {
        name: 'Founder',
        surface: 100,
        isFounder: true,
        entryDate: new Date('2024-01-01')
      };
      
      const saleDate = new Date('2024-07-01'); // 6 months later
      
      const redistribution = calculateCoproRedistribution(
        100000,
        [founder],
        saleDate
      );
      
      expect(redistribution[0].yearsHeld).toBeCloseTo(0.5, 2); // ~0.5 years
    });
  });
  
  describe('Quotité dilution over time', () => {
    it('should show how quotités dilute with each newcomer', () => {
      // Scenario: Track quotité changes for Founder A
      
      // T0: A (100m²), B (100m²) → Total 200m²
      const founderA = { name: 'A', surface: 100, isFounder: true, entryDate: T0 };
      // const founderB = { name: 'B', surface: 100, isFounder: true, entryDate: T0 }; // For documentation
      
      // A's quotité at T0
      let quotiteA = founderA.surface / 200;
      expect(quotiteA).toBe(0.5); // 500/1000
      
      // T1: C joins with 200m² → Total 400m²
      // const newcomerC = { name: 'C', surface: 200, isFounder: false, entryDate: T1 }; // For documentation
      
      // A's quotité at T1 (diluted)
      quotiteA = founderA.surface / 400;
      expect(quotiteA).toBe(0.25); // 250/1000
      
      // T2: D joins with 100m² → Total 500m²
      // const newcomerD = { name: 'D', surface: 100, isFounder: false, entryDate: T2 }; // For documentation
      
      // A's quotité at T2 (further diluted)
      quotiteA = founderA.surface / 500;
      expect(quotiteA).toBe(0.2); // 200/1000
      
      // But A receives redistribution at each step!
    });
  });
  
  describe('Total value verification', () => {
    it('should ensure sum of all shares equals newcomer payment', () => {
      const participants = [
        { name: 'A', surface: 100, isFounder: true, entryDate: T0 },
        { name: 'B', surface: 150, isFounder: true, entryDate: T0 },
        { name: 'C', surface: 200, isFounder: false, entryDate: T1 },
        { name: 'D', surface: 50, isFounder: false, entryDate: T2 },
      ];
      
      const newcomerPayment = 250000;
      
      const redistribution = calculateCoproRedistribution(
        newcomerPayment,
        participants,
        T3
      );
      
      const totalRedistributed = redistribution.reduce((sum, r) => sum + r.share, 0);
      
      // Should equal payment (accounting for floating point precision)
      expect(totalRedistributed).toBeCloseTo(newcomerPayment, 0);
    });
  });
});
