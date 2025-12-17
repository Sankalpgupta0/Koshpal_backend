import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConsultationService } from './consultation.service';
import { BookConsultationDto } from './dto/book-consultation.dto';
import type { ValidatedUser } from '../../common/types/user.types';

@Controller('api/v1/employee')
@Roles(Role.EMPLOYEE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Get('coaches')
  async getCoaches() {
    return this.consultationService.getCoaches();
  }

  @Get('coaches/:coachId/slots')
  async getCoachSlots(
    @Param('coachId') coachId: string,
    @Query('date') date: string,
  ) {
    return this.consultationService.getCoachSlots(coachId, date);
  }

  @Post('consultations/book')
  async bookConsultation(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: BookConsultationDto,
  ) {
    return this.consultationService.bookConsultation(user, dto);
  }

  @Get('consultations')
  async getMyConsultations(
    @CurrentUser() user: ValidatedUser,
    @Query('filter') filter?: string,
  ) {
    return this.consultationService.getEmployeeConsultations(
      user.userId,
      filter,
    );
  }

  @Get('consultations/stats')
  async getMyConsultationStats(@CurrentUser() user: ValidatedUser) {
    return this.consultationService.getEmployeeConsultationStats(
      user.userId,
    );
  }

  @Get('consultations/latest')
  async getMyLatestConsultation(@CurrentUser() user: ValidatedUser) {
    return this.consultationService.getLatestConsultation(user.userId);
  }
}
