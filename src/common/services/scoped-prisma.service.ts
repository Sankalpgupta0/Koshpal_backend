/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
import { Injectable, Scope } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role } from '../enums/role.enum';

interface ScopeContext {
  userId: string;
  companyId: string;
  role: Role;
}

@Injectable({ scope: Scope.REQUEST })
export class ScopedPrismaService {
  private context: ScopeContext | null = null;

  constructor(private readonly prisma: PrismaService) {}

  setContext(context: ScopeContext) {
    this.context = context;
  }

  private ensureContext(): ScopeContext {
    if (!this.context) {
      throw new Error(
        'ScopedPrismaService: Context not set. Call setContext() first.',
      );
    }
    return this.context;
  }

  private applyCompanyScope<T extends any>(args: T, modelName: string): T {
    const context = this.ensureContext();

    // ADMIN can access all data
    if (context.role === Role.ADMIN) {
      return args;
    }

    // Add companyId filter for non-admin users
    const where = (args as any).where || {};
    (args as any).where = {
      ...where,
      companyId: context.companyId,
    };

    return args;
  }

  private applyUserScope<T extends any>(args: T, modelName: string): T {
    const context = this.ensureContext();

    // ADMIN can access all data
    if (context.role === Role.ADMIN) {
      return args;
    }

    // EMPLOYEE can only access their own data
    if (context.role === Role.EMPLOYEE) {
      const where = (args as any).where || {};
      (args as any).where = {
        ...where,
        userId: context.userId,
      };
    }

    return args;
  }

  // Override Prisma methods with scoping

  get account(): any {
    return {
      findMany: (args?: Prisma.AccountFindManyArgs) => {
        const scopedArgs = this.applyUserScope(args || {}, 'Account');
        return this.prisma.account.findMany(scopedArgs);
      },
      findFirst: (args?: Prisma.AccountFindFirstArgs) => {
        const scopedArgs = this.applyUserScope(args || {}, 'Account');
        return this.prisma.account.findFirst(scopedArgs);
      },
      findUnique: (args: Prisma.AccountFindUniqueArgs) => {
        return this.prisma.account.findUnique(args);
      },
      create: (args: Prisma.AccountCreateArgs) => {
        const context = this.ensureContext();

        // Remove userId if it exists in data (we'll use the relation instead)
        if ('userId' in (args.data as any)) {
          delete (args.data as any).userId;
        }

        // Set the user relation using connect instead of scalar userId
        (args.data as any).user = {
          connect: { id: context.userId },
        };
        (args.data as any).companyId = context.companyId;

        return this.prisma.account.create(args);
      },
      update: (args: Prisma.AccountUpdateArgs) => {
        return this.prisma.account.update(args);
      },
      delete: (args: Prisma.AccountDeleteArgs) => {
        return this.prisma.account.delete(args);
      },
      count: (args?: Prisma.AccountCountArgs) => {
        const scopedArgs = this.applyUserScope(args || {}, 'Account');
        return this.prisma.account.count(scopedArgs);
      },
    };
  }

  get transaction(): any {
    return {
      findMany: (args?: Prisma.TransactionFindManyArgs) => {
        const context = this.ensureContext();

        // HR cannot access transaction data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to transaction data');
        }

        const scopedArgs = this.applyUserScope(args || {}, 'Transaction');
        return this.prisma.transaction.findMany(scopedArgs);
      },
      findFirst: (args?: Prisma.TransactionFindFirstArgs) => {
        const context = this.ensureContext();

        // HR cannot access transaction data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to transaction data');
        }

        const scopedArgs = this.applyUserScope(args || {}, 'Transaction');
        return this.prisma.transaction.findFirst(scopedArgs);
      },
      findUnique: (args: Prisma.TransactionFindUniqueArgs) => {
        const context = this.ensureContext();

        // HR cannot access transaction data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to transaction data');
        }

