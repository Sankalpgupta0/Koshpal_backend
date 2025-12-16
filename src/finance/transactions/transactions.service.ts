import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ScopedPrismaService } from '../../common/services/scoped-prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BulkCreateTransactionDto } from './dto/bulk-create-transaction.dto';
import { ValidatedUser } from '../../common/types/user.types';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: ScopedPrismaService,
    @InjectQueue('insight-queue') private readonly queue: Queue,
  ) {}

  async create(_user: ValidatedUser, dto: CreateTransactionDto) {
    // ensure account belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: dto.accountId,
      },
    });

    if (!account) {
      throw new ForbiddenException('Invalid account');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        accountId: dto.accountId,
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        subCategory: dto.subCategory,
        source: dto.source,
        description: dto.description,
        transactionDate: new Date(dto.transactionDate),
      } as any,
    });

    // async insight generation
    await this.queue.add('monthly-summary', {
      userId: _user.userId,
      companyId: _user.companyId,
      transactionDate: dto.transactionDate,
    });

    return transaction;
  }

  async bulkCreate(_user: ValidatedUser, dto: BulkCreateTransactionDto) {
    const { transactions } = dto;

    // Validate all account IDs belong to user
    const accountIds = [...new Set(transactions.map((t) => t.accountId))];
    const userAccounts = await this.prisma.account.findMany({
      where: {
        id: { in: accountIds },
      },
      select: { id: true },
    });

    const validAccountIds = new Set(userAccounts.map((a) => a.id));
    const invalidAccountIds = accountIds.filter(
      (id) => !validAccountIds.has(id),
    );

    if (invalidAccountIds.length > 0) {
      throw new BadRequestException(
        `Invalid account IDs: ${invalidAccountIds.join(', ')}. All accounts must belong to the authenticated user.`,
      );
    }

    // Bulk create transactions
    const createdTransactions = await this.prisma.$transaction(
      transactions.map((txn) =>
        this.prisma.transaction.create({
          data: {
            userId: _user.userId,
            companyId: _user.companyId,
            accountId: txn.accountId,
            amount: txn.amount,
            type: txn.type,
            category: txn.category,
            subCategory: txn.subCategory,
            source: txn.source,
            description: txn.description,
            transactionDate: new Date(txn.transactionDate),
          },
        }),
      ),
    );

    // Trigger insight generation for unique month-year combinations
    const uniquePeriods = new Set(
      transactions.map((t) => {
        const date = new Date(t.transactionDate);
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      }),
    );

    for (const period of uniquePeriods) {
      const [year, month] = period.split('-');
      await this.queue.add('monthly-summary', {
        userId: _user.userId,
        companyId: _user.companyId,
        transactionDate: new Date(
          parseInt(year),
          parseInt(month) - 1,
          1,
        ).toISOString(),
      });
    }

    return {
      message: `Successfully created ${createdTransactions.length} transactions`,
      count: createdTransactions.length,
      transactions: createdTransactions,
    };
  }

  async findUserTransactions(
    _userId: string,
    filters?: { accountId?: string; type?: string; category?: string },
  ) {
    const where: any = {};

    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            type: true,
            provider: true,
            maskedAccountNo: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async findOne(_userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
      },
      include: {
        account: {
          select: {
            type: true,
            provider: true,
            maskedAccountNo: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async remove(_userId: string, transactionId: string) {
    // First check if transaction exists and belongs to user
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.delete({
      where: { id: transactionId },
    });

    return { message: 'Transaction deleted successfully' };
  }
}
