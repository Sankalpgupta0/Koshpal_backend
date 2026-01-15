/**
 * Timezone Utility - UTC ↔ Asia/Kolkata (IST) Conversions
 *
 * CRITICAL: All timestamps are stored in UTC in the database.
 * This utility converts them to IST for frontend display and date calculations.
 *
 * RULES:
 * - Slots are always stored in UTC (startTime, endTime)
 * - slotDate field is added to show which IST date the slot belongs to
 * - Frontend must use slotDate for filtering, not raw timestamp
 * - Never compare raw timestamps with user-selected dates directly
 */

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Convert a UTC timestamp to IST and return only the date (YYYY-MM-DD)
 * This is the primary function for determining which date a slot appears on.
 *
 * Example:
 *   UTC: 2026-01-12 21:30:00 → IST: 2026-01-13 03:00:00 → slotDate: "2026-01-13"
 *
 * @param utcDate - JavaScript Date object (stored in UTC)
 * @returns ISO date string in YYYY-MM-DD format (IST date)
 */
export function getSlotDateInIST(utcDate: Date): string {
  const istDate = new Date(
    utcDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE })
  );

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convert UTC timestamp to IST time string (HH:MM:SS)
 *
 * @param utcDate - JavaScript Date object (stored in UTC)
 * @returns Time string in HH:MM:SS format
 */
export function getSlotTimeInIST(utcDate: Date): string {
  const istDate = new Date(
    utcDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE })
  );

  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format UTC timestamp to IST readable time (e.g., "03:00 PM IST")
 *
 * @param utcDate - JavaScript Date object (stored in UTC)
 * @returns Formatted time string
 */
export function formatSlotTimeInIST(utcDate: Date): string {
  const istDate = new Date(
    utcDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE })
  );

  return istDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format UTC timestamp to readable IST date and time (e.g., "13 Jan 2026, 03:00 PM IST")
 *
 * @param utcDate - JavaScript Date object (stored in UTC)
 * @returns Formatted date and time string
 */
export function formatSlotDateTimeInIST(utcDate: Date): string {
  const istDate = new Date(
    utcDate.toLocaleString('en-US', { timeZone: IST_TIMEZONE })
  );

  return istDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if two dates (in YYYY-MM-DD format) are the same
 * Used to match user-selected calendar date with slot's slotDate
 *
 * @param date1 - Date string in YYYY-MM-DD format
 * @param date2 - Date string in YYYY-MM-DD format
 * @returns true if dates are the same
 */
export function isSameDateIST(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Convert YYYY-MM-DD string to JavaScript Date object (local timezone)
 * Used for calendar date selection and form inputs
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns JavaScript Date object at 00:00:00 local time
 */
export function parseISTDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Get current date in IST as YYYY-MM-DD string
 *
 * @returns Current date in IST format
 */
export function getTodayDateInIST(): string {
  return getSlotDateInIST(new Date());
}

/**
 * Verify slot belongs to selected date by comparing slotDate with selected date
 * This is the CORRECT way to check if a slot matches the user's date selection
 *
 * @param slotDate - slotDate field from API (YYYY-MM-DD in IST)
 * @param selectedDate - User-selected date (YYYY-MM-DD format)
 * @returns true if slot belongs to selected date
 */
export function isSlotOnSelectedDate(slotDate: string, selectedDate: string): boolean {
  return isSameDateIST(slotDate, selectedDate);
}
