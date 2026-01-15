import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeCoachController } from './employee-coach.controller';
import { EmployeeSlotsController } from './employee-slots.controller';
import { EmployeeService } from './employee.service';
import { EmployeeCoachService } from './employee-coach.service';
import { EmployeeSlotsService } from './employee-slots.service';
import { FinanceModule } from '../../finance/finance.module';
import { GoalsModule } from './goals/goals.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [FinanceModule, GoalsModule, PrismaModule],
  controllers: [EmployeeController, EmployeeCoachController, EmployeeSlotsController],
  providers: [EmployeeService, EmployeeCoachService, EmployeeSlotsService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
