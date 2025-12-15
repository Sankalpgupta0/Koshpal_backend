import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { ValidatedUser } from '../../common/types/user.types';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Post()
  create(@CurrentUser() user: ValidatedUser, @Body() dto: CreateAccountDto) {
    return this.service.create(user, dto);
  }

  @Get()
  getMyAccounts(@CurrentUser() user: ValidatedUser) {
    return this.service.findUserAccounts(user.userId);
  }

  @Get(':id')
  getAccount(@CurrentUser() user: ValidatedUser, @Param('id') id: string) {
    return this.service.findOne(user.userId, id);
  }

  @Delete(':id')
  deleteAccount(@CurrentUser() user: ValidatedUser, @Param('id') id: string) {
    return this.service.remove(user.userId, id);
  }
}
