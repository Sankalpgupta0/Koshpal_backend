import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { MeetingService } from './meeting.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'consultation-email',
    }),
  ],
  controllers: [ConsultationController],
  providers: [ConsultationService, MeetingService],
  exports: [ConsultationService], // Export for use in CoachModule
})
export class ConsultationModule {}
