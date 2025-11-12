import { describe, it, expect } from 'vitest';
import { validateTwoLoanFinancing } from './twoLoanValidation';
import type { Participant } from './calculatorUtils';

describe('validateTwoLoanFinancing', () => {
  it('should return no errors for valid two-loan config', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2DelayYears: 2,
      loan2RenovationAmount: 50000,
      capitalForLoan1: 50000,
      capitalForLoan2: 50000,
    };

    const errors = validateTwoLoanFinancing(participant, 100000);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should error when capital allocation exceeds available capital', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      capitalForLoan1: 70000,
      capitalForLoan2: 50000, // Total 120k > 100k
    };

    const errors = validateTwoLoanFinancing(participant, 100000);
    expect(errors.capitalAllocation).toBeDefined();
    expect(errors.capitalAllocation).toContain('dépasse le capital disponible');
  });

  it('should error when renovation amount exceeds total renovation', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2RenovationAmount: 150000, // Greater than 100k total
    };

    const errors = validateTwoLoanFinancing(participant, 100000);
    expect(errors.renovationAmount).toBeDefined();
  });

  it('should error when loan delay >= total duration', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: true,
      loan2DelayYears: 20, // Same as duration
    };

    const errors = validateTwoLoanFinancing(participant, 100000);
    expect(errors.loanDelay).toBeDefined();
  });

  it('should return no errors when useTwoLoans is false', () => {
    const participant: Participant = {
      name: 'Test',
      capitalApporte: 100000,
      registrationFeesRate: 12.5,
      interestRate: 4.5,
      durationYears: 20,
      useTwoLoans: false,
      // Invalid values but shouldn't matter
      capitalForLoan1: 200000,
      loan2RenovationAmount: 500000,
    };

    const errors = validateTwoLoanFinancing(participant, 50000);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
