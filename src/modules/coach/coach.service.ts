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
}
