import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
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
  private readonly logger = new Logger(ConsultationService.name);

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
      rating: coach.coachProfile?.rating
        ? parseFloat(coach.coachProfile.rating.toString())
        : 0,
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
   * 3. Validates slot is not in the past
   * 4. Generates Google Meet link for the session
   * 5. Creates consultation booking record with notes
   * 6. Updates slot status to BOOKED
   * 7. Queues email notifications to both employee and coach
   *
   * Uses SERIALIZABLE isolation level to prevent phantom reads and
   * ensure absolute consistency.
   *
   * @param user - Authenticated employee user
   * @param dto - Booking details including slotId and optional notes
   * @returns Booking confirmation with meeting link and slot details
   * @throws NotFoundException if slot doesn't exist
   * @throws BadRequestException if slot is not available or in the past
   */
  async bookConsultation(user: ValidatedUser, dto: BookConsultationDto) {
    return this.prisma.$transaction(
      async (tx) => {
        // 🔒 CRITICAL FIX: Lock the slot row with SELECT FOR UPDATE
        // This prevents concurrent transactions from reading the same slot
        // until this transaction completes or rolls back
        const slotRaw = await tx.$queryRaw<
          Array<{
            id: string;
            status: string;
            startTime: Date;
            [key: string]: any;
          }>
        >(
          Prisma.sql`
            SELECT * FROM "CoachSlot"
            WHERE id = ${dto.slotId}
            FOR UPDATE
          `,
        );

        if (!slotRaw || slotRaw.length === 0) {
          throw new NotFoundException('Slot not found');
        }

        const lockedSlot = slotRaw[0];

        // Check if slot is still available after locking
        if (lockedSlot.status !== SlotStatus.AVAILABLE) {
          throw new BadRequestException(
            'This slot has already been booked. Please select another time slot.',
          );
        }

        // Check if slot is in the past
        const slotStartTime = new Date(lockedSlot.startTime);
        const now = new Date();
        if (slotStartTime < now) {
          throw new BadRequestException(
            'Cannot book a slot in the past. Please select a future time slot.',
          );
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
          select: {
            email: true,
            employeeProfile: {
              select: {
                fullName: true,
              },
            },
          },
        });

        if (!employee) {
          throw new NotFoundException('Employee not found');
        }

        // 2. Create real Google Meet link
        const { meetingLink, calendarEventId } =
          await this.meetingService.createGoogleMeet(
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

        // 5. Queue email notifications with notes
        // Format date as YYYY-MM-DD in UTC to avoid timezone shifts
        const year = slot.date.getUTCFullYear();
        const month = String(slot.date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(slot.date.getUTCDate() + 1).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        await this.emailQueue.add('send-booking-confirmation', {
          coachEmail: slot.coach.user.email,
          employeeEmail: employee.email,
          coachName: slot.coach.fullName,
          employeeName: employee.employeeProfile?.fullName || employee.email,
          date: dateString,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          meetingLink,
          notes: dto.notes,
        });

        this.logger.log(
          `✅ Consultation booked: Employee ${user.userId} with Coach ${slot.coachId} on ${slot.startTime.toISOString()}`,
        );

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
    let slotWhere: Prisma.CoachSlotWhereInput = {};

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
    const now = new Date();
    
    // First, try to get the nearest upcoming consultation
    const upcomingBooking = await this.prisma.consultationBooking.findFirst({
      where: {
        employeeId,
        slot: {
          startTime: {
            gte: now, // Future meetings only
          },
        },
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
        slot: {
          startTime: 'asc', // Closest upcoming meeting first
        },
      },
    });

    // If no upcoming meeting, get the most recent past meeting
    if (!upcomingBooking) {
      const pastBooking = await this.prisma.consultationBooking.findFirst({
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
          slot: {
            startTime: 'desc', // Most recent past meeting
          },
        },
      });

      if (!pastBooking) {
        return null;
      }

      return {
        id: pastBooking.id,
        meetingLink: pastBooking.meetingLink,
        status: pastBooking.status,
        bookedAt: pastBooking.createdAt,
        slot: {
          id: pastBooking.slot.id,
          date: pastBooking.slot.date,
          startTime: pastBooking.slot.startTime,
          endTime: pastBooking.slot.endTime,
          status: pastBooking.slot.status,
        },
        coach: {
          id: pastBooking.slot.coach.userId,
          name: pastBooking.slot.coach.fullName,
          email: pastBooking.slot.coach.user.email,
          expertise: pastBooking.slot.coach.expertise,
        },
      };
    }

    return {
      id: upcomingBooking.id,
      meetingLink: upcomingBooking.meetingLink,
      status: upcomingBooking.status,
      bookedAt: upcomingBooking.createdAt,
      slot: {
        id: upcomingBooking.slot.id,
        date: upcomingBooking.slot.date,
        startTime: upcomingBooking.slot.startTime,
        endTime: upcomingBooking.slot.endTime,
        status: upcomingBooking.slot.status,
      },
      coach: {
        id: upcomingBooking.coachId,
        email: upcomingBooking.slot.coach.user.email,
        fullName: upcomingBooking.slot.coach.fullName,
        expertise: upcomingBooking.slot.coach.expertise,
        rating: upcomingBooking.slot.coach.rating
          ? parseFloat(upcomingBooking.slot.coach.rating.toString())
          : 0,
        location: upcomingBooking.slot.coach.location,
        profilePhoto: upcomingBooking.slot.coach.profilePhoto,
      },
    };
  }

  /**
   * Get Consultation Details by ID
   *
   * Retrieves complete details of a specific consultation booking.
   * Includes full coach profile, slot timing, meeting link, status, and notes.
   * Only returns the consultation if it belongs to the requesting employee.
   *
   * @param employeeUserId - UUID of the employee requesting the details
   * @param consultationId - UUID of the consultation booking
   * @returns Full consultation details with coach and slot information
   * @throws NotFoundException if consultation doesn't exist or doesn't belong to user
   */
  async getConsultationDetails(
    employeeUserId: string,
    consultationId: string,
  ) {
    // Get employee profile
    const employee = await this.prisma.employeeProfile.findUnique({
      where: { userId: employeeUserId },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    // Fetch consultation with full details
    const booking = await this.prisma.consultationBooking.findFirst({
      where: {
        id: consultationId,
        employeeId: employee.userId,
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
    });

    if (!booking) {
      throw new NotFoundException(
        'Consultation not found or does not belong to you',
      );
    }

    return {
      id: booking.id,
      meetingLink: booking.meetingLink,
      notes: booking.notes,
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
        id: booking.slot.coach.userId,
        email: booking.slot.coach.user.email,
        fullName: booking.slot.coach.fullName,
        expertise: booking.slot.coach.expertise,
        bio: booking.slot.coach.bio,
        rating: booking.slot.coach.rating
          ? parseFloat(booking.slot.coach.rating.toString())
          : 0,
        successRate: booking.slot.coach.successRate || 0,
        clientsHelped: booking.slot.coach.clientsHelped || 0,
        location: booking.slot.coach.location,
        languages: booking.slot.coach.languages || [],
        profilePhoto: booking.slot.coach.profilePhoto,
      },
    };
  }
}

