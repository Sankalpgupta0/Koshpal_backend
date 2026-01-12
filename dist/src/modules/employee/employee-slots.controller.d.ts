import { EmployeeSlotsService } from './employee-slots.service';
export declare class EmployeeSlotsController {
    private readonly employeeSlotsService;
    constructor(employeeSlotsService: EmployeeSlotsService);
    getSlotsByDate(date: string): Promise<any[]>;
    getSlotsByCoachAndDate(coachId: string, date: string): Promise<{
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
    getAvailableDates(startDate: string, endDate: string, coachId?: string): Promise<Record<string, {
        hasSlots: boolean;
        slotCount: number;
    }>>;
}
