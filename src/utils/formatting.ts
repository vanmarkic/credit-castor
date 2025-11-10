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

/**
 * Formats a date in Belgian format with configurable options
 * @param date The date to format (undefined returns 'N/A')
 * @param options Configuration options for formatting
 * @returns Formatted date string (e.g., "15 Jan 2024")
 */
export const formatDate = (
  date: Date | undefined,
  options?: {
    includeDay?: boolean;
    locale?: string;
  }
): string => {
  if (!date) return 'N/A';

  const locale = options?.locale || 'en-BE';
  const config: Intl.DateTimeFormatOptions = {
    month: 'short',
    year: 'numeric',
    ...(options?.includeDay && { day: '2-digit' })
  };

  return new Date(date).toLocaleDateString(locale, config);
};

/**
 * Formats a transaction/event type from SNAKE_CASE to Title Case
 * @param type The type string to format (e.g., "COPRO_SALE")
 * @returns Formatted type string (e.g., "Copro Sale")
 */
export const formatType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};
