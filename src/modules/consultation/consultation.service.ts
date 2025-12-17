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
import { SlotStatus, BookingStatus } from '@prisma/client';

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

  async bookConsultation(user: ValidatedUser, dto: BookConsultationDto) {
    return this.prisma.$transaction(async (tx) => {
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

      if (slot.status !== SlotStatus.AVAILABLE) {
        throw new BadRequestException('Slot is not available');
      }

      const meetingLink = this.meetingService.createMeeting();

      const booking = await tx.consultationBooking.create({
        data: {
          slotId: dto.slotId,
          coachId: slot.coachId,
          employeeId: user.userId,
          meetingLink,
          status: BookingStatus.CONFIRMED,
        },
      });

      await tx.coachSlot.update({
        where: { id: dto.slotId },
        data: { status: SlotStatus.BOOKED },
      });

      const employee = await tx.user.findUnique({
        where: { id: user.userId },
        select: { email: true },
      });

      await this.emailQueue.add('send-booking-confirmation', {
        coachEmail: slot.coach.user.email,
        employeeEmail: employee?.email,
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
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
      };
    });
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
