import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConsultationService } from './consultation.service';
import { BookConsultationDto } from './dto/book-consultation.dto';
import type { ValidatedUser } from '../../common/types/user.types';

/**
 * Consultation Controller
 *
 * Handles all employee consultation-related endpoints including:
 * - Viewing available coaches
 * - Checking coach availability slots
 * - Booking consultations
 * - Viewing booked consultations with filters
 * - Getting consultation statistics
 *
 * All endpoints require EMPLOYEE role authentication
 * Read endpoints skip throttling for better UX
 * Write endpoints have strict throttling for security
 *
 * Base route: /api/v1/employee
 */
@Controller('api/v1/employee')
@SkipThrottle() // Skip by default
@Roles(Role.EMPLOYEE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  /**
   * Get All Coaches
   * 
   * Retrieves a list of all active coaches with their complete profiles
   * including expertise, bio, ratings, and contact information.
   * 
   * @returns Array of coach profiles with ratings and expertise
   * @route GET /api/v1/employee/coaches
   * @access Protected - Employee only
   */
  @Get('coaches')
  async getCoaches() {
    return this.consultationService.getCoaches();
  }

  /**
   * Get Coach Available Slots
   * 
   * Retrieves all available time slots for a specific coach.
   * Can be filtered by date to see slots for a particular day.
   * Only returns slots with AVAILABLE status.
   * 
   * @param coachId - UUID of the coach
   * @param date - Optional date filter in YYYY-MM-DD format
   * @returns Array of available time slots
   * @route GET /api/v1/employee/coaches/:coachId/slots
   * @access Protected - Employee only
   */
  @Get('coaches/:coachId/slots')
  async getCoachSlots(
    @Param('coachId') coachId: string,
    @Query('date') date: string,
  ) {
    return this.consultationService.getCoachSlots(coachId, date);
  }

  /**
   * Book Consultation
   *
   * Books a consultation session with a coach for a specific time slot.
   * Automatically generates a Google Meet link and sends email notifications
   * to both the employee and coach.
   *
   * @param user - Authenticated user from JWT token
   * @param dto - Booking details including slotId and optional notes
   * @returns Booking confirmation with meeting link and slot details
   * @throws BadRequestException if slot is already booked
   * @route POST /api/v1/employee/consultations/book
   * @access Protected - Employee only
   * @throttle 10 requests per minute per user (prevents abuse)
   */
  @Post('consultations/book')
  @SkipThrottle({ default: false }) // Enable throttling for this endpoint
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 bookings per minute
  async bookConsultation(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: BookConsultationDto,
  ) {
    return this.consultationService.bookConsultation(user, dto);
  }

  /**
   * Get My Consultations
   *
   * Retrieves all consultations for the logged-in employee.
   * Supports filtering by time period:
   * - 'past': Consultations that have ended
   * - 'upcoming': Future consultations
   * - 'thisWeek': Consultations in current week (Sun-Sat)
   * - 'thisMonth': Consultations in current month
   * - No filter: All consultations
   *
   * @param user - Authenticated user from JWT token
   * @param filter - Optional filter: 'past' | 'upcoming' | 'thisWeek' | 'thisMonth'
   * @returns Array of consultations with coach details, slot info, and meeting links
   * @route GET /api/v1/employee/consultations
   * @access Protected - Employee only
   */
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

  /**
   * Get Consultation Statistics
   * 
   * Provides comprehensive statistics about employee's consultations including:
   * - Total consultations count
   * - Past and upcoming counts
   * - This week and this month counts
   * - Total minutes booked
   * - Confirmed and cancelled counts
   * 
   * @param user - Authenticated user from JWT token
   * @returns Statistics object with all consultation metrics
   * @route GET /api/v1/employee/consultations/stats
   * @access Protected - Employee only
   */
  @Get('consultations/stats')
  async getMyConsultationStats(@CurrentUser() user: ValidatedUser) {
    return this.consultationService.getEmployeeConsultationStats(
      user.userId,
    );
  }

  /**
   * Get Latest Consultation
   * 
   * Retrieves the most recently booked consultation for the employee.
   * Useful for showing upcoming session information on dashboard.
   * 
   * @param user - Authenticated user from JWT token
   * @returns Latest consultation with full details, or null if no consultations exist
   * @route GET /api/v1/employee/consultations/latest
   * @access Protected - Employee only
   */
  @Get('consultations/latest')
  async getMyLatestConsultation(@CurrentUser() user: ValidatedUser) {
    return this.consultationService.getLatestConsultation(user.userId);
  }

  /**
   * Get Consultation Details
   * 
   * Retrieves detailed information about a specific consultation by ID.
   * Includes coach profile, slot timing, meeting link, status, and notes.
   * Only returns consultation if it belongs to the requesting employee.
   * 
   * @param user - Authenticated user from JWT token
   * @param id - UUID of the consultation booking
   * @returns Consultation details with full coach profile and slot information
   * @throws NotFoundException if consultation doesn't exist or doesn't belong to user
   * @route GET /api/v1/employee/consultations/:id
   * @access Protected - Employee only
   */
  @Get('consultations/:id')
  async getConsultationDetails(
    @CurrentUser() user: ValidatedUser,
    @Param('id') id: string,
  ) {
    return this.consultationService.getConsultationDetails(user.userId, id);
  }
}
