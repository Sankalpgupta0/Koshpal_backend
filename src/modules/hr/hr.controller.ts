import {
  Controller,
  Post,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HrService } from './hr.service';

interface CurrentUserDto {
  userId: string;
  companyId: string;
  role: string;
}

@Controller('api/v1/hr')
@Roles(Role.HR)
@UseGuards(JwtAuthGuard, RolesGuard)
export class HrController {
  constructor(private hrService: HrService) {}

  /**
   * Upload Employee Data (CSV)
   * 
   * CRITICAL: Standardized to CSV format only
   * 
   * Validates and queues employee data file for background processing.
   * 
   * File Requirements:
   * - Format: CSV only (.csv extension)
   * - Size: Maximum 5MB
   * - One upload per company at a time
   * 
   * Processing:
   * - Async background job via BullMQ
   * - Creates employee accounts with generated passwords
   * - Sends credential emails to each employee
   * - Returns batch ID for status tracking
   * 
   * @param file - CSV file with employee data
   * @param user - Authenticated HR user
   * @returns Batch ID and confirmation message
   * @throws BadRequestException if file invalid or upload already in progress
   * @route POST /api/v1/hr/employees/upload
   * @access Protected - HR only
   */
  @Post('employees/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
          return cb(
            new Error('Invalid file type. Only CSV files are allowed.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadEmployees(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.hrService.handleUpload(file, user);
  }

  @Get('uploads')
  async getUploads(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getBatchesForCompany(user.companyId);
  }

  @Get('uploads/:batchId')
  async getUploadStatus(@Param('batchId') batchId: string) {
    return this.hrService.getBatchStatus(batchId);
  }

  @Get('employees')
  async getEmployees(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getEmployees(user.companyId);
  }

  @Get('employees/departments/list')
  async getDepartments(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getDepartments(user.companyId);
  }

  @Get('employees/:id')
  async getEmployee(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.hrService.getEmployee(id, user.companyId);
  }

  @Patch('employees/:id/status')
  async updateEmployeeStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
    @Body('isActive') isActive: boolean,
  ) {
    return this.hrService.updateEmployeeStatus(id, user.companyId, isActive);
  }

  @Get('insights/summary')
  async getInsightsSummary(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getCompanyInsightsSummary(user.companyId);
  }

  @Get('dashboard/stats')
  async getDashboardStats(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getDashboardStats(user.companyId);
  }

  @Get('dashboard/financial-health')
  async getFinancialHealthDistribution(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getFinancialHealthDistribution(user.companyId);
  }

  @Get('dashboard/participation-by-department')
  async getParticipationByDepartment(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getParticipationByDepartment(user.companyId);
  }

  @Get('dashboard/alerts')
  async getDashboardAlerts(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getDashboardAlerts(user.companyId);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentUserDto) {
    return this.hrService.getHrProfile(user.userId);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: CurrentUserDto,
    @Body() updateData: { fullName?: string; phone?: string; designation?: string },
  ) {
    return this.hrService.updateHrProfile(user.userId, updateData);
  }
}
