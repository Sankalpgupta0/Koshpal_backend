import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { FinanceModule } from '../../finance/finance.module';

@Module({
  imports: [FinanceModule],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
