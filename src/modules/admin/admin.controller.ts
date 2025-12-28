import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  CreateCompanyDto,
  UpdateCompanyStatusDto,
  UpdateCompanyLimitsDto,
  CreateHrDto,
  UpdateHrStatusDto,
} from './dto/admin.dto';
import { DeactivateCoachDto } from './dto/deactivate-coach.dto';

@Controller('api/v1/admin')
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Company Management
  @Post('companies')
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.adminService.createCompany(dto);
  }

  @Get('companies')
  getCompanies() {
    return this.adminService.getCompanies();
  }

  @Get('companies/:id')
  getCompany(@Param('id') id: string) {
    return this.adminService.getCompany(id);
  }

  @Patch('companies/:id/status')
  updateCompanyStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyStatusDto,
  ) {
    return this.adminService.updateCompanyStatus(id, dto);
  }

  @Patch('companies/:id/limits')
  updateCompanyLimits(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyLimitsDto,
  ) {
    return this.adminService.updateCompanyLimits(id, dto);
  }

  // HR Management
  @Post('hrs')
  createHr(@Body() dto: CreateHrDto) {
    return this.adminService.createHr(dto);
  }

  @Get('hrs')
  getHrs() {
    return this.adminService.getHrs();
  }

  @Get('hrs/:id')
  getHr(@Param('id') id: string) {
    return this.adminService.getHr(id);
  }

  @Patch('hrs/:id/status')
  updateHrStatus(@Param('id') id: string, @Body() dto: UpdateHrStatusDto) {
    return this.adminService.updateHrStatus(id, dto);
  }

  // Coach Management
  /**
   * Get All Coaches
   *
   * Returns list of all coaches with their profiles and statistics.
   * Includes active and inactive coaches.
   *
   * @returns Array of coaches with profile details
   * @route GET /api/v1/admin/coaches
   * @access Protected - Admin only
   */
  @Get('coaches')
  getCoaches() {
    return this.adminService.getCoaches();
  }

  /**
   * Get Single Coach
   *
   * Returns detailed information about a specific coach including:
   * - User account status
   * - Coach profile
   * - Statistics (slots created, consultations conducted)
   *
   * @param id - Coach user ID
   * @returns Coach details with statistics
   * @throws NotFoundException if coach doesn't exist
   * @route GET /api/v1/admin/coaches/:id
   * @access Protected - Admin only
   */
  @Get('coaches/:id')
  getCoach(@Param('id') id: string) {
    return this.adminService.getCoach(id);
  }

  /**
   * Deactivate Coach
   *
   * CRITICAL: Allows admin to deactivate coach accounts
   *
   * Sets isActive = false for coach user account.
   * Prevents coach from:
   * - Logging in (blocked by ActiveUserGuard)
   * - Creating new slots
   * - Accessing any protected endpoints
   *
   * Existing consultations are NOT cancelled automatically.
   * Admin should handle consultation cancellations separately if needed.
   *
   * @param id - Coach user ID
   * @param dto - Optional deactivation reason
   * @returns Updated coach user with isActive = false
   * @throws NotFoundException if coach doesn't exist
   * @throws BadRequestException if coach already inactive
   * @route PATCH /api/v1/admin/coaches/:id/deactivate
   * @access Protected - Admin only
   */
  @Patch('coaches/:id/deactivate')
  deactivateCoach(@Param('id') id: string, @Body() dto: DeactivateCoachDto) {
    return this.adminService.deactivateCoach(id, dto.reason);
  }

  /**
   * Reactivate Coach
   *
   * Reactivates a previously deactivated coach account.
   * Sets isActive = true, allowing coach to log in and access system.
   *
   * @param id - Coach user ID
   * @returns Updated coach user with isActive = true
   * @throws NotFoundException if coach doesn't exist
   * @throws BadRequestException if coach already active
   * @route PATCH /api/v1/admin/coaches/:id/reactivate
   * @access Protected - Admin only
   */
  @Patch('coaches/:id/reactivate')
  reactivateCoach(@Param('id') id: string) {
    return this.adminService.reactivateCoach(id);
  }

  // Platform Stats
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
