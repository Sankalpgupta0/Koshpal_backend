import { PrismaService } from '../../../prisma/prisma.service';
export declare class EmployeeCoachService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSlotsGroupedByCoach(dateStr: string): Promise<{
        coachId: string;
        coachName: string;
        expertise: string[];
        slots: Array<{
            slotId: string;
            startTime: string;
            endTime: string;
        }>;
    }[]>;
    getSlotAvailabilityForDateRange(startDateStr: string, endDateStr: string, coachId?: string): Promise<{
        [k: string]: {
            hasSlots: boolean;
            slotCount: number;
        };
    }>;
}
