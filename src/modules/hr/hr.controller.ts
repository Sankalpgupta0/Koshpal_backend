import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
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
}
