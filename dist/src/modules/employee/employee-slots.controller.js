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
exports.EmployeeSlotsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const throttler_1 = require("@nestjs/throttler");
const employee_slots_service_1 = require("./employee-slots.service");
let EmployeeSlotsController = class EmployeeSlotsController {
    employeeSlotsService;
    constructor(employeeSlotsService) {
        this.employeeSlotsService = employeeSlotsService;
    }
    async getSlotsByDate(date) {
        if (!date) {
            throw new common_1.BadRequestException('Date query parameter is required (format: YYYY-MM-DD)');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new common_1.BadRequestException('Invalid date format. Expected: YYYY-MM-DD');
        }
        return await this.employeeSlotsService.getSlotsByDate(date);
    }
    async getSlotsByCoachAndDate(coachId, date) {
        if (!date) {
            throw new common_1.BadRequestException('Date query parameter is required (format: YYYY-MM-DD)');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new common_1.BadRequestException('Invalid date format. Expected: YYYY-MM-DD');
        }
        return await this.employeeSlotsService.getSlotsByCoachAndDate(coachId, date);
    }
    async getAvailableDates(startDate, endDate, coachId) {
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('Both startDate and endDate are required (format: YYYY-MM-DD)');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            throw new common_1.BadRequestException('Invalid date format. Expected: YYYY-MM-DD');
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 60) {
            throw new common_1.BadRequestException('Date range cannot exceed 60 days');
        }
        if (daysDiff < 0) {
            throw new common_1.BadRequestException('startDate must be before endDate');
        }
        return await this.employeeSlotsService.getAvailableDates(startDate, endDate, coachId);
    }
};
exports.EmployeeSlotsController = EmployeeSlotsController;
__decorate([
    (0, common_1.Get)(),
    (0, throttler_1.SkipThrottle)(),
    (0, throttler_1.Throttle)({ default: { limit: 50, ttl: 10000 } }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeSlotsController.prototype, "getSlotsByDate", null);
__decorate([
    (0, common_1.Get)('coach/:coachId'),
    (0, throttler_1.SkipThrottle)(),
    (0, throttler_1.Throttle)({ default: { limit: 50, ttl: 10000 } }),
    __param(0, (0, common_1.Param)('coachId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmployeeSlotsController.prototype, "getSlotsByCoachAndDate", null);
__decorate([
    (0, common_1.Get)('calendar'),
    (0, throttler_1.SkipThrottle)(),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 10000 } }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('coachId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EmployeeSlotsController.prototype, "getAvailableDates", null);
exports.EmployeeSlotsController = EmployeeSlotsController = __decorate([
    (0, common_1.Controller)('api/v1/employee/slots'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EMPLOYEE),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [employee_slots_service_1.EmployeeSlotsService])
], EmployeeSlotsController);
//# sourceMappingURL=employee-slots.controller.js.map