import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

interface CurrentUserDto {
  userId: string;
  email: string;
  role: string;
}

@Controller('api/v1/employee/goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async getGoals(@CurrentUser() user: CurrentUserDto) {
    return this.goalsService.findUserGoals(user.userId);
  }

  @Post()
  async createGoal(
    @Body() createGoalDto: CreateGoalDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.goalsService.createGoal(user.userId, createGoalDto);
  }

  @Put(':goalId')
  async updateGoal(
    @Param('goalId') goalId: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.goalsService.updateGoal(user.userId, goalId, updateGoalDto);
  }

  @Delete(':goalId')
  async deleteGoal(
    @Param('goalId') goalId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.goalsService.deleteGoal(user.userId, goalId);
  }
}
