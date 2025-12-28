import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { EmployeeCoachService } from './employee-coach.service';

/**
 * Employee Coach Controller
 *
 * Handles aggregated coach availability endpoints for employees.
 * Optimized to prevent throttling issues by providing bulk data in single requests.
 *
 * Base route: /api/v1/employee/coaches
 */
@Controller('api/v1/employee/coaches')
@Roles(Role.EMPLOYEE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeCoachController {
  constructor(private readonly employeeCoachService: EmployeeCoachService) {}

  /**
   * Get All Coach Slots (Aggregated)
   *
   * Returns all active coaches with their available slots for a given date.
   * This endpoint is optimized to handle bulk data retrieval in a single request,
   * preventing throttling issues when loading coach availability screens.
   *
   * Uses a single database query with proper indexing to fetch all slots
   * grouped by coach, eliminating N+1 query problems.
   *
   * @param date - Date string in YYYY-MM-DD format (required)
   * @returns Array of coaches with their available time slots
   * @route GET /api/v1/employee/coaches/slots?date=YYYY-MM-DD
   * @access Protected - Employee only
   * @throttle Custom - 50 requests per 10 seconds (per-route override)
   *
   * @example Response:
   * [
   *   {
   *     "coachId": "uuid",
   *     "coachName": "John Doe",
   *     "expertise": ["Financial Planning", "Debt Management"],
   *     "slots": [
   *       {
   *         "slotId": "uuid",
   *         "startTime": "2025-12-22T10:00:00.000Z",
   *         "endTime": "2025-12-22T11:00:00.000Z"
   *       }
   *     ]
   *   }
   * ]
   */
  @Get('slots')
  @SkipThrottle()
  @Throttle({ default: { limit: 50, ttl: 10000 } })
  async getAggregatedSlots(@Query('date') date: string) {
    if (!date) {
      throw new BadRequestException(
        'Date query parameter is required (format: YYYY-MM-DD)',
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new BadRequestException(
        'Invalid date format. Expected: YYYY-MM-DD',
      );
    }

    return await this.employeeCoachService.getSlotsGroupedByCoach(date);
  }

  /**
   * Get Coach Availability for Date Range (Optimized for Calendar View)
   *
   * Returns a map of dates to availability status for a given month.
   * This endpoint is highly optimized for calendar rendering, fetching
   * all dates in a month with a single database query.
   *
   * Only returns dates that have available slots, making it efficient
   * for highlighting available dates in the calendar UI.
   *
   * @param startDate - Start date in YYYY-MM-DD format (required)
   * @param endDate - End date in YYYY-MM-DD format (required)
   * @param coachId - Optional coach ID to filter by specific coach
   * @returns Object mapping dates to availability info
   * @route GET /api/v1/employee/coaches/slots/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&coachId=uuid
   * @access Protected - Employee only
   * @throttle 30 requests per 10 seconds
   *
   * @example Response:
   * {
   *   "2025-12-22": { "hasSlots": true, "slotCount": 5 },
   *   "2025-12-23": { "hasSlots": true, "slotCount": 3 },
   *   "2025-12-25": { "hasSlots": false, "slotCount": 0 }
   * }
   */
  @Get('slots/range')
  @SkipThrottle()
  @Throttle({ default: { limit: 30, ttl: 10000 } })
  async getSlotAvailabilityForRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('coachId') coachId?: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Both startDate and endDate query parameters are required (format: YYYY-MM-DD)',
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new BadRequestException(
        'Invalid date format. Expected: YYYY-MM-DD',
      );
    }

    // Validate date range (max 60 days)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff > 60) {
      throw new BadRequestException('Date range cannot exceed 60 days');
    }

    if (daysDiff < 0) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return await this.employeeCoachService.getSlotAvailabilityForDateRange(
      startDate,
      endDate,
      coachId,
    );
  }
}
