import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCoachSlotDto } from './dto/create-coach-slot.dto';

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
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
        },
      ]),
    );

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
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
}
