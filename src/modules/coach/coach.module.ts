import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ConsultationModule } from '../consultation/consultation.module';

@Module({
  imports: [PrismaModule, ConsultationModule],
  controllers: [CoachController],
  providers: [CoachService],
})
export class CoachModule {}
