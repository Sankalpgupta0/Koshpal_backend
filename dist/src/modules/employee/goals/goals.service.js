"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../prisma/prisma.service");
let GoalsService = class GoalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findUserGoals(userId) {
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
    async createGoal(userId, createGoalDto) {
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
    async updateGoal(userId, goalId, updateGoalDto) {
        const existingGoal = await this.prisma.financialGoal.findFirst({
            where: { id: goalId, userId },
        });
        if (!existingGoal) {
            throw new common_1.NotFoundException('Goal not found');
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
    async deleteGoal(userId, goalId) {
        const existingGoal = await this.prisma.financialGoal.findFirst({
            where: { id: goalId, userId },
        });
        if (!existingGoal) {
            throw new common_1.NotFoundException('Goal not found');
        }
        await this.prisma.financialGoal.delete({
            where: { id: goalId },
        });
        return { message: 'Goal deleted successfully' };
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map