import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { EmployeeSlotsService } from './employee-slots.service';

/**
 * Employee Slots Controller - New simplified timezone-aware APIs
 * 
 * Base route: /api/v1/employee/slots
 */
@Controller('api/v1/employee/slots')
@Roles(Role.EMPLOYEE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeSlotsController {
  constructor(private readonly employeeSlotsService: EmployeeSlotsService) {}

  /**
   * GET /api/v1/employee/slots?date=YYYY-MM-DD
   * 
   * Get all available coach slots for a specific IST date
   * Returns coaches grouped with their slots
   */
  @Get()
  @SkipThrottle()
  @Throttle({ default: { limit: 50, ttl: 10000 } })
  async getSlotsByDate(@Query('date') date: string) {
    if (!date) {
      throw new BadRequestException('Date query parameter is required (format: YYYY-MM-DD)');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date format. Expected: YYYY-MM-DD');
    }

    return await this.employeeSlotsService.getSlotsByDate(date);
  }

  /**
   * GET /api/v1/employee/slots/coach/:coachId?date=YYYY-MM-DD
   * 
   * Get slots for a specific coach on a specific IST date
   */
  @Get('coach/:coachId')
  @SkipThrottle()
  @Throttle({ default: { limit: 50, ttl: 10000 } })
  async getSlotsByCoachAndDate(
    @Param('coachId') coachId: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException('Date query parameter is required (format: YYYY-MM-DD)');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date format. Expected: YYYY-MM-DD');
    }

    return await this.employeeSlotsService.getSlotsByCoachAndDate(coachId, date);
  }

  /**
   * GET /api/v1/employee/slots/calendar?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&coachId=xxx
   * 
   * Get available dates in a range for calendar highlighting
   */
  @Get('calendar')
  @SkipThrottle()
  @Throttle({ default: { limit: 30, ttl: 10000 } })
  async getAvailableDates(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('coachId') coachId?: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Both startDate and endDate are required (format: YYYY-MM-DD)',
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new BadRequestException('Invalid date format. Expected: YYYY-MM-DD');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 60) {
      throw new BadRequestException('Date range cannot exceed 60 days');
    }

    if (daysDiff < 0) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return await this.employeeSlotsService.getAvailableDates(startDate, endDate, coachId);
  }
}
