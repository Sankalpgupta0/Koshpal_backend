import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ScopedPrismaService } from '../../common/services/scoped-prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ValidatedUser } from '../../common/types/user.types';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/* eslint-disable @typescript-eslint/require-await */

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: ScopedPrismaService) {}

  async create(user: ValidatedUser, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        ...dto,
        userId: user.userId,
        companyId: user.companyId,
      } as any,
    });
  }

  async findUserAccounts(_userId: string) {
    return this.prisma.account.findMany({
      where: {
        userId: _userId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async findOne(_userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: _userId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async remove(_userId: string, accountId: string) {
    // First check if account exists and belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: _userId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Prevent deletion if account has transactions
    if (account?._count?.transactions > 0) {
      throw new BadRequestException(
        `Cannot delete account with ${account._count.transactions} transaction(s). Delete transactions first.`,
      );
    }

    // Soft delete the account
    await this.prisma.account.update({
      where: { id: accountId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Account deleted successfully' };
  }
}
