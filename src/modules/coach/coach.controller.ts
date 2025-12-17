import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CoachService } from './coach.service';
import { CreateCoachSlotDto } from './dto/create-coach-slot.dto';
import type { ValidatedUser } from '../../common/types/user.types';

@Controller('api/v1/coach')
@Roles(Role.COACH)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post('slots')
  async createSlots(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: CreateCoachSlotDto,
  ) {
    return this.coachService.createSlots(user.userId, dto);
  }

  @Get('slots')
  async getSlots(
    @CurrentUser() user: ValidatedUser,
    @Query('date') date?: string,
  ) {
    return this.coachService.getSlots(user.userId, date);
  }

  @Get('consultations')
  async getConsultations(
    @CurrentUser() user: ValidatedUser,
    @Query('filter') filter?: string,
  ) {
    return this.coachService.getConsultations(user.userId, filter);
  }

  @Get('consultations/stats')
  async getConsultationStats(@CurrentUser() user: ValidatedUser) {
    return this.coachService.getConsultationStats(user.userId);
  }
}
