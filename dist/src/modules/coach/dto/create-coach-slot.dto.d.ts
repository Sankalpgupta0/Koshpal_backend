declare class TimeSlot {
    startTime: string;
    endTime: string;
}
export declare class CreateCoachSlotDto {
    date: string;
    timeSlots: TimeSlot[];
}
declare class WeeklyTimeSlot {
    start: string;
    end: string;
}
export declare class SaveCoachSlotsDto {
    slotDurationMinutes: number;
    weeksToGenerate: number;
    weeklySchedule: {
        MONDAY?: WeeklyTimeSlot[];
        TUESDAY?: WeeklyTimeSlot[];
        WEDNESDAY?: WeeklyTimeSlot[];
        THURSDAY?: WeeklyTimeSlot[];
        FRIDAY?: WeeklyTimeSlot[];
        SATURDAY?: WeeklyTimeSlot[];
        SUNDAY?: WeeklyTimeSlot[];
    };
}
export {};
