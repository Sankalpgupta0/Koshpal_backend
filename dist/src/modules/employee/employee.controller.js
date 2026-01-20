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
exports.EmployeeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const scoped_prisma_interceptor_1 = require("../../common/interceptors/scoped-prisma.interceptor");
const accounts_service_1 = require("../../finance/accounts/accounts.service");
const transactions_service_1 = require("../../finance/transactions/transactions.service");
const platform_express_1 = require("@nestjs/platform-express");
const profile_image_storage_1 = require("../../common/multer/profile-image.storage");
const insights_service_1 = require("../../finance/insights/insights.service");
const employee_service_1 = require("./employee.service");
const create_account_dto_1 = require("../../finance/accounts/dto/create-account.dto");
const create_transaction_dto_1 = require("../../finance/transactions/dto/create-transaction.dto");
let EmployeeController = class EmployeeController {
    employeeService;
    accountsService;
    transactionsService;
    insightsService;
    constructor(employeeService, accountsService, transactionsService, insightsService) {
        this.employeeService = employeeService;
        this.accountsService = accountsService;
        this.transactionsService = transactionsService;
        this.insightsService = insightsService;
    }
    async getProfile(user) {
        return this.employeeService.getFullProfile(user.userId);
    }
    async createAccount(createAccountDto, user) {
        const validatedUser = {
            userId: user.userId,
            companyId: '',
            role: user.role,
        };
        return this.accountsService.create(validatedUser, createAccountDto);
    }
    async getAccounts(user) {
        return this.accountsService.findUserAccounts(user.userId);
    }
    async updateAccount(id, updateAccountDto, user) {
        await this.accountsService.findOne(user.userId, id);
        const validatedUser = {
            userId: user.userId,
            companyId: '',
            role: user.role,
        };
        return this.accountsService.create(validatedUser, updateAccountDto);
    }
    async deleteAccount(id, user) {
        return this.accountsService.remove(user.userId, id);
    }
    async createTransaction(createTransactionDto, user) {
        const validatedUser = {
            userId: user.userId,
            companyId: '',
            role: user.role,
        };
        return this.transactionsService.create(validatedUser, createTransactionDto);
    }
    async getTransactions(user, accountId, type, category) {
        return this.transactionsService.findUserTransactions(user.userId, {
            accountId,
            type,
            category,
        });
    }
    async getTransaction(id, user) {
        return this.transactionsService.findOne(user.userId, id);
    }
    async deleteTransaction(id, user) {
        return this.transactionsService.remove(user.userId, id);
    }
    async getLatestSummary(user) {
        return this.insightsService.getLatestMonthlySummary(user.userId);
    }
    async getCategoryBreakdown(user, month, year) {
        return this.insightsService.getCategoryBreakdown(user.userId, month ? parseInt(month) : undefined, year ? parseInt(year) : undefined);
    }
    async getSpendingTrends(user, months) {
        return this.insightsService.getSpendingTrends(user.userId, months ? parseInt(months) : 6);
    }
    async updateProfile(req, body, file) {
        try {
            console.log('=== FILE UPLOAD DEBUG START ===');
            console.log('Employee Profile Update Request:', {
                userId: req.user.userId,
                userEmail: req.user.email,
                companyId: req.user.companyId,
                body,
                hasFile: !!file,
            });
            if (file) {
                console.log('File Details:', {
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    path: file.path,
                    filename: file.filename,
                    fieldname: file.fieldname,
                });
            }
            else {
                console.log('No file uploaded in request');
            }
            console.log('Cloudinary Config Check:', {
                cloudName: process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing',
                apiKey: process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing',
                apiSecret: process.env.CLOUDINARY_API_SECRET ? '✓ Set (hidden)' : '✗ Missing',
            });
            const result = await this.employeeService.updateOwnProfile(req.user.userId, body, file?.path, file?.filename);
            console.log('Profile update successful:', {
                userId: req.user.userId,
                updatedFields: Object.keys(body),
                imageUploaded: !!file,
            });
            console.log('=== FILE UPLOAD DEBUG END ===');
            return result;
        }
        catch (error) {
            console.error('=== FILE UPLOAD ERROR ===');
            console.error('Error in employee profile update:', error);
            console.error('Error stack:', error.stack);
            console.error('=== FILE UPLOAD ERROR END ===');
            if (error.message?.includes('Cloudinary') || error.message?.includes('storage')) {
                console.log('Cloudinary error, updating profile without image');
                return await this.employeeService.updateOwnProfile(req.user.userId, body, undefined, undefined);
            }
            throw error;
        }
    }
    async getMyProfile(user) {
        return this.employeeService.getMyProfile(user.userId);
    }
};
exports.EmployeeController = EmployeeController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('accounts'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_account_dto_1.CreateAccountDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Patch)('accounts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_account_dto_1.CreateAccountDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "updateAccount", null);
__decorate([
    (0, common_1.Delete)('accounts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Post)('transactions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transaction_dto_1.CreateTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('transactions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getTransaction", null);
__decorate([
    (0, common_1.Delete)('transactions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "deleteTransaction", null);
__decorate([
    (0, common_1.Get)('insights/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getLatestSummary", null);
__decorate([
    (0, common_1.Get)('insights/categories'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getCategoryBreakdown", null);
__decorate([
    (0, common_1.Get)('insights/trend'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('months')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getSpendingTrends", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: profile_image_storage_1.profileImageStorage,
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                cb(null, true);
            }
            else {
                cb(new Error('Only image files are allowed!'), false);
            }
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeController.prototype, "getMyProfile", null);
exports.EmployeeController = EmployeeController = __decorate([
    (0, common_1.Controller)('api/v1/employee'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.EMPLOYEE),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(scoped_prisma_interceptor_1.ScopedPrismaInterceptor),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService,
        accounts_service_1.AccountsService,
        transactions_service_1.TransactionsService,
        insights_service_1.InsightsService])
], EmployeeController);
//# sourceMappingURL=employee.controller.js.map