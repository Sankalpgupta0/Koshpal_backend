import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { FinanceModule } from '../../finance/finance.module';
import { GoalsModule } from './goals/goals.module';

@Module({
  imports: [FinanceModule, GoalsModule],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
