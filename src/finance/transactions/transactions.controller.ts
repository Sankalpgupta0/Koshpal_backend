import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BulkCreateTransactionDto } from './dto/bulk-create-transaction.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ScopedPrismaInterceptor } from '../../common/interceptors/scoped-prisma.interceptor';
import type { ValidatedUser } from '../../common/types/user.types';

@Controller('api/v1/transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ScopedPrismaInterceptor)
@Roles(Role.EMPLOYEE, Role.ADMIN)
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
  getTransaction(@CurrentUser() user: ValidatedUser, @Param('id') id: string) {
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
