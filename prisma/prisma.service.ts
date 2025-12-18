import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { enableTenantIsolation } from '../src/common/middleware/prisma-tenant-isolation.middleware';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
    
    // TODO: Enable tenant isolation middleware once Prisma extensions are properly configured
    // SECURITY CRITICAL: All queries must include companyId filter manually until this is implemented
    // The middleware code exists in src/common/middleware/prisma-tenant-isolation.middleware.ts
    // For now, developers MUST ensure all queries include companyId filter
    // enableTenantIsolation(this);
  }
}
