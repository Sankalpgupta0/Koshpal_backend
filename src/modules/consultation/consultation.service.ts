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
            expertise: true,
            bio: true,
          },
        },
      },
    });

    return coaches.map((coach) => ({
      id: coach.id,
      email: coach.email,
      expertise: coach.coachProfile?.expertise,
      bio: coach.coachProfile?.bio,
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
}
