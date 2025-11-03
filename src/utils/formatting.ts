/**
 * Formats a number as currency in EUR (European format)
 * @param value The numeric value to format
 * @returns Formatted currency string (e.g., "€123,456")
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
};
