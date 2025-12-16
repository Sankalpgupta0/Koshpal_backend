import { Module } from '@nestjs/common';
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
import { HealthModule } from './common/health/health.module';
import { validate } from './common/config/env.validation';

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
        limit: 100, // 100 requests per minute
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 10, // 10 requests per minute for auth endpoints
      },
    ]),
    PrismaModule,
    AuthModule,
    AdminModule,
    HrModule,
    EmployeeModule,
    CoachModule,
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
export class AppModule {}
