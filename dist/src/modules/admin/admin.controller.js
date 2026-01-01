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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const admin_dto_1 = require("./dto/admin.dto");
const deactivate_coach_dto_1 = require("./dto/deactivate-coach.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    createCompany(dto) {
        return this.adminService.createCompany(dto);
    }
    getCompanies() {
        return this.adminService.getCompanies();
    }
    getCompany(id) {
        return this.adminService.getCompany(id);
    }
    updateCompanyStatus(id, dto) {
        return this.adminService.updateCompanyStatus(id, dto);
    }
    updateCompanyLimits(id, dto) {
        return this.adminService.updateCompanyLimits(id, dto);
    }
    createHr(dto) {
        return this.adminService.createHr(dto);
    }
    getHrs() {
        return this.adminService.getHrs();
    }
    getHr(id) {
        return this.adminService.getHr(id);
    }
    updateHrStatus(id, dto) {
        return this.adminService.updateHrStatus(id, dto);
    }
    getCoaches() {
        return this.adminService.getCoaches();
    }
    getCoach(id) {
        return this.adminService.getCoach(id);
    }
    deactivateCoach(id, dto) {
        return this.adminService.deactivateCoach(id, dto.reason);
    }
    reactivateCoach(id) {
        return this.adminService.reactivateCoach(id);
    }
    getStats() {
        return this.adminService.getStats();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('companies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateCompanyDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createCompany", null);
__decorate([
    (0, common_1.Get)('companies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCompanies", null);
__decorate([
    (0, common_1.Get)('companies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCompany", null);
__decorate([
    (0, common_1.Patch)('companies/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateCompanyStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateCompanyStatus", null);
__decorate([
    (0, common_1.Patch)('companies/:id/limits'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateCompanyLimitsDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateCompanyLimits", null);
__decorate([
    (0, common_1.Post)('hrs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateHrDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createHr", null);
__decorate([
    (0, common_1.Get)('hrs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getHrs", null);
__decorate([
    (0, common_1.Get)('hrs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getHr", null);
__decorate([
    (0, common_1.Patch)('hrs/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateHrStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateHrStatus", null);
__decorate([
    (0, common_1.Get)('coaches'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCoaches", null);
__decorate([
    (0, common_1.Get)('coaches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCoach", null);
__decorate([
    (0, common_1.Patch)('coaches/:id/deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, deactivate_coach_dto_1.DeactivateCoachDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deactivateCoach", null);
__decorate([
    (0, common_1.Patch)('coaches/:id/reactivate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "reactivateCoach", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getStats", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('api/v1/admin'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map