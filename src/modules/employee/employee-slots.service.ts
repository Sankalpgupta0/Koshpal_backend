import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SlotStatus } from '@prisma/client';
import { getSlotDateInIST } from '../../common/utils/timezone.util';

/**
 * Employee Slots Service - Simplified timezone-aware slot queries
 * 
 * This service provides clean, timezone-safe APIs for querying coach slots.
 * All queries are based on UTC startTime ranges calculated from IST dates.
 */
@Injectable()
export class EmployeeSlotsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available slots for a specific IST date
   * 
   * @param dateStr - Date in YYYY-MM-DD format (IST timezone)
   * @returns Array of coaches with their slots for that IST date
   */
  async getSlotsByDate(dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Calculate UTC range for the entire IST day
    // IST midnight (00:00) = UTC 18:30 previous day
    const startUTC = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
    // IST end of day (23:59:59) = UTC 18:29:59 same day
    const endUTC = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));

    // Query slots within UTC range
    const slots = await this.prisma.coachSlot.findMany({
      where: {
        startTime: {
          gte: startUTC,
          lte: endUTC,
        },
        status: SlotStatus.AVAILABLE,
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
        startTime: 'asc',
      },
    });

    // Group by coach
    const coachMap = new Map();

    for (const slot of slots) {
      const coachId = slot.coach.userId;
      
      if (!coachMap.has(coachId)) {
        coachMap.set(coachId, {
          coachId,
          coachName: slot.coach.fullName,
          expertise: slot.coach.expertise,
          slots: [],
        });
      }

      coachMap.get(coachId).slots.push({
        slotId: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        slotDate: getSlotDateInIST(slot.startTime),
        status: slot.status,
      });
    }

    return Array.from(coachMap.values());
  }

  /**
   * Get slots for a specific coach on a specific IST date
   * 
   * @param coachId - Coach user ID
   * @param dateStr - Date in YYYY-MM-DD format (IST timezone)
   * @returns Array of slots for that coach on that date
   */
  async getSlotsByCoachAndDate(coachId: string, dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Calculate UTC range for the entire IST day
    const startUTC = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
    const endUTC = new Date(Date.UTC(year, month - 1, day, 18, 29, 59, 999));

    const slots = await this.prisma.coachSlot.findMany({
      where: {
        coachId,
        startTime: {
          gte: startUTC,
          lte: endUTC,
        },
        status: SlotStatus.AVAILABLE,
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
        startTime: 'asc',
      },
    });

    if (slots.length === 0) {
      return {
        coachId,
        coachName: null,
        expertise: [],
        slots: [],
      };
    }

    return {
      coachId: slots[0].coach.userId,
      coachName: slots[0].coach.fullName,
      expertise: slots[0].coach.expertise,
      slots: slots.map(slot => ({
        slotId: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        slotDate: getSlotDateInIST(slot.startTime),
        status: slot.status,
      })),
    };
  }

  /**
   * Get available dates in a range (for calendar highlighting)
   * 
   * @param startDateStr - Start date in YYYY-MM-DD format (IST)
   * @param endDateStr - End date in YYYY-MM-DD format (IST)
   * @param coachId - Optional coach ID filter
   * @returns Object mapping IST dates to slot counts
   */
  async getAvailableDates(
    startDateStr: string,
    endDateStr: string,
    coachId?: string,
  ) {
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
    
    // Calculate UTC boundaries
    const startUTC = new Date(Date.UTC(startYear, startMonth - 1, startDay - 1, 18, 30, 0, 0));
    const endUTC = new Date(Date.UTC(endYear, endMonth - 1, endDay, 18, 29, 59, 999));

    const where: any = {
      startTime: {
        gte: startUTC,
        lte: endUTC,
      },
      status: SlotStatus.AVAILABLE,
    };

    if (coachId) {
      where.coachId = coachId;
    }

    const slots = await this.prisma.coachSlot.findMany({
      where,
      select: {
        startTime: true,
      },
    });

    // Group by IST date
    const dateMap = new Map<string, number>();

    for (const slot of slots) {
      const istDate = getSlotDateInIST(slot.startTime);
      dateMap.set(istDate, (dateMap.get(istDate) || 0) + 1);
    }

    // Convert to object
    const result: Record<string, { hasSlots: boolean; slotCount: number }> = {};
    dateMap.forEach((count, date) => {
      result[date] = {
        hasSlots: true,
        slotCount: count,
      };
    });

    return result;
  }
}
