import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ValidatedUser } from '../../common/types/user.types';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: ValidatedUser, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        userId: user.userId,
        companyId: user.companyId,
        ...dto,
      },
    });
  }

  async findUserAccounts(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async findOne(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
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

  async remove(userId: string, accountId: string) {
    // First check if account exists and belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
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
    if (account._count.transactions > 0) {
      throw new BadRequestException(
        `Cannot delete account with ${account._count.transactions} transaction(s). Delete transactions first.`,
      );
    }

    await this.prisma.account.delete({
      where: { id: accountId },
    });

    return { message: 'Account deleted successfully' };
  }
}
