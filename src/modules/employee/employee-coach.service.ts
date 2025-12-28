import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SlotStatus } from '@prisma/client';

/**
 * Employee Coach Service
 *
 * Business logic for aggregated coach availability queries.
 * Optimized to prevent N+1 queries and provide bulk data efficiently.
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
   * Algorithm:
   * 1. Parse date string to start/end of day timestamps
   * 2. Query all AVAILABLE slots with coach profile included
   * 3. Filter for active coaches only
   * 4. Group slots by coach
   * 5. Sort slots by start time within each coach group
   *
   * @param dateStr - Date string in YYYY-MM-DD format
   * @returns Array of coaches with their available slots, grouped and sorted
   *
   * @performance Single database query with JOIN - O(n) complexity
   */
  async getSlotsGroupedByCoach(dateStr: string) {
    // Convert date string to Date object at start of day (00:00:00)
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Calculate end of day for range query
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Single optimized query: fetch all available slots with coach data
    // This prevents N+1 queries by using Prisma's include feature
    const slots = await this.prisma.coachSlot.findMany({
      where: {
        date: date, // Matches start of day
        status: SlotStatus.AVAILABLE, // Only unbooked slots
        coach: {
          user: {
            isActive: true, // Only active coaches
          },
        },
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
        }>;
      }
    >();

    for (const slot of slots) {
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

      // Add slot to coach's slots array
      coachMap.get(coachId)!.slots.push({
        slotId: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
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
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    // Build where clause
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: SlotStatus.AVAILABLE,
      coach: {
        user: {
          isActive: true,
        },
      },
    };

    // Add coach filter if provided
    if (coachId) {
      where.coachId = coachId;
    }

    // Single optimized query: fetch all available slots in date range
    const slots = await this.prisma.coachSlot.findMany({
      where,
      select: {
        date: true,
      },
    });

    // Group by date and count
    const dateMap = new Map<string, { hasSlots: boolean; slotCount: number }>();

    for (const slot of slots) {
      const dateStr = slot.date.toISOString().split('T')[0];

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { hasSlots: true, slotCount: 0 });
      }

      dateMap.get(dateStr)!.slotCount++;
    }

    // Convert Map to Object for response
    return Object.fromEntries(dateMap);
  }
}
