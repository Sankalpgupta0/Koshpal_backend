import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BulkCreateTransactionDto } from './dto/bulk-create-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { ValidatedUser } from '../../common/types/user.types';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post()
  create(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.service.create(user, dto);
  }

  @Post('bulk')
  bulkCreate(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: BulkCreateTransactionDto,
  ) {
    return this.service.bulkCreate(user, dto);
  }

  @Get()
  getMyTransactions(
    @CurrentUser() user: ValidatedUser,
    @Query('accountId') accountId?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    return this.service.findUserTransactions(user.userId, {
      accountId,
      type,
      category,
    });
  }

  @Get(':id')
  getTransaction(
    @CurrentUser() user: ValidatedUser,
    @Param('id') id: string,
  ) {
    return this.service.findOne(user.userId, id);
  }

  @Delete(':id')
  deleteTransaction(
    @CurrentUser() user: ValidatedUser,
    @Param('id') id: string,
  ) {
    return this.service.remove(user.userId, id);
  }
}
