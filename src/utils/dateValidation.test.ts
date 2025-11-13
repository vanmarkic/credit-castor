import { describe, it, expect } from 'vitest';

/**
 * Helper function to safely format a date for HTML date inputs
 * Returns fallback if date is invalid
 */
export function formatDateForInput(date: Date | string | undefined | null, fallback: string): string {
  if (!date) return fallback;

  const dateObj = new Date(date);

  // Check if date is valid using isNaN on getTime()
  if (isNaN(dateObj.getTime())) {
    return fallback;
  }

  return dateObj.toISOString().split('T')[0];
}

describe('Date Validation', () => {
  const fallbackDate = '2024-01-01';

  describe('formatDateForInput', () => {
    it('should format valid Date object correctly', () => {
      const date = new Date('2024-03-15');
      expect(formatDateForInput(date, fallbackDate)).toBe('2024-03-15');
    });

    it('should format valid date string correctly', () => {
      expect(formatDateForInput('2024-06-20', fallbackDate)).toBe('2024-06-20');
    });

    it('should return fallback for undefined', () => {
      expect(formatDateForInput(undefined, fallbackDate)).toBe(fallbackDate);
    });

    it('should return fallback for null', () => {
      expect(formatDateForInput(null, fallbackDate)).toBe(fallbackDate);
    });

    it('should return fallback for invalid date string', () => {
      expect(formatDateForInput('invalid-date', fallbackDate)).toBe(fallbackDate);
    });

    it('should return fallback for empty string', () => {
      expect(formatDateForInput('', fallbackDate)).toBe(fallbackDate);
    });

    it('should return fallback for NaN', () => {
      expect(formatDateForInput(new Date(NaN), fallbackDate)).toBe(fallbackDate);
    });

    it('should return fallback for Invalid Date', () => {
      const invalidDate = new Date('not a date');
      expect(formatDateForInput(invalidDate, fallbackDate)).toBe(fallbackDate);
    });

    it('should handle edge case: very old date', () => {
      const oldDate = new Date('1900-01-01');
      expect(formatDateForInput(oldDate, fallbackDate)).toBe('1900-01-01');
    });

    it('should handle edge case: future date', () => {
      const futureDate = new Date('2099-12-31');
      expect(formatDateForInput(futureDate, fallbackDate)).toBe('2099-12-31');
    });
  });

  describe('Inline date formatting (production bug scenario)', () => {
    it('should handle inline IIFE pattern with valid date', () => {
      const entryDate = new Date('2024-03-15');
      const deedDate = '2024-01-01';

      const result = (() => {
        if (!entryDate) return deedDate;
        const date = new Date(entryDate);
        return isNaN(date.getTime()) ? deedDate : date.toISOString().split('T')[0];
      })();

      expect(result).toBe('2024-03-15');
    });

    it('should handle inline IIFE pattern with undefined date', () => {
      const entryDate = undefined;
      const deedDate = '2024-01-01';

      const result = (() => {
        if (!entryDate) return deedDate;
        const date = new Date(entryDate);
        return isNaN(date.getTime()) ? deedDate : date.toISOString().split('T')[0];
      })();

      expect(result).toBe(deedDate);
    });

    it('should handle inline IIFE pattern with invalid date', () => {
      const entryDate = 'invalid';
      const deedDate = '2024-01-01';

      const result = (() => {
        if (!entryDate) return deedDate;
        const date = new Date(entryDate);
        return isNaN(date.getTime()) ? deedDate : date.toISOString().split('T')[0];
      })();

      expect(result).toBe(deedDate);
    });

    it('should NOT throw RangeError when calling toISOString on invalid date (regression test)', () => {
      const entryDate = undefined;
      const deedDate = '2024-01-01';

      // This should NOT throw
      expect(() => {
        const result = (() => {
          if (!entryDate) return deedDate;
          const date = new Date(entryDate as any);
          return isNaN(date.getTime()) ? deedDate : date.toISOString().split('T')[0];
        })();
        return result;
      }).not.toThrow();
    });

    it('should reproduce the original bug (unsafe code that throws)', () => {
      const entryDate = undefined;

      // This WILL throw RangeError: Invalid time value
      expect(() => {
        new Date(entryDate as any).toISOString();
      }).toThrow();
    });
  });
});
