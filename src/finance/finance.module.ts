import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AccountsController } from './accounts/accounts.controller';
import { AccountsService } from './accounts/accounts.service';
import { TransactionsController } from './transactions/transactions.controller';
import { TransactionsService } from './transactions/transactions.service';
import { InsightsController } from './insights/insights.controller';
import { InsightsService } from './insights/insights.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'insight-queue',
    }),
  ],
  controllers: [AccountsController, TransactionsController, InsightsController],
  providers: [AccountsService, TransactionsService, InsightsService],
})
export class FinanceModule {}
