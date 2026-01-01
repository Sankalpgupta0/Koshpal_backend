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
exports.ScopedPrismaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const role_enum_1 = require("../enums/role.enum");
let ScopedPrismaService = class ScopedPrismaService {
    prisma;
    context = null;
    constructor(prisma) {
        this.prisma = prisma;
    }
    setContext(context) {
        this.context = context;
    }
    ensureContext() {
        if (!this.context) {
            throw new Error('ScopedPrismaService: Context not set. Call setContext() first.');
        }
        return this.context;
    }
    applyCompanyScope(args, modelName) {
        const context = this.ensureContext();
        if (context.role === role_enum_1.Role.ADMIN) {
            return args;
        }
        const where = args.where || {};
        args.where = {
            ...where,
            companyId: context.companyId,
        };
        return args;
    }
    applyUserScope(args, modelName) {
        const context = this.ensureContext();
        if (context.role === role_enum_1.Role.ADMIN) {
            return args;
        }
        if (context.role === role_enum_1.Role.EMPLOYEE) {
            const where = args.where || {};
            args.where = {
                ...where,
                userId: context.userId,
            };
        }
        return args;
    }
    get account() {
        return {
            findMany: (args) => {
                const scopedArgs = this.applyUserScope(args || {}, 'Account');
                return this.prisma.account.findMany(scopedArgs);
            },
            findFirst: (args) => {
                const scopedArgs = this.applyUserScope(args || {}, 'Account');
                return this.prisma.account.findFirst(scopedArgs);
            },
            findUnique: (args) => {
                return this.prisma.account.findUnique(args);
            },
            create: (args) => {
                const context = this.ensureContext();
                if ('userId' in args.data) {
                    delete args.data.userId;
                }
                args.data.user = {
                    connect: { id: context.userId },
                };
                args.data.companyId = context.companyId;
                return this.prisma.account.create(args);
            },
            update: (args) => {
                return this.prisma.account.update(args);
            },
            delete: (args) => {
                return this.prisma.account.delete(args);
            },
            count: (args) => {
                const scopedArgs = this.applyUserScope(args || {}, 'Account');
                return this.prisma.account.count(scopedArgs);
            },
        };
    }
    get transaction() {
        return {
            findMany: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to transaction data');
                }
                const scopedArgs = this.applyUserScope(args || {}, 'Transaction');
                return this.prisma.transaction.findMany(scopedArgs);
            },
            findFirst: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to transaction data');
                }
                const scopedArgs = this.applyUserScope(args || {}, 'Transaction');
                return this.prisma.transaction.findFirst(scopedArgs);
            },
            findUnique: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to transaction data');
                }
                return this.prisma.transaction.findUnique(args);
            },
            create: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to transaction data');
                }
                if ('userId' in args.data) {
                    delete args.data.userId;
                }
                args.data.user = {
                    connect: { id: context.userId },
                };
                args.data.companyId = context.companyId;
                return this.prisma.transaction.create(args);
            },
            update: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to transaction data');
                }
                return this.prisma.transaction.update(args);
            },
            delete: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to transaction data');
                }
                return this.prisma.transaction.delete(args);
            },
            count: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to transaction data');
                }
                const scopedArgs = this.applyUserScope(args || {}, 'Transaction');
                return this.prisma.transaction.count(scopedArgs);
            },
        };
    }
    get monthlySummary() {
        return {
            findMany: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to financial insights');
                }
                const scopedArgs = this.applyUserScope(args || {}, 'MonthlySummary');
                return this.prisma.monthlySummary.findMany(scopedArgs);
            },
            findFirst: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to financial insights');
                }
                const scopedArgs = this.applyUserScope(args || {}, 'MonthlySummary');
                return this.prisma.monthlySummary.findFirst(scopedArgs);
            },
            findUnique: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to financial insights');
                }
                return this.prisma.monthlySummary.findUnique(args);
            },
            create: (args) => {
                const context = this.ensureContext();
                if ('userId' in args.data) {
                    delete args.data.userId;
                }
                args.data.user = {
                    connect: { id: context.userId },
                };
                args.data.companyId = context.companyId;
                return this.prisma.monthlySummary.create(args);
            },
            upsert: (args) => {
                const context = this.ensureContext();
                if ('userId' in args.create) {
                    delete args.create.userId;
                }
                args.create.user = {
                    connect: { id: context.userId },
                };
                args.create.companyId = context.companyId;
                return this.prisma.monthlySummary.upsert(args);
            },
            update: (args) => {
                const context = this.ensureContext();
                if (context.role === role_enum_1.Role.HR) {
                    throw new Error('HR role does not have access to financial insights');
                }
                return this.prisma.monthlySummary.update(args);
            },
            delete: (args) => {
                return this.prisma.monthlySummary.delete(args);
            },
        };
    }
    get user() {
        return {
            findMany: (args) => {
                const scopedArgs = this.applyCompanyScope(args || {}, 'User');
                return this.prisma.user.findMany(scopedArgs);
            },
            findFirst: (args) => {
                const scopedArgs = this.applyCompanyScope(args || {}, 'User');
                return this.prisma.user.findFirst(scopedArgs);
            },
            findUnique: (args) => {
                return this.prisma.user.findUnique(args);
            },
            create: (args) => {
                const context = this.ensureContext();
                args.data.companyId = context.companyId;
                return this.prisma.user.create(args);
            },
            update: (args) => {
                return this.prisma.user.update(args);
            },
        };
    }
    get employeeProfile() {
        return {
            findMany: (args) => {
                const scopedArgs = this.applyCompanyScope(args || {}, 'EmployeeProfile');
                return this.prisma.employeeProfile.findMany(scopedArgs);
            },
            findFirst: (args) => {
                const scopedArgs = this.applyCompanyScope(args || {}, 'EmployeeProfile');
                return this.prisma.employeeProfile.findFirst(scopedArgs);
            },
            findUnique: (args) => {
                return this.prisma.employeeProfile.findUnique(args);
            },
            create: (args) => {
                const context = this.ensureContext();
                args.data.companyId = context.companyId;
                return this.prisma.employeeProfile.create(args);
            },
            update: (args) => {
                return this.prisma.employeeProfile.update(args);
            },
        };
    }
    get employeeUploadBatch() {
        return {
            findMany: (args) => {
                const scopedArgs = this.applyCompanyScope(args || {}, 'EmployeeUploadBatch');
                return this.prisma.employeeUploadBatch.findMany(scopedArgs);
            },
            create: (args) => {
                const context = this.ensureContext();
                args.data.companyId = context.companyId;
                args.data.hrUserId = context.userId;
                return this.prisma.employeeUploadBatch.create(args);
            },
            update: (args) => {
                return this.prisma.employeeUploadBatch.update(args);
            },
        };
    }
    get $transaction() {
        return this.prisma.$transaction.bind(this.prisma);
    }
    get $queryRaw() {
        return this.prisma.$queryRaw.bind(this.prisma);
    }
    get $executeRaw() {
        return this.prisma.$executeRaw.bind(this.prisma);
    }
};
exports.ScopedPrismaService = ScopedPrismaService;
exports.ScopedPrismaService = ScopedPrismaService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScopedPrismaService);
//# sourceMappingURL=scoped-prisma.service.js.map