import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { enableTenantIsolation } from '../src/common/middleware/prisma-tenant-isolation.middleware';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    console.log('✅ PrismaService: Connecting to database...');
    await this.$connect();
    console.log('✅ PrismaService: Connected successfully');
    
    // TODO: Enable tenant isolation middleware once Prisma extensions are properly configured
    // SECURITY CRITICAL: All queries must include companyId filter manually until this is implemented
    // The middleware code exists in src/common/middleware/prisma-tenant-isolation.middleware.ts
    // For now, developers MUST ensure all queries include companyId filter
    // enableTenantIsolation(this);
  }

  async enableShutdownHooks(app: INestApplication) {
    // Listen for app termination signals
    process.on('beforeExit', async () => {
      console.log('🔄 PrismaService: Disconnecting from database...');
      await app.close();
    });
  }

  async onModuleDestroy() {
    console.log('🔄 PrismaService: Module destroy - disconnecting...');
    await this.$disconnect();
    console.log('✅ PrismaService: Disconnected successfully');
  }
}
