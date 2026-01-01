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
exports.InsightsController = void 0;
const common_1 = require("@nestjs/common");
const insights_service_1 = require("./insights.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const scoped_prisma_interceptor_1 = require("../../common/interceptors/scoped-prisma.interceptor");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const generate_summary_dto_1 = require("./dto/generate-summary.dto");
const update_budget_dto_1 = require("./dto/update-budget.dto");
let InsightsController = class InsightsController {
    insightsService;
    constructor(insightsService) {
        this.insightsService = insightsService;
    }
    async getMonthlySummaries(user, year, month) {
        return this.insightsService.getMonthlySummaries(user.userId, year ? parseInt(year) : undefined, month ? parseInt(month) : undefined);
    }
    async getLatestMonthlySummary(user) {
        return this.insightsService.getLatestMonthlySummary(user.userId);
    }
    async getYearlySummary(user, year) {
        return this.insightsService.getYearlySummary(user.userId, parseInt(year));
    }
    async getCategoryBreakdown(user, year, month) {
        return this.insightsService.getCategoryBreakdown(user.userId, year ? parseInt(year) : undefined, month ? parseInt(month) : undefined);
    }
    async getSpendingTrends(user, months) {
        return this.insightsService.getSpendingTrends(user.userId, months ? parseInt(months) : 6);
    }
    async generateMonthlySummary(user, dto) {
        return this.insightsService.generateMonthlySummary(user.userId, user.companyId, dto.month, dto.year);
    }
    async updateBudget(user, dto) {
        return this.insightsService.updateBudget(user.userId, user.companyId, dto.month, dto.year, dto.budget);
    }
    async getBudget(user, month, year) {
        return this.insightsService.getBudget(user.userId, parseInt(month), parseInt(year));
    }
};
exports.InsightsController = InsightsController;
__decorate([
    (0, common_1.Get)('monthly'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "getMonthlySummaries", null);
__decorate([
    (0, common_1.Get)('monthly/latest'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "getLatestMonthlySummary", null);
__decorate([
    (0, common_1.Get)('monthly/year/:year'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "getYearlySummary", null);
__decorate([
    (0, common_1.Get)('category-breakdown'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "getCategoryBreakdown", null);
__decorate([
    (0, common_1.Get)('trends'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('months')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "getSpendingTrends", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_summary_dto_1.GenerateSummaryDto]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "generateMonthlySummary", null);
__decorate([
    (0, common_1.Patch)('budget'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_budget_dto_1.UpdateBudgetDto]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "updateBudget", null);
__decorate([
    (0, common_1.Get)('budget'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "getBudget", null);
exports.InsightsController = InsightsController = __decorate([
    (0, common_1.Controller)('api/v1/insights'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(scoped_prisma_interceptor_1.ScopedPrismaInterceptor),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EMPLOYEE, role_enum_1.Role.ADMIN),
    __metadata("design:paramtypes", [insights_service_1.InsightsService])
], InsightsController);
//# sourceMappingURL=insights.controller.js.map