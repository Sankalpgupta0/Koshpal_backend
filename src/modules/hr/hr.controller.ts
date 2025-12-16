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

  @Post('employees/upload')
  @UseInterceptors(FileInterceptor('file'))
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
}
