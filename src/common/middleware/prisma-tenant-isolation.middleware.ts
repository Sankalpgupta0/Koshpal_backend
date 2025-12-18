import { Prisma, PrismaClient } from '@prisma/client';
import { tenantStorage } from './tenant-context.middleware';

/**
 * Prisma Tenant Isolation Middleware
 * 
 * Automatically injects companyId filter into all Prisma queries
 * for multi-tenant models. This prevents accidental cross-company
 * data leaks at the database query level.
 * 
 * SECURITY CRITICAL: This is the last line of defense against
 * cross-tenant data access.
 * 
 * Models with tenant isolation:
 * - User (companyId)
 * - Transaction (companyId)
 * - Account (companyId)
 * - MonthlySummary (companyId)
 * - EmployeeProfile (companyId)
 * - HRProfile (companyId)
 * - EmployeeUploadBatch (companyId)
 * 
 * Models without tenant isolation:
 * - Company (admin-only access)
 * - AdminProfile (no company association)
 * - CoachProfile (global coaches)
 * - CoachSlot (coach availability)
 * - ConsultationBooking (cross-company allowed)
 * - FinancialGoal (isolated via userId)
 */
export function enableTenantIsolation(prisma: PrismaClient) {
  // Use Prisma extension for middleware functionality
  prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          // Models that require tenant isolation
          const multiTenantModels = [
            'User',
            'Transaction',
            'Account',
            'MonthlySummary',
            'EmployeeProfile',
            'HRProfile',
            'EmployeeUploadBatch',
          ];

          // Only apply to multi-tenant models
          if (!multiTenantModels.includes(model || '')) {
            return query(args);
          }

          // Get tenant context from AsyncLocalStorage
          const context = tenantStorage.getStore();

          // If no context (e.g., background jobs, seeds), allow query
          // Background jobs should explicitly set companyId in their queries
          if (!context) {
            return query(args);
          }

          // ADMIN role can access all companies
          if (context.role === 'ADMIN') {
            return query(args);
          }

          // If user has no companyId, block the query
          if (!context.companyId) {
            throw new Error(
              `SECURITY: User ${context.userId} with role ${context.role} has no companyId. Query blocked.`,
            );
          }

          const companyId = context.companyId;

          // Inject companyId into queries based on operation
          if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'count') {
            args.where = { ...args.where, companyId };
          } else if (operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany') {
            args.where = { ...args.where, companyId };
          } else if (operation === 'create') {
            args.data = { ...args.data, companyId };
          } else if (operation === 'createMany') {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((record: any) => ({ ...record, companyId }));
            } else {
              args.data = { ...args.data, companyId };
            }
          } else if (operation === 'upsert') {
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
