import { Controller, Get, Post, Patch, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CoachService } from './coach.service';
import { ConsultationService } from '../consultation/consultation.service';
import { CreateCoachSlotDto } from './dto/create-coach-slot.dto';
import { CancelConsultationDto } from '../consultation/dto/cancel-consultation.dto';
import type { ValidatedUser } from '../../common/types/user.types';

/**
 * Coach Controller
 * 
 * Handles all coach-specific endpoints including:
 * - Managing availability slots
 * - Viewing booked consultations
 * - Getting consultation statistics
 * - Cancelling consultations
 * 
 * All endpoints require COACH role authentication
 * Base route: /api/v1/coach
 */
@Controller('api/v1/coach')
@Roles(Role.COACH)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoachController {
  constructor(
    private readonly coachService: CoachService,
    private readonly consultationService: ConsultationService,
  ) {}

  /**
   * Create Availability Slots
   * 
   * Allows coaches to create multiple time slots for a specific date.
   * Each slot represents a time when the coach is available for consultations.
   * Slots are created with AVAILABLE status by default.
   * 
   * @param user - Authenticated coach from JWT token
   * @param dto - Slot creation data with date and array of time slots
   * @returns Confirmation with created slots count and details
   * @route POST /api/v1/coach/slots
   * @access Protected - Coach only
   * @example
   * {
   *   "date": "2025-12-20",
   *   "timeSlots": [
   *     { "startTime": "09:00", "endTime": "10:00" },
   *     { "startTime": "10:00", "endTime": "11:00" }
   *   ]
   * }
   */
  @Post('slots')
  async createSlots(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: CreateCoachSlotDto,
  ) {
    return this.coachService.createSlots(user.userId, dto);
  }

  /**
   * Get My Slots
   * 
   * Retrieves all slots created by the coach.
   * Can be filtered by date to see slots for a specific day.
   * Returns slots with all statuses: AVAILABLE, BOOKED, CANCELLED
   * 
   * @param user - Authenticated coach from JWT token
   * @param date - Optional date filter in YYYY-MM-DD format
   * @returns Array of coach's slots with booking information
   * @route GET /api/v1/coach/slots
   * @access Protected - Coach only
   */
  @Get('slots')
  async getSlots(
    @CurrentUser() user: ValidatedUser,
    @Query('date') date?: string,
  ) {
    return this.coachService.getSlots(user.userId, date);
  }

  /**
   * Get My Consultations
   * 
   * Retrieves all consultations booked with the coach.
   * Supports filtering by time period:
   * - 'past': Consultations that have ended
   * - 'upcoming': Future consultations
   * - 'thisMonth': Consultations in current month
   * - No filter: All consultations
   * 
   * Includes full employee details for each consultation.
   * 
   * @param user - Authenticated coach from JWT token
   * @param filter - Optional filter: 'past' | 'upcoming' | 'thisMonth'
   * @returns Array of consultations with employee details and slot info
   * @route GET /api/v1/coach/consultations
   * @access Protected - Coach only
   */
  @Get('consultations')
  async getConsultations(
    @CurrentUser() user: ValidatedUser,
    @Query('filter') filter?: string,
  ) {
    return this.coachService.getConsultations(user.userId, filter);
  }

  /**
   * Get Consultation Statistics
   * 
   * Provides comprehensive statistics about coach's consultations including:
   * - Total consultations count
   * - Past and upcoming counts
   * - This month count
   * - Confirmed and cancelled counts
   * - Average rating (if available)
   * - Total minutes conducted
   * 
   * Useful for coach dashboard and performance tracking.
   * 
   * @param user - Authenticated coach from JWT token
   * @returns Statistics object with all consultation metrics
   * @route GET /api/v1/coach/consultations/stats
   * @access Protected - Coach only
   */
  @Get('consultations/stats')
  async getConsultationStats(@CurrentUser() user: ValidatedUser) {
    return this.coachService.getConsultationStats(user.userId);
  }

  /**
   * Cancel Consultation (Coach)
   * 
   * CRITICAL: Allows coach to cancel upcoming consultation
   * 
   * Cancels a scheduled consultation and frees up the time slot.
   * 
   * Business Rules:
   * - Can only cancel CONFIRMED consultations
   * - Cannot cancel past or ongoing consultations
   * - Slot automatically becomes AVAILABLE after cancellation
   * - Both employee and coach receive cancellation emails
   * 
   * Rate Limited: 20 cancellations per hour to prevent abuse
   * 
   * @param user - Authenticated coach
   * @param id - UUID of the consultation to cancel
   * @param dto - Optional cancellation reason
   * @returns Cancellation confirmation
   * @throws NotFoundException if consultation doesn't exist or doesn't belong to coach
   * @throws BadRequestException if consultation is already cancelled or in the past
   * @route PATCH /api/v1/coach/consultations/:id/cancel
   * @access Protected - Coach only
   * @throttle 20 requests per hour
   */
  @Patch('consultations/:id/cancel')
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 cancellations per hour
  async cancelConsultation(
    @CurrentUser() user: ValidatedUser,
    @Param('id') id: string,
    @Body() dto: CancelConsultationDto,
  ) {
    return this.consultationService.cancelConsultationByCoach(
      user.userId,
      id,
      dto.reason,
    );
  }

  /**
   * Complete Consultation (Coach)
   * 
   * Marks a consultation as completed after the session has ended.
   * 
   * Business Rules:
   * - Can only complete CONFIRMED consultations
   * - Consultation must have ended (cannot complete future sessions)
   * - Cannot complete cancelled consultations
   * - Only the coach who conducted the session can mark it as completed
   * 
   * @param user - Authenticated coach
   * @param id - UUID of the consultation to complete
   * @returns Completion confirmation with updated status
   * @throws NotFoundException if consultation doesn't exist or doesn't belong to coach
   * @throws BadRequestException if consultation hasn't ended or is already completed/cancelled
   * @route PATCH /api/v1/coach/consultations/:id/complete
   * @access Protected - Coach only
   */
  @Patch('consultations/:id/complete')
  async completeConsultation(
    @CurrentUser() user: ValidatedUser,
    @Param('id') id: string,
  ) {
    return this.consultationService.completeConsultationByCoach(
      user.userId,
      id,
    );
  }
