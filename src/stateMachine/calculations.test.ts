import { describe, it, expect } from 'vitest';
import { calculateIndexation } from './calculations';

describe('Indexation Calculation', () => {
  it('should calculate indexation using Belgian legal index', () => {
    const indexRates = [
      { year: 2023, rate: 1.02 },
      { year: 2024, rate: 1.03 }
    ];

    const result = calculateIndexation(
      new Date('2023-01-01'),
      new Date('2025-01-01'),
      indexRates
    );

    // 2 years: 1.02 × 1.03 = 1.0506 → 5.06% growth
    expect(result).toBeCloseTo(0.0506, 3);
  });

  it('should handle partial years', () => {
    const indexRates = [
      { year: 2023, rate: 1.02 }
    ];

    const result = calculateIndexation(
      new Date('2023-01-01'),
      new Date('2023-07-01'),
      indexRates
    );

    // 0.5 years: partial application
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(0.02);
  });
});