        return this.prisma.transaction.findUnique(args);
      },
      create: (args: Prisma.TransactionCreateArgs) => {
        const context = this.ensureContext();

        // HR cannot create transaction data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to transaction data');
        }

        // Remove userId if it exists in data (we'll use the relation instead)
        if ('userId' in (args.data as any)) {
          delete (args.data as any).userId;
        }

        // Set the user relation using connect instead of scalar userId
        (args.data as any).user = {
          connect: { id: context.userId },
        };
        (args.data as any).companyId = context.companyId;

        return this.prisma.transaction.create(args);
      },
      update: (args: Prisma.TransactionUpdateArgs) => {
        const context = this.ensureContext();

        // HR cannot update transaction data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to transaction data');
        }

        return this.prisma.transaction.update(args);
      },
      delete: (args: Prisma.TransactionDeleteArgs) => {
        const context = this.ensureContext();

        // HR cannot delete transaction data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to transaction data');
        }

        return this.prisma.transaction.delete(args);
      },
      count: (args?: Prisma.TransactionCountArgs) => {
        const context = this.ensureContext();

        // HR cannot count transaction data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to transaction data');
        }

        const scopedArgs = this.applyUserScope(args || {}, 'Transaction');
        return this.prisma.transaction.count(scopedArgs);
      },
    };
  }

  get monthlySummary(): any {
    return {
      findMany: (args?: Prisma.MonthlySummaryFindManyArgs) => {
        const context = this.ensureContext();

        // HR cannot access monthly summary data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to financial insights');
        }

        const scopedArgs = this.applyUserScope(args || {}, 'MonthlySummary');
        return this.prisma.monthlySummary.findMany(scopedArgs);
      },
      findFirst: (args?: Prisma.MonthlySummaryFindFirstArgs) => {
        const context = this.ensureContext();

        // HR cannot access monthly summary data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to financial insights');
        }

        const scopedArgs = this.applyUserScope(args || {}, 'MonthlySummary');
        return this.prisma.monthlySummary.findFirst(scopedArgs);
      },
      findUnique: (args: Prisma.MonthlySummaryFindUniqueArgs) => {
        const context = this.ensureContext();

        // HR cannot access monthly summary data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to financial insights');
        }

        return this.prisma.monthlySummary.findUnique(args);
      },
      create: (args: Prisma.MonthlySummaryCreateArgs) => {
        const context = this.ensureContext();

        // Remove userId if it exists in data
        if ('userId' in (args.data as any)) {
          delete (args.data as any).userId;
        }

        // Set the user relation using connect
        (args.data as any).user = {
          connect: { id: context.userId },
        };
        (args.data as any).companyId = context.companyId;

        return this.prisma.monthlySummary.create(args);
      },
      upsert: (args: Prisma.MonthlySummaryUpsertArgs) => {
        const context = this.ensureContext();

        // Remove userId if it exists in create data
        if ('userId' in (args.create as any)) {
          delete (args.create as any).userId;
        }

        // Set the user relation using connect
        (args.create as any).user = {
          connect: { id: context.userId },
        };
        (args.create as any).companyId = context.companyId;

        return this.prisma.monthlySummary.upsert(args);
      },
      update: (args: Prisma.MonthlySummaryUpdateArgs) => {
        const context = this.ensureContext();

        // HR cannot update monthly summary data
        if (context.role === Role.HR) {
          throw new Error('HR role does not have access to financial insights');
        }

        return this.prisma.monthlySummary.update(args);
      },
      delete: (args: Prisma.MonthlySummaryDeleteArgs) => {
        return this.prisma.monthlySummary.delete(args);
      },
    };
  }

  get user(): any {
    return {
      findMany: (args?: Prisma.UserFindManyArgs) => {
        const scopedArgs = this.applyCompanyScope(args || {}, 'User');
        return this.prisma.user.findMany(scopedArgs);
      },
      findFirst: (args?: Prisma.UserFindFirstArgs) => {
        const scopedArgs = this.applyCompanyScope(args || {}, 'User');
        return this.prisma.user.findFirst(scopedArgs);
      },
      findUnique: (args: Prisma.UserFindUniqueArgs) => {
        return this.prisma.user.findUnique(args);
      },
      create: (args: Prisma.UserCreateArgs) => {
        const context = this.ensureContext();
        (args.data as any).companyId = context.companyId;
        return this.prisma.user.create(args);
      },
      update: (args: Prisma.UserUpdateArgs) => {
        return this.prisma.user.update(args);
      },
    };
  }

  get employeeProfile(): any {
    return {
      findMany: (args?: Prisma.EmployeeProfileFindManyArgs) => {
        const scopedArgs = this.applyCompanyScope(
          args || {},
          'EmployeeProfile',
        );
        return this.prisma.employeeProfile.findMany(scopedArgs);
      },
      findFirst: (args?: Prisma.EmployeeProfileFindFirstArgs) => {
        const scopedArgs = this.applyCompanyScope(
          args || {},
          'EmployeeProfile',
        );
        return this.prisma.employeeProfile.findFirst(scopedArgs);
      },
      findUnique: (args: Prisma.EmployeeProfileFindUniqueArgs) => {
        return this.prisma.employeeProfile.findUnique(args);
      },
      create: (args: Prisma.EmployeeProfileCreateArgs) => {
        const context = this.ensureContext();
        (args.data as any).companyId = context.companyId;
        return this.prisma.employeeProfile.create(args);
      },
      update: (args: Prisma.EmployeeProfileUpdateArgs) => {
        return this.prisma.employeeProfile.update(args);
      },
    };
  }

  get employeeUploadBatch(): any {
    return {
      findMany: (args?: Prisma.EmployeeUploadBatchFindManyArgs) => {
        const scopedArgs = this.applyCompanyScope(
          args || {},
          'EmployeeUploadBatch',
        );
        return this.prisma.employeeUploadBatch.findMany(scopedArgs);
      },
      create: (args: Prisma.EmployeeUploadBatchCreateArgs) => {
        const context = this.ensureContext();
        (args.data as any).companyId = context.companyId;
        (args.data as any).hrUserId = context.userId;
        return this.prisma.employeeUploadBatch.create(args);
      },
      update: (args: Prisma.EmployeeUploadBatchUpdateArgs) => {
        return this.prisma.employeeUploadBatch.update(args);
      },
    };
  }

  // Provide access to raw prisma for transactions and special cases
  get $transaction(): any {
    return this.prisma.$transaction.bind(this.prisma);
  }

  get $queryRaw(): any {
    return this.prisma.$queryRaw.bind(this.prisma);
  }

  get $executeRaw(): any {
    return this.prisma.$executeRaw.bind(this.prisma);
  }
}
