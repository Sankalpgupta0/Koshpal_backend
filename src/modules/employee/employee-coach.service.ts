import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SlotStatus } from '@prisma/client';
import { getSlotDateInIST } from '../../common/utils/timezone.util';

/**
 * Employee Coach Service
 *
 * Business logic for aggregated coach availability queries.
 * Optimized to prevent N+1 queries and provide bulk data efficiently.
 *
 * CRITICAL: All slots now include a slotDate field (YYYY-MM-DD in Asia/Kolkata timezone)
 * This field must be used by the frontend for date filtering and calendar matching.
 */
@Injectable()
export class EmployeeCoachService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get Slots Grouped By Coach
   *
   * Retrieves all available slots for all active coaches on a given date.
   * Uses a single optimized Prisma query with proper relations to avoid N+1 issues.
   *
   * CRITICAL CHANGE: Each slot now includes a slotDate field (YYYY-MM-DD in IST).
   * Frontend must use slotDate for filtering, not raw timestamps.
   *
   * Algorithm:
   * 1. Parse date string to start/end of day timestamps
   * 2. Query all AVAILABLE slots with coach profile included
   * 3. Filter for active coaches only
   * 4. Group slots by coach
   * 5. Sort slots by start time within each coach group
   * 6. Add slotDate field (IST) to each slot
   *
   * @param dateStr - Date string in YYYY-MM-DD format
   * @returns Array of coaches with their available slots, grouped and sorted (includes slotDate)
   *
   * @performance Single database query with JOIN - O(n) complexity
   */
  async getSlotsGroupedByCoach(dateStr: string) {
    // CRITICAL FIX: Query by startTime UTC range that covers the entire IST day
    // For IST date 2026-01-13, we need UTC times from:
    // Jan 12 18:30 UTC (Jan 13 00:00 IST) to Jan 13 18:29 UTC (Jan 13 23:59 IST)
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Calculate UTC range for the IST date
    // IST midnight = UTC 18:30 previous day
    const istMidnightInUTC = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
    // IST 23:59:59 = UTC 18:29:59 same day
    const istEndOfDayInUTC = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));

    // Single optimized query: fetch all available slots with coach data
    // Query by startTime (reliable) not date field
    const slots = await this.prisma.coachSlot.findMany({
      where: {
        startTime: {
          gte: istMidnightInUTC,
          lte: istEndOfDayInUTC,
        },
        status: SlotStatus.AVAILABLE, // Only unbooked slots
      },
      include: {
        coach: {
          select: {
            userId: true,
            fullName: true,
            expertise: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc', // Sort by time within database
      },
    });

    // Group slots by coach using a Map for O(n) complexity
    const coachMap = new Map<
      string,
      {
        coachId: string;
        coachName: string;
        expertise: string[];
        slots: Array<{
          slotId: string;
          startTime: string;
          endTime: string;
          slotDate: string; // NEW: YYYY-MM-DD in IST
          status: string;
        }>;
      }
    >();

    // Group slots by coach (all should match the IST date already due to query range)
    for (const slot of slots) {
      // Compute IST date for verification
      const slotDateIST = getSlotDateInIST(slot.startTime);

      const coachId = slot.coach.userId;

      if (!coachMap.has(coachId)) {
        // Initialize coach entry
        coachMap.set(coachId, {
          coachId,
          coachName: slot.coach.fullName,
          expertise: slot.coach.expertise,
          slots: [],
        });
      }

      // Add slot to coach's slots array with slotDate
      coachMap.get(coachId)!.slots.push({
        slotId: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        slotDate: slotDateIST,
        status: slot.status,
      });
    }

    // Convert Map to Array for response
    // Slots are already sorted by startTime due to orderBy in query
    return Array.from(coachMap.values());
  }

  /**
   * Get Slot Availability for Date Range
   *
   * Retrieves availability information for a range of dates.
   * Returns a map of dates with availability status and slot counts.
   * Optimized for calendar rendering - fetches entire month in one query.
   *
   * Algorithm:
   * 1. Parse date range to start/end timestamps
   * 2. Query all AVAILABLE slots within date range
   * 3. Group by date and count slots
   * 4. Return date-to-availability map
   *
   * @param startDateStr - Start date in YYYY-MM-DD format
   * @param endDateStr - End date in YYYY-MM-DD format
   * @param coachId - Optional coach ID to filter by specific coach
   * @returns Object mapping dates to availability info
   *
   * @performance Single database query - O(n) complexity
   */
  async getSlotAvailabilityForDateRange(
    startDateStr: string,
    endDateStr: string,
    coachId?: string,
  ) {
    // CRITICAL FIX: Convert IST date range to UTC startTime range
    // For IST dates, calculate the UTC timestamp boundaries
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
    
    // Start IST midnight = UTC 18:30 previous day
    const startUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay - 1, 18, 30, 0, 0));
    // End IST 23:59:59 = UTC 18:29:59 same day
    const endUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 18, 29, 59, 999));

    // Build where clause
    const where: any = {
      startTime: {
        gte: startUTC,
        lte: endUTC,
      },
      status: SlotStatus.AVAILABLE,
    };

    // Add coach filter if provided
    if (coachId) {
      where.coachId = coachId;
    }

    // Single optimized query: fetch all available slots in date range
    const slots = await this.prisma.coachSlot.findMany({
      where,
      select: {
        startTime: true,
      },
    });

    // Group by IST date and count
    const dateMap = new Map<string, { hasSlots: boolean; slotCount: number }>();

    for (const slot of slots) {
      // Compute IST date for this slot
      const dateStr = getSlotDateInIST(slot.startTime);

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { hasSlots: true, slotCount: 0 });
      }

      dateMap.get(dateStr)!.slotCount++;
    }

    // Convert Map to Object for response
    return Object.fromEntries(dateMap);
  }
}
