/**
 * Time Constants
 *
 * Centralized time conversion constants used throughout the application
 * for consistent date/time calculations.
 */

/**
 * Days per year (accounting for leap years)
 *
 * Value: 365.25
 * The 0.25 accounts for leap years in the Gregorian calendar.
 *
 * Used for converting time differences to years in duration calculations.
 */
export const DAYS_PER_YEAR = 365.25;

/**
 * Average days per month (accounting for varying month lengths)
 *
 * Value: 365.25 / 12 = 30.4375 ≈ 30.44
 * The 0.25 accounts for leap years in the Gregorian calendar.
 *
 * Used for converting time differences in days to months in duration calculations.
 */
export const AVERAGE_DAYS_PER_MONTH = 30.44;
