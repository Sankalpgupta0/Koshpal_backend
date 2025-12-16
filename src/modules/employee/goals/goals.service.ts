import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async findUserGoals(userId: string) {
    const goals = await this.prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { goalDate: 'asc' },
    });

    return {
      _id: userId,
      employeeId: userId,
      financialGoals: goals.map((goal) => ({
        _id: goal.id,
        goalName: goal.goalName,
        icon: goal.icon,
        goalAmount: Number(goal.goalAmount),
        saving: Number(goal.saving),
        goalDate: goal.goalDate.toISOString(),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async createGoal(userId: string, createGoalDto: CreateGoalDto) {
    const goal = await this.prisma.financialGoal.create({
      data: {
        userId,
        goalName: createGoalDto.goalName,
        icon: createGoalDto.icon,
        goalAmount: createGoalDto.goalAmount,
        saving: createGoalDto.saving || 0,
        goalDate: new Date(createGoalDto.goalDate),
      },
    });

    return {
      _id: goal.id,
      goalName: goal.goalName,
      icon: goal.icon,
      goalAmount: Number(goal.goalAmount),
      saving: Number(goal.saving),
      goalDate: goal.goalDate.toISOString(),
    };
  }

  async updateGoal(
    userId: string,
    goalId: string,
    updateGoalDto: UpdateGoalDto,
  ) {
    // Check if goal exists and belongs to user
    const existingGoal = await this.prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existingGoal) {
      throw new NotFoundException('Goal not found');
    }

    const goal = await this.prisma.financialGoal.update({
      where: { id: goalId },
      data: {
        ...(updateGoalDto.goalName && { goalName: updateGoalDto.goalName }),
        ...(updateGoalDto.icon && { icon: updateGoalDto.icon }),
        ...(updateGoalDto.goalAmount && {
          goalAmount: updateGoalDto.goalAmount,
        }),
        ...(updateGoalDto.saving !== undefined && {
          saving: updateGoalDto.saving,
        }),
        ...(updateGoalDto.goalDate && {
          goalDate: new Date(updateGoalDto.goalDate),
        }),
      },
    });

    return {
      _id: goal.id,
      goalName: goal.goalName,
      icon: goal.icon,
      goalAmount: Number(goal.goalAmount),
      saving: Number(goal.saving),
      goalDate: goal.goalDate.toISOString(),
    };
  }

  async deleteGoal(userId: string, goalId: string) {
    // Check if goal exists and belongs to user
    const existingGoal = await this.prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existingGoal) {
      throw new NotFoundException('Goal not found');
    }

    await this.prisma.financialGoal.delete({
      where: { id: goalId },
    });

    return { message: 'Goal deleted successfully' };
  }
}
