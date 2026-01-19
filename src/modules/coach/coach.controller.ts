import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CoachService } from './coach.service';
import { ConsultationService } from '../consultation/consultation.service';
import { CreateCoachSlotDto, SaveCoachSlotsDto } from './dto/create-coach-slot.dto';
import { CancelConsultationDto } from '../consultation/dto/cancel-consultation.dto';
import type { ValidatedUser } from '../../common/types/user.types';

import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageStorage } from '../../common/multer/profile-image.storage';




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
   * @route POST /api/v1/coach/slots/date
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
  @Post('slots/date')
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
   * Save Weekly Availability
   *
   * Saves coach's weekly availability schedule and generates slots for future weeks.
   * Deletes existing future AVAILABLE slots and regenerates based on weekly pattern.
   * Keeps BOOKED slots untouched.
   *
   * @param user - Authenticated coach from JWT token
   * @param dto - Weekly schedule data with timezone and slot configuration
   * @returns Confirmation with generated slots count
   * @route POST /api/v1/coach/slots
   * @access Protected - Coach only
   */
  @Post('slots')
  async saveWeeklyAvailability(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: SaveCoachSlotsDto,
  ) {
    return this.coachService.saveWeeklyAvailability(user.userId, dto);
  }

  /**
   * Get Weekly Schedule
   *
   * Retrieves coach's availability grouped by weekday for UI display.
   * Returns slots for the current week and optionally future weeks.
   *
   * @param user - Authenticated coach from JWT token
   * @param weeks - Number of weeks to include (default: 1)
   * @returns Weekly schedule grouped by weekday
   * @route GET /api/v1/coach/slots/weekly
   * @access Protected - Coach only
   */
  @Get('slots/weekly')
  async getWeeklySchedule(
    @CurrentUser() user: ValidatedUser,
    @Query('weeks') weeks?: string,
  ) {
    const weeksCount = weeks ? parseInt(weeks, 10) : 1;
    return this.coachService.getWeeklySchedule(user.userId, weeksCount);
  }

  /**
   * Delete Slot
   *
   * Deletes a specific availability slot.
   * Only AVAILABLE slots can be deleted. BOOKED slots cannot be removed.
   *
   * @param user - Authenticated coach from JWT token
   * @param slotId - UUID of the slot to delete
   * @returns Deletion confirmation
   * @route DELETE /api/v1/coach/slots/:slotId
   * @access Protected - Coach only
   */
  @Delete('slots/:slotId')
  async deleteSlot(
    @CurrentUser() user: ValidatedUser,
    @Param('slotId') slotId: string,
  ) {
    return this.coachService.deleteSlot(user.userId, slotId);
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

  /**
   * Get Coach Profile
   *
   * Retrieves the coach's profile information including timezone setting.
   *
   * @param user - Authenticated coach from JWT token
   * @returns Coach profile with timezone
   * @route GET /api/v1/coach/profile
   * @access Protected - Coach only
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: ValidatedUser) {
    return this.coachService.getCoachProfile(user.userId);
  }

  /**
   * Update Coach Timezone
   *
   * Updates the coach's timezone setting for availability scheduling.
   *
   * @param user - Authenticated coach from JWT token
   * @param timezone - IANA timezone identifier (e.g., "Asia/Kolkata" for IST)
   * @returns Updated coach profile
   * @route PATCH /api/v1/coach/profile/timezone
   * @access Protected - Coach only
   */
  @Patch('profile/timezone')
  async updateTimezone(
    @CurrentUser() user: ValidatedUser,
    @Body('timezone') timezone: string,
  ) {
    return this.coachService.updateCoachTimezone(user.userId, timezone);
  }

  
  /**
   * ✅ UPDATE COACH PROFILE (NAME + PHONE + IMAGE)
   */
  @Patch('profile')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: profileImageStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async updateProfile(
    @CurrentUser() user: ValidatedUser,
    @Body() body: { fullName?: string; phone?: string },
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.coachService.updateCoachProfile(
      user.userId,
      body,
      image,
    );
  }


 
  
  
}
