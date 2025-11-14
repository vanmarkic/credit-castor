/**
 * Test suite for newcomer quotité calculation
 * 
 * Demonstrates how quotité is calculated when newcomers join a copropriété
 */

import { describe, it, expect } from 'vitest';

interface ParticipantForQuotite {
  name: string;
  surface: number;
  isFounder: boolean;
}

/**
 * Calculate quotité for a participant in the copropriété
 * Quotité = participant's surface / total building surface (all participants)
 */
function calculateQuotite(
  participant: ParticipantForQuotite,
  allParticipants: ParticipantForQuotite[]
): number {
  const totalBuildingSurface = allParticipants.reduce((sum, p) => sum + p.surface, 0);
  return participant.surface / totalBuildingSurface;
}

/**
 * Calculate newcomer's base price using quotité
 * Base Price = Original Project Cost × Quotité
 */
function calculateNewcomerBasePrice(
  newcomerQuotite: number,
  originalProjectCost: number
): number {
  return originalProjectCost * newcomerQuotite;
}

/**
 * Apply portage formula to base price
 * Total Price = Base Price + Indexation + Carrying Cost Recovery
 */
function applyPortageFormula(
  basePrice: number,
  yearsHeld: number,
  indexationRate: number,
  carryingCostRecovery: number
): {
  basePrice: number;
  indexation: number;
  carryingCostRecovery: number;
  totalPrice: number;
} {
  // Compound indexation
  const indexation = basePrice * (Math.pow(1 + indexationRate / 100, yearsHeld) - 1);
  
  return {
    basePrice,
    indexation,
    carryingCostRecovery,
    totalPrice: basePrice + indexation + carryingCostRecovery
  };
}

