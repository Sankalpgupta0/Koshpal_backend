export declare class SlotDateTimeDto {
    id: string;
    startTime: string;
    endTime: string;
    slotDate: string;
    status: string;
}
export declare class CoachSlotResponseDto extends SlotDateTimeDto {
    coachId: string;
}
export declare class CoachWithSlotsResponseDto {
    coachId: string;
    coachName: string;
    expertise: string[];
    slots: Array<{
        slotId: string;
        startTime: string;
        endTime: string;
        slotDate: string;
        status: string;
    }>;
}
export declare class SlotAvailabilityDateDto {
    date: string;
    hasSlots: boolean;
    slotCount: number;
}
