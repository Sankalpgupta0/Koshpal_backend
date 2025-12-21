import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeCoachController } from './employee-coach.controller';
import { EmployeeCoachService } from './employee-coach.service';
import { FinanceModule } from '../../finance/finance.module';
import { GoalsModule } from './goals/goals.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [FinanceModule, GoalsModule, PrismaModule],
  controllers: [EmployeeController, EmployeeCoachController],
  providers: [EmployeeCoachService],
})
export class EmployeeModule {}