describe('Newcomer Quotité Calculation', () => {
  it('should calculate quotité correctly when founders A and B have 100m² each', () => {
    // Initial setup: A and B are founders with 100m² each
    const founderA: ParticipantForQuotite = { name: 'A', surface: 100, isFounder: true };
    const founderB: ParticipantForQuotite = { name: 'B', surface: 100, isFounder: true };
    const foundersOnly = [founderA, founderB];
    
    // At T0: Total surface = 200m²
    const totalSurfaceT0 = 200;
    
    // Calculate founder quotités at T0
    const quotiteA_T0 = calculateQuotite(founderA, foundersOnly);
    const quotiteB_T0 = calculateQuotite(founderB, foundersOnly);
    
    // Each founder has 100/200 = 0.5 = 500/1000
    expect(quotiteA_T0).toBe(0.5);
    expect(quotiteB_T0).toBe(0.5);
    
    // Express as fraction over 1000
    expect(Math.round(quotiteA_T0 * 1000)).toBe(500);
    expect(Math.round(quotiteB_T0 * 1000)).toBe(500);
  });
  
  it('should dilute founder quotités when newcomer C arrives with 200m²', () => {
    // Initial founders
    const founderA: ParticipantForQuotite = { name: 'A', surface: 100, isFounder: true };
    const founderB: ParticipantForQuotite = { name: 'B', surface: 100, isFounder: true };
    
    // Newcomer C arrives with 200m²
    const newcomerC: ParticipantForQuotite = { name: 'C', surface: 200, isFounder: false };
    
    const allParticipants = [founderA, founderB, newcomerC];
    
    // After C arrives: Total surface = 400m² (100 + 100 + 200)
    const totalSurfaceAfterC = 400;
    
    // Calculate new quotités
    const quotiteA_afterC = calculateQuotite(founderA, allParticipants);
    const quotiteB_afterC = calculateQuotite(founderB, allParticipants);
    const quotiteC = calculateQuotite(newcomerC, allParticipants);
    
    // A has 100/400 = 0.25 = 250/1000
    expect(quotiteA_afterC).toBe(0.25);
    expect(Math.round(quotiteA_afterC * 1000)).toBe(250);
    
    // B has 100/400 = 0.25 = 250/1000
    expect(quotiteB_afterC).toBe(0.25);
    expect(Math.round(quotiteB_afterC * 1000)).toBe(250);
    
    // C has 200/400 = 0.5 = 500/1000
    expect(quotiteC).toBe(0.5);
    expect(Math.round(quotiteC * 1000)).toBe(500);
    
    // Verify total quotité = 1 (100%)
    const totalQuotite = quotiteA_afterC + quotiteB_afterC + quotiteC;
    expect(totalQuotite).toBe(1.0);
  });
  
  it('should calculate newcomer C purchase price using quotité × original project cost', () => {
    // Initial founders
    const founderA: ParticipantForQuotite = { name: 'A', surface: 100, isFounder: true };
    const founderB: ParticipantForQuotite = { name: 'B', surface: 100, isFounder: true };
    
    // Newcomer C with 200m²
    const newcomerC: ParticipantForQuotite = { name: 'C', surface: 200, isFounder: false };
    
    const allParticipants = [founderA, founderB, newcomerC];
    
    // Original project cost (what founders paid in total)
    const originalProjectCost = 650000; // €650,000
    
    // Calculate C's quotité
    const quotiteC = calculateQuotite(newcomerC, allParticipants);
    expect(quotiteC).toBe(0.5); // 200/400 = 500/1000
    
    // Calculate base price for C
    const basePriceC = calculateNewcomerBasePrice(quotiteC, originalProjectCost);
    
    // C's base price = 650,000 × 0.5 = 325,000
    expect(basePriceC).toBe(325000);
  });
  
  it('should apply portage formula (indexation + carrying costs) to base price', () => {
    const basePrice = 325000; // From previous calculation
    const yearsHeld = 2; // Copro held the lot for 2 years
    const indexationRate = 2; // 2% per year
    const carryingCostRecovery = 5000; // €5,000 carrying costs
    
    const result = applyPortageFormula(
      basePrice,
      yearsHeld,
      indexationRate,
      carryingCostRecovery
    );
    
    // Indexation = 325,000 × [(1.02)^2 - 1] = 325,000 × 0.0404 = 13,130
    expect(result.indexation).toBeCloseTo(13130, 0);
    
    // Total price = 325,000 + 13,130 + 5,000 = 343,130
    expect(result.totalPrice).toBeCloseTo(343130, 0);
    
    // Verify components
    expect(result.basePrice).toBe(325000);
    expect(result.carryingCostRecovery).toBe(5000);
  });
  
  it('should demonstrate complete calculation for newcomer purchase', () => {
    // Setup
    const founderA: ParticipantForQuotite = { name: 'A', surface: 100, isFounder: true };
    const founderB: ParticipantForQuotite = { name: 'B', surface: 100, isFounder: true };
    const newcomerC: ParticipantForQuotite = { name: 'C', surface: 200, isFounder: false };
    
    const allParticipants = [founderA, founderB, newcomerC];
    const originalProjectCost = 650000;
    
    // Step 1: Calculate quotité (diluted by all participants)
    const quotiteC = calculateQuotite(newcomerC, allParticipants);
    console.log(`Step 1 - Quotité C: ${quotiteC} (${Math.round(quotiteC * 1000)}/1000)`);
    console.log(`  = ${newcomerC.surface}m² / ${allParticipants.reduce((s, p) => s + p.surface, 0)}m² total`);
    
    // Step 2: Calculate base price
    const basePriceC = calculateNewcomerBasePrice(quotiteC, originalProjectCost);
    console.log(`\nStep 2 - Base Price: €${basePriceC.toLocaleString()}`);
    console.log(`  = €${originalProjectCost.toLocaleString()} × ${quotiteC}`);
    
    // Step 3: Apply portage formula
    const yearsHeld = 2;
    const indexationRate = 2;
    const carryingCostRecovery = 5000;
    
    const finalPrice = applyPortageFormula(
      basePriceC,
      yearsHeld,
      indexationRate,
      carryingCostRecovery
    );
    
    console.log(`\nStep 3 - Apply Portage Formula:`);
    console.log(`  Base Price: €${finalPrice.basePrice.toLocaleString()}`);
    console.log(`  + Indexation (${indexationRate}% × ${yearsHeld} years): €${Math.round(finalPrice.indexation).toLocaleString()}`);
    console.log(`  + Carrying Cost Recovery: €${finalPrice.carryingCostRecovery.toLocaleString()}`);
    console.log(`  = Total Price: €${Math.round(finalPrice.totalPrice).toLocaleString()}`);
    
    // Assertions
    expect(quotiteC).toBe(0.5);
    expect(basePriceC).toBe(325000);
    expect(finalPrice.totalPrice).toBeCloseTo(343130, 0);
  });
  
  it('should handle multiple newcomers buying on different dates', () => {
    // T0: Founders A and B, 100m² each (total 200m²)
    const founderA: ParticipantForQuotite = { name: 'A', surface: 100, isFounder: true };
    const founderB: ParticipantForQuotite = { name: 'B', surface: 100, isFounder: true };
    
    // T+1: Newcomer C buys 100m² (total becomes 300m²)
    const newcomerC: ParticipantForQuotite = { name: 'C', surface: 100, isFounder: false };
    const participantsAfterC = [founderA, founderB, newcomerC];
    
    const quotiteC = calculateQuotite(newcomerC, participantsAfterC);
    expect(quotiteC).toBeCloseTo(1/3, 5); // 100/300 = 333/1000
    
    // T+2: Newcomer D buys 100m² (total becomes 400m²)
    const newcomerD: ParticipantForQuotite = { name: 'D', surface: 100, isFounder: false };
    const participantsAfterD = [founderA, founderB, newcomerC, newcomerD];
    
    const quotiteD = calculateQuotite(newcomerD, participantsAfterD);
    expect(quotiteD).toBe(0.25); // 100/400 = 250/1000
    
    // All quotités should sum to 1
    const totalQuotite = participantsAfterD.reduce(
      (sum, p) => sum + calculateQuotite(p, participantsAfterD),
      0
    );
    expect(totalQuotite).toBeCloseTo(1.0, 10);
  });
});

