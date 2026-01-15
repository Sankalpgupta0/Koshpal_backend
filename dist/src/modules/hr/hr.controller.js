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
exports.HrController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const hr_service_1 = require("./hr.service");
const profile_image_storage_1 = require("../../common/multer/profile-image.storage");
let HrController = class HrController {
    hrService;
    constructor(hrService) {
        this.hrService = hrService;
    }
    async uploadEmployees(file, user) {
        return this.hrService.handleUpload(file, user);
    }
    async getUploads(user) {
        return this.hrService.getBatchesForCompany(user.companyId);
    }
    async getUploadStatus(batchId) {
        return this.hrService.getBatchStatus(batchId);
    }
    async getEmployees(user) {
        return this.hrService.getEmployees(user.companyId);
    }
    async getDepartments(user) {
        return this.hrService.getDepartments(user.companyId);
    }
    async getEmployee(id, user) {
        return this.hrService.getEmployee(id, user.companyId);
    }
    async updateEmployeeStatus(id, user, isActive) {
        return this.hrService.updateEmployeeStatus(id, user.companyId, isActive);
    }
    async getInsightsSummary(user) {
        return this.hrService.getCompanyInsightsSummary(user.companyId);
    }
    async getDashboardStats(user) {
        return this.hrService.getDashboardStats(user.companyId);
    }
    async getFinancialHealthDistribution(user) {
        return this.hrService.getFinancialHealthDistribution(user.companyId);
    }
    async getParticipationByDepartment(user) {
        return this.hrService.getParticipationByDepartment(user.companyId);
    }
    async getDashboardAlerts(user) {
        return this.hrService.getDashboardAlerts(user.companyId);
    }
    async getProfile(user) {
        return this.hrService.getHrProfile(user.userId);
    }
    updateProfile(user, body, file) {
        return this.hrService.updateHrProfile(user.userId, body, file);
    }
};
exports.HrController = HrController;
__decorate([
    (0, common_1.Post)('employees/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.originalname.toLowerCase().endsWith('.csv')) {
                return cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "uploadEmployees", null);
__decorate([
    (0, common_1.Get)('uploads'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getUploads", null);
__decorate([
    (0, common_1.Get)('uploads/:batchId'),
    __param(0, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getUploadStatus", null);
__decorate([
    (0, common_1.Get)('employees'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getEmployees", null);
__decorate([
    (0, common_1.Get)('employees/departments/list'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getDepartments", null);
__decorate([
    (0, common_1.Get)('employees/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getEmployee", null);
__decorate([
    (0, common_1.Patch)('employees/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Boolean]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "updateEmployeeStatus", null);
__decorate([
    (0, common_1.Get)('insights/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getInsightsSummary", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('dashboard/financial-health'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getFinancialHealthDistribution", null);
__decorate([
    (0, common_1.Get)('dashboard/participation-by-department'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getParticipationByDepartment", null);
__decorate([
    (0, common_1.Get)('dashboard/alerts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getDashboardAlerts", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: profile_image_storage_1.profileImageStorage,
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "updateProfile", null);
exports.HrController = HrController = __decorate([
    (0, common_1.Controller)('api/v1/hr'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.HR),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [hr_service_1.HrService])
], HrController);
//# sourceMappingURL=hr.controller.js.map