import { PrismaService } from '../../../prisma/prisma.service';
export declare class EmployeeSlotsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSlotsByDate(dateStr: string): Promise<any[]>;
    getSlotsByCoachAndDate(coachId: string, dateStr: string): Promise<{
        coachId: string;
        coachName: null;
        expertise: never[];
        slots: never[];
    } | {
        coachId: string;
        coachName: string;
        expertise: string[];
        slots: {
            slotId: string;
            startTime: string;
            endTime: string;
            slotDate: string;
            status: import("@prisma/client").$Enums.SlotStatus;
        }[];
    }>;
    getAvailableDates(startDateStr: string, endDateStr: string, coachId?: string): Promise<Record<string, {
        hasSlots: boolean;
        slotCount: number;
    }>>;
}
