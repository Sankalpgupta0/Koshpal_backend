"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotAvailabilityDateDto = exports.CoachWithSlotsResponseDto = exports.CoachSlotResponseDto = exports.SlotDateTimeDto = void 0;
class SlotDateTimeDto {
    id;
    startTime;
    endTime;
    slotDate;
    status;
}
exports.SlotDateTimeDto = SlotDateTimeDto;
class CoachSlotResponseDto extends SlotDateTimeDto {
    coachId;
}
exports.CoachSlotResponseDto = CoachSlotResponseDto;
class CoachWithSlotsResponseDto {
    coachId;
    coachName;
    expertise;
    slots;
}
exports.CoachWithSlotsResponseDto = CoachWithSlotsResponseDto;
class SlotAvailabilityDateDto {
    date;
    hasSlots;
    slotCount;
}
exports.SlotAvailabilityDateDto = SlotAvailabilityDateDto;
//# sourceMappingURL=slot-response.dto.js.map