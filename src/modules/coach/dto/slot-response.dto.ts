/**
 * Enhanced Slot Response DTOs with timezone-aware slotDate field
 *
 * IMPORTANT: These DTOs include the slotDate field which represents
 * the date in Asia/Kolkata timezone (YYYY-MM-DD format).
 * This field is computed at the API layer and prevents timezone bugs.
 */

export class SlotDateTimeDto {
  /**
   * Slot unique identifier
   */
  id: string;

  /**
   * ISO 8601 UTC timestamp - DO NOT use for date filtering
   */
  startTime: string; // ISO string in UTC

  /**
   * ISO 8601 UTC timestamp - DO NOT use for date filtering
   */
  endTime: string; // ISO string in UTC

  /**
   * CRITICAL: The date this slot belongs to in Asia/Kolkata timezone
   * Format: YYYY-MM-DD
   * Use this for filtering and matching against user-selected calendar dates
   */
  slotDate: string; // YYYY-MM-DD in IST

  status: string; // 'AVAILABLE' | 'BOOKED' | 'CANCELLED'
}

export class CoachSlotResponseDto extends SlotDateTimeDto {
  /**
   * Coach that owns this slot
   */
  coachId: string;
}

export class CoachWithSlotsResponseDto {
  coachId: string;
  coachName: string;
  expertise: string[];
  slots: Array<{
    slotId: string;
    startTime: string; // ISO UTC
    endTime: string; // ISO UTC
    slotDate: string; // YYYY-MM-DD in IST
    status: string;
  }>;
}

export class SlotAvailabilityDateDto {
  /**
   * Date in YYYY-MM-DD format (IST)
   */
  date: string;

  /**
   * Whether this date has available slots
   */
  hasSlots: boolean;

  /**
   * Number of available slots on this date
   */
  slotCount: number;
}
