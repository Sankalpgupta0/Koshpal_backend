import { PrismaService } from '../../../prisma/prisma.service';
import { Role } from '../enums/role.enum';
interface ScopeContext {
    userId: string;
    companyId: string;
    role: Role;
}
export declare class ScopedPrismaService {
    private readonly prisma;
    private context;
    constructor(prisma: PrismaService);
    setContext(context: ScopeContext): void;
    private ensureContext;
    private applyCompanyScope;
    private applyUserScope;
    get account(): any;
    get transaction(): any;
    get monthlySummary(): any;
    get user(): any;
    get employeeProfile(): any;
    get employeeUploadBatch(): any;
    get $transaction(): any;
    get $queryRaw(): any;
    get $executeRaw(): any;
}
export {};
