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

  // Platform Stats
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
