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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const coach_service_1 = require("./coach.service");
const consultation_service_1 = require("../consultation/consultation.service");
const create_coach_slot_dto_1 = require("./dto/create-coach-slot.dto");
const cancel_consultation_dto_1 = require("../consultation/dto/cancel-consultation.dto");
let CoachController = class CoachController {
    coachService;
    consultationService;
    constructor(coachService, consultationService) {
        this.coachService = coachService;
        this.consultationService = consultationService;
    }
    async createSlots(user, dto) {
        return this.coachService.createSlots(user.userId, dto);
    }
    async getSlots(user, date) {
        return this.coachService.getSlots(user.userId, date);
    }
    async saveWeeklyAvailability(user, dto) {
        return this.coachService.saveWeeklyAvailability(user.userId, dto);
    }
    async getWeeklySchedule(user, weeks) {
        const weeksCount = weeks ? parseInt(weeks, 10) : 1;
        return this.coachService.getWeeklySchedule(user.userId, weeksCount);
    }
    async deleteSlot(user, slotId) {
        return this.coachService.deleteSlot(user.userId, slotId);
    }
    async getConsultations(user, filter) {
        return this.coachService.getConsultations(user.userId, filter);
    }
    async getConsultationStats(user) {
        return this.coachService.getConsultationStats(user.userId);
    }
    async cancelConsultation(user, id, dto) {
        return this.consultationService.cancelConsultationByCoach(user.userId, id, dto.reason);
    }
    async completeConsultation(user, id) {
        return this.consultationService.completeConsultationByCoach(user.userId, id);
    }
    async getProfile(user) {
        return this.coachService.getCoachProfile(user.userId);
    }
    async updateTimezone(user, timezone) {
        return this.coachService.updateCoachTimezone(user.userId, timezone);
    }
};
exports.CoachController = CoachController;
__decorate([
    (0, common_1.Post)('slots/date'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_coach_slot_dto_1.CreateCoachSlotDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "createSlots", null);
__decorate([
    (0, common_1.Get)('slots'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getSlots", null);
__decorate([
    (0, common_1.Post)('slots'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_coach_slot_dto_1.SaveCoachSlotsDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "saveWeeklyAvailability", null);
__decorate([
    (0, common_1.Get)('slots/weekly'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('weeks')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getWeeklySchedule", null);
__decorate([
    (0, common_1.Delete)('slots/:slotId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('slotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "deleteSlot", null);
__decorate([
    (0, common_1.Get)('consultations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('filter')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getConsultations", null);
__decorate([
    (0, common_1.Get)('consultations/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getConsultationStats", null);
__decorate([
    (0, common_1.Patch)('consultations/:id/cancel'),
    (0, throttler_1.SkipThrottle)({ default: false }),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 3600000 } }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cancel_consultation_dto_1.CancelConsultationDto]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "cancelConsultation", null);
__decorate([
    (0, common_1.Patch)('consultations/:id/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "completeConsultation", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile/timezone'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('timezone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachController.prototype, "updateTimezone", null);
exports.CoachController = CoachController = __decorate([
    (0, common_1.Controller)('api/v1/coach'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.COACH),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [coach_service_1.CoachService,
        consultation_service_1.ConsultationService])
], CoachController);
//# sourceMappingURL=coach.controller.js.map