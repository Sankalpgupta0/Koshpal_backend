import { EmployeeCoachService } from './employee-coach.service';
export declare class EmployeeCoachController {
    private readonly employeeCoachService;
    constructor(employeeCoachService: EmployeeCoachService);
    getAggregatedSlots(date: string): Promise<{
        coachId: string;
        coachName: string;
        expertise: string[];
        slots: {
            slotId: string;
            startTime: string;
            endTime: string;
            slotDate: string;
            status: string;
        }[];
    }[]>;
    getSlotAvailabilityForRange(startDate: string, endDate: string, coachId?: string): Promise<{
        [k: string]: {
            hasSlots: boolean;
            slotCount: number;
        };
    }>;
}
