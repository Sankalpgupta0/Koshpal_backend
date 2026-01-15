import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCoachSlotDto, SaveCoachSlotsDto } from './dto/create-coach-slot.dto';
import { deleteFromCloudinary } from '../../common/config/cloudinary.helper'


@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) {}

  async createSlots(coachId: string, dto: CreateCoachSlotDto) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    const slots = dto.timeSlots.map((timeSlot) => {
      const startTime = new Date(`${dto.date}T${timeSlot.startTime}`);
      const endTime = new Date(`${dto.date}T${timeSlot.endTime}`);

      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (duration !== 60) {
        throw new BadRequestException('Each slot must be exactly 1 hour');
      }

      return {
        coachId,
        date,
        startTime,
        endTime,
      };
    });

    const existingSlots = await this.prisma.coachSlot.findMany({
      where: {
        coachId,
        date,
        OR: slots.map((slot) => ({
          AND: [
            { startTime: { lte: slot.endTime } },
            { endTime: { gte: slot.startTime } },
          ],
        })),
      },
    });

    if (existingSlots.length > 0) {
      throw new BadRequestException('Overlapping slots detected');
    }

    const created = await this.prisma.coachSlot.createMany({
      data: slots,
    });

    return {
      message: 'Slots created successfully',
      count: created.count,
    };
  }

  async getSlots(coachId: string, dateStr?: string) {
    const where: { coachId: string; date?: Date } = { coachId };

    if (dateStr) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      where.date = date;
    }

    return this.prisma.coachSlot.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getConsultations(coachId: string, filter?: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    let dateFilter: any = {};

    switch (filter) {
      case 'past':
        dateFilter = { endTime: { lt: now } };
        break;
      case 'upcoming':
        dateFilter = { startTime: { gte: now } };
        break;
      case 'thisMonth':
        dateFilter = {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        };
        break;
      // 'all' or undefined - no date filter
    }

    const consultations = await this.prisma.coachSlot.findMany({
      where: {
        coachId,
        status: 'BOOKED',
        ...dateFilter,
      },
      include: {
        booking: {
          select: {
            id: true,
            employeeId: true,
            meetingLink: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { date: filter === 'past' ? 'desc' : 'asc' },
        { startTime: filter === 'past' ? 'desc' : 'asc' },
      ],
    });

    // Get employee details for each consultation
    const employeeIds = consultations
      .map((c) => c.booking?.employeeId)
      .filter(Boolean) as string[];

    const employees = await this.prisma.user.findMany({
      where: { id: { in: employeeIds } },
      include: {
        employeeProfile: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    const employeeMap = new Map(
      employees.map((emp) => [
        emp.id,
        {
          id: emp.id,
          email: emp.email,
          fullName: emp.employeeProfile?.fullName || emp.email,
          phone: emp.employeeProfile?.phone,
          company: emp.company?.name || 'N/A',
        },
      ]),
    );

    console.log('Employee data with company info:', employeeMap);

    return consultations.map((slot) => ({
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,
      booking: slot.booking
        ? {
            id: slot.booking.id,
            status: slot.booking.status,
            meetingLink: slot.booking.meetingLink,
            bookedAt: slot.booking.createdAt,
            employee: employeeMap.get(slot.booking.employeeId),
          }
        : null,
    }));
  }

  async getConsultationStats(coachId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const [total, past, upcoming, thisMonth] = await Promise.all([
      this.prisma.coachSlot.count({
        where: {
          coachId,
          status: 'BOOKED',
        },
      }),
      this.prisma.coachSlot.count({
        where: {
          coachId,
          status: 'BOOKED',
          endTime: { lt: now },
        },
      }),
      this.prisma.coachSlot.count({
        where: {
          coachId,
          status: 'BOOKED',
          startTime: { gte: now },
        },
      }),
      this.prisma.coachSlot.count({
        where: {
          coachId,
          status: 'BOOKED',
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ]);

    return {
      total,
      past,
      upcoming,
      thisMonth,
    };
  }

  async saveWeeklyAvailability(coachId: string, dto: SaveCoachSlotsDto) {
    // Note: All times are now standardized to IST (Indian Standard Time)
    // Coach timezone is no longer used for conversion

    // Step 1: Delete future AVAILABLE slots (keep BOOKED ones)
    await this.prisma.coachSlot.deleteMany({
      where: {
        coachId,
        status: 'AVAILABLE',
        startTime: { gt: new Date() },
      },
    });

    // Step 2: Generate slots for each week
    const slots: Array<{
      coachId: string;
      date: Date;
      startTime: Date;
      endTime: Date;
      status: 'AVAILABLE';
    }> = [];
    const now = new Date();

    for (let week = 0; week < dto.weeksToGenerate; week++) {
      for (const [weekday, timeRanges] of Object.entries(dto.weeklySchedule)) {
        if (!timeRanges || timeRanges.length === 0) continue;

        for (const timeRange of timeRanges) {
          // Calculate the date for this weekday in the target week
          const targetDate = this.getDateForWeekday(weekday, week);

          // Skip if date is in the past
          if (targetDate < now) continue;

          // Build timestamps in IST
          const startTime = this.buildDateTime(
            targetDate,
            timeRange.start,
            'Asia/Kolkata', // Always use IST
          );
          const endTime = this.buildDateTime(
            targetDate,
            timeRange.end,
            'Asia/Kolkata', // Always use IST
          );

          // Validate duration
          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
          if (duration !== dto.slotDurationMinutes) {
            throw new BadRequestException(
              `Slot duration must be exactly ${dto.slotDurationMinutes} minutes`,
            );
          }

          // Check for overlaps
          const existingSlot = await this.prisma.coachSlot.findFirst({
            where: {
              coachId,
              date: targetDate,
              OR: [
                {
                  AND: [
                    { startTime: { lte: startTime } },
                    { endTime: { gt: startTime } },
                  ],
                },
                {
                  AND: [
                    { startTime: { lt: endTime } },
                    { endTime: { gte: endTime } },
                  ],
                },
                {
                  AND: [
                    { startTime: { gte: startTime } },
                    { endTime: { lte: endTime } },
                  ],
                },
              ],
            },
          });

          if (existingSlot) {
            throw new BadRequestException(
              `Overlapping slot detected for ${weekday} at ${timeRange.start}-${timeRange.end}`,
            );
          }

          slots.push({
            coachId,
            date: targetDate,
            startTime,
            endTime,
            status: 'AVAILABLE' as const,
          });
        }
      }
    }

    // Step 3: Bulk insert new slots
    const created = await this.prisma.coachSlot.createMany({
      data: slots,
    });

    return {
      message: 'Weekly availability saved successfully',
      slotsGenerated: created.count,
      weeksGenerated: dto.weeksToGenerate,
    };
  }

  async getWeeklySchedule(coachId: string, weeksCount: number = 1) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + (weeksCount * 7));

    // Get all slots for the period
    const slots = await this.prisma.coachSlot.findMany({
      where: {
        coachId,
        date: {
          gte: now,
          lte: endDate,
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    // Group by weekday
    const weeklySchedule = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };

    slots.forEach((slot) => {
      const weekday = this.getWeekdayName(slot.date.getDay());

      // Convert stored IST times to HH:MM format for display
      // Since times are stored in IST, we need to format them as IST
      const startTimeIST = new Date(slot.startTime.getTime() - (5.5 * 60 * 60 * 1000)); // Convert IST back to UTC for toISOString
      const endTimeIST = new Date(slot.endTime.getTime() - (5.5 * 60 * 60 * 1000)); // Convert IST back to UTC for toISOString

      const startTime = startTimeIST.toISOString().substring(11, 16); // HH:MM in IST
      const endTime = endTimeIST.toISOString().substring(11, 16); // HH:MM in IST

      weeklySchedule[weekday].push({
        id: slot.id,
        start: startTime,
        end: endTime,
        status: slot.status,
        date: slot.date.toISOString().split('T')[0], // YYYY-MM-DD
      });
    });

    return weeklySchedule;
  }

  async deleteSlot(coachId: string, slotId: string) {
    // Check if slot exists and belongs to coach
    const slot = await this.prisma.coachSlot.findFirst({
      where: {
        id: slotId,
        coachId,
      },
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    // Cannot delete booked slots
    if (slot.status === 'BOOKED') {
      throw new ForbiddenException('Cannot delete a booked slot');
    }

    // Cannot delete past slots
    if (slot.startTime < new Date()) {
      throw new BadRequestException('Cannot delete past slots');
    }

    await this.prisma.coachSlot.delete({
      where: { id: slotId },
    });

    return {
      message: 'Slot deleted successfully',
      slotId,
    };
  }

  private getDateForWeekday(weekday: string, weekOffset: number): Date {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Map weekday names to numbers (0 = Sunday, 1 = Monday, etc.)
    const weekdayMap = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const targetWeekday = weekdayMap[weekday.toUpperCase()];
    if (targetWeekday === undefined) {
      throw new BadRequestException(`Invalid weekday: ${weekday}`);
    }

    const currentWeekday = today.getDay();
    let daysToAdd = targetWeekday - currentWeekday;

    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week
    }

    daysToAdd += weekOffset * 7; // Add week offset

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);

    return targetDate;
  }

  private buildDateTime(date: Date, time: string, _timezone: string): Date {
    // Create date string in YYYY-MM-DDTHH:mm format
    const dateStr = date.toISOString().split('T')[0];
    const dateTimeStr = `${dateStr}T${time}:00`;

    // Always convert to IST (Indian Standard Time) regardless of coach timezone
    const istTimezone = 'Asia/Kolkata';
    const dateTime = new Date(dateTimeStr + '+00:00'); // Assume input is UTC

    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDateTime = new Date(dateTime.getTime() + istOffset);

    return istDateTime;
  }

  private getWeekdayName(dayIndex: number): string {
    const weekdays = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return weekdays[dayIndex];
  }

  async getCoachProfile(coachId: string) {
    const profile = await this.prisma.coachProfile.findUnique({
      where: { userId: coachId },
    });

    if (!profile) {
      throw new NotFoundException('Coach profile not found');
    }

    return profile;
  }

  async updateCoachTimezone(coachId: string, timezone: string) {
    // Validate timezone format (basic validation)
    if (!timezone || typeof timezone !== 'string' || timezone.length < 3) {
      throw new BadRequestException('Invalid timezone format');
    }

    const updatedProfile = await this.prisma.coachProfile.update({
      where: { userId: coachId },
      data: { timezone },
    });

    return updatedProfile;
  }



  async updateCoachProfile(
    userId: string,
    updateData: { fullName?: string; phone?: string;},
    image?: Express.Multer.File,
  ) {
    const profile = await this.prisma.coachProfile.findUnique({
      where: { userId },
    });
  
    if (!profile) {
      throw new BadRequestException('Coach profile not found');
    }
  
    // DELETE OLD IMAGE IF NEW IMAGE IS UPLOADED
    if (image && profile.profilePhotoId) {
      await deleteFromCloudinary(profile.profilePhotoId);
    }
  
    const updatedProfile = await this.prisma.coachProfile.update({
      where: { userId },
      data: {
        ...(updateData.fullName && { fullName: updateData.fullName }),
        ...(updateData.phone !== undefined && { phone: updateData.phone }),
  
        ...(image && {
          profilePhoto: image.path,        // URL
          profilePhotoId: image.filename,  // public_id 
        }),
      },
    });
  
    return {
      message: 'Profile updated successfully',
      profile: updatedProfile,
    };
  }
}
