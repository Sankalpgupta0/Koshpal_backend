import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
export declare class GoalsService {
    private prisma;
    constructor(prisma: PrismaService);
    findUserGoals(userId: string): Promise<{
        _id: string;
        employeeId: string;
        financialGoals: {
            _id: string;
            goalName: string;
            icon: string;
            goalAmount: number;
            saving: number;
            goalDate: string;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
    createGoal(userId: string, createGoalDto: CreateGoalDto): Promise<{
        _id: string;
        goalName: string;
        icon: string;
        goalAmount: number;
        saving: number;
        goalDate: string;
    }>;
    updateGoal(userId: string, goalId: string, updateGoalDto: UpdateGoalDto): Promise<{
        _id: string;
        goalName: string;
        icon: string;
        goalAmount: number;
        saving: number;
        goalDate: string;
    }>;
    deleteGoal(userId: string, goalId: string): Promise<{
        message: string;
    }>;
}
