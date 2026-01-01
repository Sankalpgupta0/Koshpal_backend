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
exports.ConsultationController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const consultation_service_1 = require("./consultation.service");
const book_consultation_dto_1 = require("./dto/book-consultation.dto");
const cancel_consultation_dto_1 = require("./dto/cancel-consultation.dto");
let ConsultationController = class ConsultationController {
    consultationService;
    constructor(consultationService) {
        this.consultationService = consultationService;
    }
    async getCoaches() {
        return this.consultationService.getCoaches();
    }
    async getCoachSlots(coachId, date) {
        return this.consultationService.getCoachSlots(coachId, date);
    }
    async bookConsultation(user, dto) {
        return this.consultationService.bookConsultation(user, dto);
    }
    async getMyConsultations(user, filter, startDate, endDate) {
        return this.consultationService.getEmployeeConsultations(user.userId, filter, startDate, endDate);
    }
    async getMyConsultationStats(user) {
        return this.consultationService.getEmployeeConsultationStats(user.userId);
    }
    async getMyLatestConsultation(user) {
        return this.consultationService.getLatestConsultation(user.userId);
    }
    async getConsultationDetails(user, id) {
        return this.consultationService.getConsultationDetails(user.userId, id);
    }
    async cancelConsultation(user, id, dto) {
        return this.consultationService.cancelConsultationByEmployee(user.userId, id, dto.reason);
    }
};
exports.ConsultationController = ConsultationController;
__decorate([
    (0, common_1.Get)('coaches'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "getCoaches", null);
__decorate([
    (0, common_1.Get)('coaches/:coachId/slots'),
    __param(0, (0, common_1.Param)('coachId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "getCoachSlots", null);
__decorate([
    (0, common_1.Post)('consultations/book'),
    (0, throttler_1.SkipThrottle)({ default: false }),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, book_consultation_dto_1.BookConsultationDto]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "bookConsultation", null);
__decorate([
    (0, common_1.Get)('consultations'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('filter')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "getMyConsultations", null);
__decorate([
    (0, common_1.Get)('consultations/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "getMyConsultationStats", null);
__decorate([
    (0, common_1.Get)('consultations/latest'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "getMyLatestConsultation", null);
__decorate([
    (0, common_1.Get)('consultations/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ConsultationController.prototype, "getConsultationDetails", null);
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
], ConsultationController.prototype, "cancelConsultation", null);
exports.ConsultationController = ConsultationController = __decorate([
    (0, common_1.Controller)('api/v1/employee'),
    (0, throttler_1.SkipThrottle)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EMPLOYEE),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [consultation_service_1.ConsultationService])
], ConsultationController);
//# sourceMappingURL=consultation.controller.js.map