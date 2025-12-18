import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MeetingService } from './meeting.service';
import { BookConsultationDto } from './dto/book-consultation.dto';
import { ValidatedUser } from '../../common/types/user.types';
import { SlotStatus, BookingStatus, Prisma } from '@prisma/client';

/**
 * Consultation Service
 * 
 * Core business logic for managing consultations between employees and coaches.
 * Handles:
 * - Coach listing and profile management
 * - Slot availability checking
 * - Consultation booking with meeting link generation
 * - Email notifications via BullMQ queue
 * - Consultation history and filtering
 * - Statistics calculation
 * 
 * Uses Prisma for database operations and BullMQ for async email processing
 */
@Injectable()
export class ConsultationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meetingService: MeetingService,
    @InjectQueue('consultation-email') private readonly emailQueue: Queue,
  ) {}

  async getCoaches() {
    const coaches = await this.prisma.user.findMany({
      where: {
        role: 'COACH',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        coachProfile: {
          select: {
            fullName: true,
            expertise: true,
            bio: true,
            rating: true,
            successRate: true,
            clientsHelped: true,
            location: true,
            languages: true,
            profilePhoto: true,
          },
        },
      },
    });

    return coaches.map((coach) => ({
      id: coach.id,
      email: coach.email,
      fullName: coach.coachProfile?.fullName,
      expertise: coach.coachProfile?.expertise || [],
      bio: coach.coachProfile?.bio,
      rating: coach.coachProfile?.rating ? parseFloat(coach.coachProfile.rating.toString()) : 0,
      successRate: coach.coachProfile?.successRate || 0,
      clientsHelped: coach.coachProfile?.clientsHelped || 0,
      location: coach.coachProfile?.location,
      languages: coach.coachProfile?.languages || [],
      profilePhoto: coach.coachProfile?.profilePhoto,
    }));
  }

  /**
   * Get Coach Available Slots
   * 
   * Retrieves all available time slots for a specific coach on a given date.
   * Only returns slots with AVAILABLE status (not booked or cancelled).
   * Slots are ordered by start time in ascending order.
   * 
   * @param coachId - UUID of the coach
   * @param dateStr - Date string in YYYY-MM-DD format
   * @returns Array of available time slots sorted by start time
   */
  async getCoachSlots(coachId: string, dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const slots = await this.prisma.coachSlot.findMany({
      where: {
        coachId,
        date,
        status: SlotStatus.AVAILABLE,
      },
      orderBy: { startTime: 'asc' },
    });

    return slots;
  }

  /**
   * Book Consultation
   * 
   * RACE-CONDITION FIX: This method now uses SELECT FOR UPDATE to prevent
   * concurrent bookings of the same slot.
   * 
   * Books a consultation session between an employee and coach.
   * Process:
   * 1. Locks the slot row with SELECT FOR UPDATE (prevents race conditions)
   * 2. Validates slot exists and is available
   * 3. Generates Google Meet link for the session
   * 4. Creates consultation booking record
   * 5. Updates slot status to BOOKED
   * 6. Queues email notifications to both employee and coach
   * 
   * Uses SERIALIZABLE isolation level to prevent phantom reads and
   * ensure absolute consistency.
   * 
   * @param user - Authenticated employee user
   * @param dto - Booking details including slotId and optional notes
   * @returns Booking confirmation with meeting link and slot details
   * @throws NotFoundException if slot doesn't exist
   * @throws BadRequestException if slot is not available
   */
  async bookConsultation(user: ValidatedUser, dto: BookConsultationDto) {
    return this.prisma.$transaction(
      async (tx) => {
        // 🔒 CRITICAL FIX: Lock the slot row with SELECT FOR UPDATE
        // This prevents concurrent transactions from reading the same slot
        // until this transaction completes or rolls back
        const slotRaw = await tx.$queryRaw<any[]>`
          SELECT * FROM "CoachSlot"
          WHERE id = ${dto.slotId}::uuid
          FOR UPDATE
        `;

        if (!slotRaw || slotRaw.length === 0) {
          throw new NotFoundException('Slot not found');
        }

        const lockedSlot = slotRaw[0];

        // Check if slot is still available after locking
        if (lockedSlot.status !== SlotStatus.AVAILABLE) {
          throw new BadRequestException('Slot is not available');
        }

        // Now fetch the full slot data with relations
        const slot = await tx.coachSlot.findUnique({
          where: { id: dto.slotId },
          include: {
            coach: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
          },
        });

        if (!slot) {
          throw new NotFoundException('Slot not found');
        }

      // Get employee details
      const employee = await tx.user.findUnique({
        where: { id: user.userId },
        select: { email: true },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // 2. Create real Google Meet link
      const { meetingLink, calendarEventId } = await this.meetingService.createGoogleMeet(
        slot.coach.user.email,
        employee.email,
        slot.startTime,
        slot.endTime,
      );

      // 3. Create consultation booking
      const booking = await tx.consultationBooking.create({
        data: {
          slotId: dto.slotId,
          coachId: slot.coachId,
          employeeId: user.userId,
          meetingLink,
          calendarEventId,
          status: BookingStatus.CONFIRMED,
        },
      });

      // 4. Mark slot as booked
      await tx.coachSlot.update({
        where: { id: dto.slotId },
        data: { status: SlotStatus.BOOKED },
      });

      // 5. Queue email notifications
      await this.emailQueue.add('send-booking-confirmation', {
        coachEmail: slot.coach.user.email,
        employeeEmail: employee.email,
        coachName: slot.coach.fullName,
        date: slot.date.toISOString().split('T')[0],
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        meetingLink,
      });

      return {
        message: 'Consultation booked successfully',
        booking: {
          id: booking.id,
          meetingLink: booking.meetingLink,
          calendarEventId: booking.calendarEventId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      };
    },
    {
      // 🔒 CRITICAL: Use SERIALIZABLE isolation level
      // This is the highest isolation level and prevents:
      // - Dirty reads
      // - Non-repeatable reads
      // - Phantom reads
      // Essential for booking systems to prevent double-booking
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000, // Wait max 5 seconds to acquire lock
      timeout: 10000, // Transaction timeout 10 seconds
    },
    );
  }

  async getEmployeeConsultations(employeeId: string, filter?: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // Build where clause for slot filtering
    let slotWhere: any = {};

    switch (filter) {
      case 'past':
        slotWhere = { endTime: { lt: now } };
        break;
      case 'upcoming':
        slotWhere = { startTime: { gte: now } };
        break;
      case 'thisWeek':
        slotWhere = {
          date: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        };
        break;
      case 'thisMonth':
        slotWhere = {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        };
        break;
    }

    const bookings = await this.prisma.consultationBooking.findMany({
      where: {
        employeeId,
        slot: slotWhere,
      },
      include: {
        slot: {
          include: {
            coach: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      meetingLink: booking.meetingLink,
      status: booking.status,
      bookedAt: booking.createdAt,
      slot: {
        id: booking.slot.id,
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        status: booking.slot.status,
      },
      coach: {
        id: booking.coachId,
        email: booking.slot.coach.user.email,
        fullName: booking.slot.coach.fullName,
        expertise: booking.slot.coach.expertise,
        rating: booking.slot.coach.rating
          ? parseFloat(booking.slot.coach.rating.toString())
          : 0,
        location: booking.slot.coach.location,
        profilePhoto: booking.slot.coach.profilePhoto,
      },
    }));
  }

  async getEmployeeConsultationStats(employeeId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const bookings = await this.prisma.consultationBooking.findMany({
      where: {
        employeeId,
      },
      include: {
        slot: true,
      },
    });

    const total = bookings.length;
    const past = bookings.filter((b) => b.slot.endTime < now).length;
    const upcoming = bookings.filter((b) => b.slot.startTime >= now).length;
    const thisWeek = bookings.filter(
      (b) => b.slot.date >= startOfWeek && b.slot.date <= endOfWeek,
    ).length;
    const thisMonth = bookings.filter(
      (b) => b.slot.date >= startOfMonth && b.slot.date <= endOfMonth,
    ).length;

    const minutesBooked = bookings.reduce((acc, b) => {
      const duration =
        (b.slot.endTime.getTime() - b.slot.startTime.getTime()) / (1000 * 60);
      return acc + duration;
    }, 0);

    const confirmedCount = bookings.filter(
      (b) => b.status === BookingStatus.CONFIRMED,
    ).length;
    const cancelledCount = bookings.filter(
      (b) => b.status === BookingStatus.CANCELLED,
    ).length;

    return {
      total,
      past,
      upcoming,
      thisWeek,
      thisMonth,
      minutesBooked,
      confirmed: confirmedCount,
      cancelled: cancelledCount,
    };
  }

  async getLatestConsultation(employeeId: string) {
    const booking = await this.prisma.consultationBooking.findFirst({
      where: {
        employeeId,
      },
      include: {
        slot: {
          include: {
            coach: {
              include: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!booking) {
      return null;
    }

    return {
      id: booking.id,
      meetingLink: booking.meetingLink,
      status: booking.status,
      bookedAt: booking.createdAt,
      slot: {
        id: booking.slot.id,
        date: booking.slot.date,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        status: booking.slot.status,
      },
      coach: {
        id: booking.coachId,
        email: booking.slot.coach.user.email,
        fullName: booking.slot.coach.fullName,
        expertise: booking.slot.coach.expertise,
        rating: booking.slot.coach.rating
          ? parseFloat(booking.slot.coach.rating.toString())
          : 0,
        location: booking.slot.coach.location,
        profilePhoto: booking.slot.coach.profilePhoto,
      },
    };
  }
}
