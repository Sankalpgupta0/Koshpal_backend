import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ScopedPrismaInterceptor } from '../../common/interceptors/scoped-prisma.interceptor';
import { AccountsService } from '../../finance/accounts/accounts.service';
import { TransactionsService } from '../../finance/transactions/transactions.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { profileImageStorage } from '../../common/multer/profile-image.storage';

/* eslint-disable @typescript-eslint/no-unsafe-return */

import { InsightsService } from '../../finance/insights/insights.service';
import { EmployeeService } from './employee.service';
import { CreateAccountDto } from '../../finance/accounts/dto/create-account.dto';
import { CreateTransactionDto } from '../../finance/transactions/dto/create-transaction.dto';

interface CurrentUserDto {
  userId: string;
  email: string;
  role: string;
}


@Controller('api/v1/employee')
@Roles(Role.EMPLOYEE)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ScopedPrismaInterceptor)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly accountsService: AccountsService,
    private readonly transactionsService: TransactionsService,
    private readonly insightsService: InsightsService,
  ) {}

  /**
   * Get Employee Profile (Enhanced)
   *
   * CRITICAL: Returns comprehensive employee profile with full data
   *
   * Returns complete information including:
   * - User details (email, role, status, last login)
   * - Full employee profile (demographics, contact, work info)
   * - Company information
   * - Financial statistics (accounts, balance)
   * - Goal statistics (active, completed, progress)
   * - Consultation history (total, upcoming, completed)
   *
   * This replaces the minimal profile endpoint with production-ready data.
   *
   * @param user - Authenticated employee
   * @returns Comprehensive profile with all related data and statistics
   * @throws NotFoundException if employee profile doesn't exist
   * @route GET /api/v1/employee/me
   * @access Protected - Employee only
   */
  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserDto) {
    return this.employeeService.getFullProfile(user.userId);
  }

  // Account Management
  @Post('accounts')
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    const validatedUser = {
      userId: user.userId,
      companyId: '',
      role: user.role,
    };
    return this.accountsService.create(validatedUser, createAccountDto);
  }

  @Get('accounts')
  async getAccounts(@CurrentUser() user: CurrentUserDto) {
    return this.accountsService.findUserAccounts(user.userId);
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Param('id') id: string,
    @Body() updateAccountDto: CreateAccountDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    // Verify ownership first
    await this.accountsService.findOne(user.userId, id);
    const validatedUser = {
      userId: user.userId,
      companyId: '',
      role: user.role,
    };
    return this.accountsService.create(validatedUser, updateAccountDto);
  }

  @Delete('accounts/:id')
  async deleteAccount(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.accountsService.remove(user.userId, id);
  }

  // Transaction Management
  @Post('transactions')
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    const validatedUser = {
      userId: user.userId,
      companyId: '',
      role: user.role,
    };
    return this.transactionsService.create(validatedUser, createTransactionDto);
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: CurrentUserDto,
    @Query('accountId') accountId?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    return this.transactionsService.findUserTransactions(user.userId, {
      accountId,
      type,
      category,
    });
  }

  @Get('transactions/:id')
  async getTransaction(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.transactionsService.findOne(user.userId, id);
  }

  @Delete('transactions/:id')
  async deleteTransaction(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.transactionsService.remove(user.userId, id);
  }

  // Insights
  @Get('insights/summary')
  async getLatestSummary(@CurrentUser() user: CurrentUserDto) {
    return this.insightsService.getLatestMonthlySummary(user.userId);
  }

  @Get('insights/categories')
  async getCategoryBreakdown(
    @CurrentUser() user: CurrentUserDto,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.insightsService.getCategoryBreakdown(
      user.userId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
    );
  }

  @Get('insights/trend')
  async getSpendingTrends(
    @CurrentUser() user: CurrentUserDto,
    @Query('months') months?: string,
  ) {
    return this.insightsService.getSpendingTrends(
      user.userId,
      months ? parseInt(months) : 6,
    );
  }

@Put('profile')
@UseInterceptors(
  FileInterceptor('image', {
    storage: profileImageStorage, // Cloudinary storage
    fileFilter: (req, file, cb) => {
      // Allow image uploads
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }),
)
async updateProfile(
  @Req() req,
  @Body() body: { name?: string; phone?: string },
  @UploadedFile() file?: Express.Multer.File,
) {
  try {
    console.log('Employee Profile Update:', {
      userId: req.user.userId,
      body,
      hasFile: !!file,
      filePath: file?.path,
      filename: file?.filename
    });
    
    // Update profile even if file upload fails
    return await this.employeeService.updateOwnProfile(
      req.user.userId,     // from JWT
      body,
      file?.path,         // Cloudinary secure_url
      file?.filename,     // Cloudinary public_id
    );
  } catch (error) {
    console.error('Error in employee profile update:', error);
    // If it's a file upload error, update profile without image
    if (error.message?.includes('Cloudinary') || error.message?.includes('storage')) {
      console.log('Cloudinary error, updating profile without image');
      return await this.employeeService.updateOwnProfile(
        req.user.userId,
        body,
        undefined,
        undefined,
      );
    }
    throw error;
  }
}


@Get('profile')
async getMyProfile(@CurrentUser() user: CurrentUserDto) {
  return this.employeeService.getMyProfile(user.userId);
}

}
