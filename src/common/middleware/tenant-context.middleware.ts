import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  userId: string;
  companyId: string | null;
  role: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Tenant Context Middleware
 *
 * Extracts user context from JWT and stores it in AsyncLocalStorage.
 * This context is then used by Prisma middleware to automatically
 * filter queries by companyId, preventing cross-tenant data leaks.
 *
 * CRITICAL: This middleware must run AFTER JWT authentication
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (user) {
      const context: TenantContext = {
        userId: user.userId || user.sub,
        companyId: user.companyId || null,
        role: user.role,
      };

      // Store context in AsyncLocalStorage
      tenantStorage.run(context, () => {
        next();
      });
    } else {
      // No user context, proceed without tenant isolation
      // (e.g., public endpoints, health checks)
      next();
    }
  }
}
