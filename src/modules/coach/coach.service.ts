import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConsultationStatus } from './dto/coach.dto';

@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async getConsultationRequests(coachId: string) {
    // For MVP, return mock data or placeholder
    // In production, this would query a consultationRequests table
    return {
      message: 'Coach consultation requests feature coming soon',
      coachId,
      requests: [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getConsultationRequest(requestId: string, coachId: string) {
    // Mock implementation for MVP
    return {
      id: requestId,
      coachId,
      status: ConsultationStatus.PENDING,
      message: 'Consultation request details coming soon',
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updateConsultationStatus(
    requestId: string,
    coachId: string,
    status: ConsultationStatus,
    notes?: string,
  ) {
    // Mock implementation for MVP
    // In production, this would update the consultationRequests table
    return {
      id: requestId,
      coachId,
      status,
      notes,
      message: 'Status update feature coming soon',
    };
  }
}
