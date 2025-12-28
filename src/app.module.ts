import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { HrModule } from './modules/hr/hr.module';
import { FinanceModule } from './finance/finance.module';
import { AdminModule } from './modules/admin/admin.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { CoachModule } from './modules/coach/coach.module';
import { ConsultationModule } from './modules/consultation/consultation.module';
import { HealthModule } from './common/health/health.module';
import { validate } from './common/config/env.validation';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      cache: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 seconds
        limit: 2000, // 2000 requests per minute
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 100, // 100 requests per minute for auth endpoints
      },
    ]),
    PrismaModule,
    AuthModule,
    AdminModule,
    HrModule,
    EmployeeModule,
    CoachModule,
    ConsultationModule,
    FinanceModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant context middleware to all routes
    // This must run AFTER JWT authentication middleware
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
