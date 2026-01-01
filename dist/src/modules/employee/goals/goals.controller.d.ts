import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
interface CurrentUserDto {
    userId: string;
    email: string;
    role: string;
}
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    getGoals(user: CurrentUserDto): Promise<{
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
    createGoal(createGoalDto: CreateGoalDto, user: CurrentUserDto): Promise<{
        _id: string;
        goalName: string;
        icon: string;
        goalAmount: number;
        saving: number;
        goalDate: string;
    }>;
    updateGoal(goalId: string, updateGoalDto: UpdateGoalDto, user: CurrentUserDto): Promise<{
        _id: string;
        goalName: string;
        icon: string;
        goalAmount: number;
        saving: number;
        goalDate: string;
    }>;
    deleteGoal(goalId: string, user: CurrentUserDto): Promise<{
        message: string;
    }>;
}
export {};
