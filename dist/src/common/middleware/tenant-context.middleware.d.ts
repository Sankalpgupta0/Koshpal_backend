import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
export interface TenantContext {
    userId: string;
    companyId: string | null;
    role: string;
}
export declare const tenantStorage: AsyncLocalStorage<TenantContext>;
export declare class TenantContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void;
}
