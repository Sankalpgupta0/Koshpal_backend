import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCoachSlotDto, SaveCoachSlotsDto } from './dto/create-coach-slot.dto';
export declare class CoachService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createSlots(coachId: string, dto: CreateCoachSlotDto): Promise<{
        message: string;
        count: number;
    }>;
    getSlots(coachId: string, dateStr?: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.SlotStatus;
        date: Date;
        startTime: Date;
        endTime: Date;
        coachId: string;
    }[]>;
    getConsultations(coachId: string, filter?: string): Promise<{
        id: string;
        date: Date;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.SlotStatus;
        booking: {
            id: string;
            status: import("@prisma/client").$Enums.BookingStatus;
            meetingLink: string;
            bookedAt: Date;
            employee: {
                id: string;
                email: string;
                fullName: string;
                phone: string | null | undefined;
                company: string;
            } | undefined;
        } | null;
    }[]>;
    getConsultationStats(coachId: string): Promise<{
        total: number;
        past: number;
        upcoming: number;
        thisMonth: number;
    }>;
    saveWeeklyAvailability(coachId: string, dto: SaveCoachSlotsDto): Promise<{
        message: string;
        slotsGenerated: number;
        weeksGenerated: number;
    }>;
    getWeeklySchedule(coachId: string, weeksCount?: number): Promise<{
        MONDAY: never[];
        TUESDAY: never[];
        WEDNESDAY: never[];
        THURSDAY: never[];
        FRIDAY: never[];
        SATURDAY: never[];
        SUNDAY: never[];
    }>;
    deleteSlot(coachId: string, slotId: string): Promise<{
        message: string;
        slotId: string;
    }>;
    private getDateForWeekday;
    private buildDateTime;
    private getWeekdayName;
    getCoachProfile(coachId: string): Promise<{
        userId: string;
        fullName: string;
        expertise: string[];
        bio: string | null;
        rating: import("@prisma/client/runtime/library").Decimal;
        successRate: number;
        clientsHelped: number;
        location: string | null;
        languages: string[];
        profilePhoto: string | null;
        timezone: string;
    }>;
    updateCoachTimezone(coachId: string, timezone: string): Promise<{
        userId: string;
        fullName: string;
        expertise: string[];
        bio: string | null;
        rating: import("@prisma/client/runtime/library").Decimal;
        successRate: number;
        clientsHelped: number;
        location: string | null;
        languages: string[];
        profilePhoto: string | null;
        timezone: string;
    }>;
}
