"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveCoachSlotsDto = exports.CreateCoachSlotDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TimeSlot {
    startTime;
    endTime;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'startTime must be in HH:mm format',
    }),
    __metadata("design:type", String)
], TimeSlot.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'endTime must be in HH:mm format',
    }),
    __metadata("design:type", String)
], TimeSlot.prototype, "endTime", void 0);
class CreateCoachSlotDto {
    date;
    timeSlots;
}
exports.CreateCoachSlotDto = CreateCoachSlotDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCoachSlotDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TimeSlot),
    __metadata("design:type", Array)
], CreateCoachSlotDto.prototype, "timeSlots", void 0);
class WeeklyTimeSlot {
    start;
    end;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'start must be in HH:mm format',
    }),
    __metadata("design:type", String)
], WeeklyTimeSlot.prototype, "start", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'end must be in HH:mm format',
    }),
    __metadata("design:type", String)
], WeeklyTimeSlot.prototype, "end", void 0);
class SaveCoachSlotsDto {
    slotDurationMinutes;
    weeksToGenerate;
    weeklySchedule;
}
exports.SaveCoachSlotsDto = SaveCoachSlotsDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], SaveCoachSlotsDto.prototype, "slotDurationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], SaveCoachSlotsDto.prototype, "weeksToGenerate", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SaveCoachSlotsDto.prototype, "weeklySchedule", void 0);
//# sourceMappingURL=create-coach-slot.dto.js.map