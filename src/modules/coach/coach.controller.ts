import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CoachService } from './coach.service';
import { UpdateConsultationStatusDto } from './dto/coach.dto';

interface CurrentUserDto {
  userId: string;
  email: string;
  role: string;
}

@Controller('api/v1/coach')
@Roles(Role.COACH)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('requests')
  async getConsultationRequests(@CurrentUser() user: CurrentUserDto) {
    return this.coachService.getConsultationRequests(user.userId);
  }

  @Get('requests/:id')
  async getConsultationRequest(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.coachService.getConsultationRequest(id, user.userId);
  }

  @Patch('requests/:id/status')
  async updateConsultationStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body() updateStatusDto: UpdateConsultationStatusDto,
  ) {
    return this.coachService.updateConsultationStatus(
      id,
      user.userId,
      updateStatusDto.status,
      updateStatusDto.notes,
    );
  }
}
