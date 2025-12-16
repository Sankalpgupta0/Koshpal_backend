import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { InsightsService } from './insights.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ScopedPrismaInterceptor } from '../../common/interceptors/scoped-prisma.interceptor';

/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ValidatedUser } from '../../common/types/user.types';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('api/v1/insights')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ScopedPrismaInterceptor)
@Roles(Role.EMPLOYEE, Role.ADMIN)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('monthly')
  async getMonthlySummaries(
    @CurrentUser() user: ValidatedUser,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.insightsService.getMonthlySummaries(
      user.userId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }

  @Get('monthly/latest')
  async getLatestMonthlySummary(@CurrentUser() user: ValidatedUser) {
    return this.insightsService.getLatestMonthlySummary(user.userId);
  }

  @Get('monthly/year/:year')
  async getYearlySummary(
    @CurrentUser() user: ValidatedUser,
    @Query('year') year: string,
  ) {
    return this.insightsService.getYearlySummary(user.userId, parseInt(year));
  }

  @Get('category-breakdown')
  async getCategoryBreakdown(
    @CurrentUser() user: ValidatedUser,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.insightsService.getCategoryBreakdown(
      user.userId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }

  @Get('trends')
  async getSpendingTrends(
    @CurrentUser() user: ValidatedUser,
    @Query('months') months?: string,
  ) {
    return this.insightsService.getSpendingTrends(
      user.userId,
      months ? parseInt(months) : 6,
    );
  }

  @Post('generate')
  async generateMonthlySummary(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: GenerateSummaryDto,
  ) {
    return this.insightsService.generateMonthlySummary(
      user.userId,
      user.companyId,
      dto.month,
      dto.year,
    );
  }

  @Patch('budget')
  async updateBudget(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.insightsService.updateBudget(
      user.userId,
      user.companyId,
      dto.month,
      dto.year,
      dto.budget,
    );
  }

  @Get('budget')
  async getBudget(
    @CurrentUser() user: ValidatedUser,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.insightsService.getBudget(
      user.userId,
      parseInt(month),
      parseInt(year),
    );
  }
}
