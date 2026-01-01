"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableTenantIsolation = enableTenantIsolation;
const tenant_context_middleware_1 = require("./tenant-context.middleware");
function enableTenantIsolation(prisma) {
    prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const multiTenantModels = [
                        'User',
                        'Transaction',
                        'Account',
                        'MonthlySummary',
                        'EmployeeProfile',
                        'HRProfile',
                        'EmployeeUploadBatch',
                    ];
                    if (!multiTenantModels.includes(model || '')) {
                        return query(args);
                    }
                    const context = tenant_context_middleware_1.tenantStorage.getStore();
                    if (!context) {
                        return query(args);
                    }
                    if (context.role === 'ADMIN') {
                        return query(args);
                    }
                    if (!context.companyId) {
                        throw new Error(`SECURITY: User ${context.userId} with role ${context.role} has no companyId. Query blocked.`);
                    }
                    const companyId = context.companyId;
                    if (operation === 'findUnique' ||
                        operation === 'findFirst' ||
                        operation === 'findMany' ||
                        operation === 'count') {
                        args.where = { ...args.where, companyId };
                    }
                    else if (operation === 'update' ||
                        operation === 'updateMany' ||
                        operation === 'delete' ||
                        operation === 'deleteMany') {
                        args.where = { ...args.where, companyId };
                    }
                    else if (operation === 'create') {
                        args.data = { ...args.data, companyId };
                    }
                    else if (operation === 'createMany') {
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((record) => ({
                                ...record,
                                companyId,
                            }));
                        }
                        else {
                            args.data = { ...args.data, companyId };
                        }
                    }
                    else if (operation === 'upsert') {
                        args.where = { ...args.where, companyId };
                        args.create = { ...args.create, companyId };
                        args.update = { ...args.update, companyId };
                    }
                    return query(args);
                },
            },
        },
    });
}
//# sourceMappingURL=prisma-tenant-isolation.middleware.js.map