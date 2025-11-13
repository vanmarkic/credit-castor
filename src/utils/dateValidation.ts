/**
 * Helper function to safely format a date for HTML date inputs
 *
 * This prevents the "RangeError: Invalid time value" error that occurs
 * when calling .toISOString() on an invalid Date object.
 *
 * @param date - Date object, date string, or null/undefined
 * @param fallback - Fallback date string to use if date is invalid
 * @returns Formatted date string (YYYY-MM-DD) or fallback
 *
 * @example
 * // Valid date
 * formatDateForInput(new Date('2024-03-15'), '2024-01-01')
 * // => '2024-03-15'
 *
 * @example
 * // Invalid date
 * formatDateForInput(undefined, '2024-01-01')
 * // => '2024-01-01'
 */
export function formatDateForInput(
  date: Date | string | undefined | null,
  fallback: string
): string {
  if (!date) return fallback;

  const dateObj = new Date(date);

  // Check if date is valid using isNaN on getTime()
  // Invalid dates return NaN from getTime()
  if (isNaN(dateObj.getTime())) {
    return fallback;
  }

  return dateObj.toISOString().split('T')[0];
}
