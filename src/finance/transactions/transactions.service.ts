import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BulkCreateTransactionDto } from './dto/bulk-create-transaction.dto';
import { ValidatedUser } from '../../common/types/user.types';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('insight-queue') private readonly queue: Queue,
  ) {}

  async create(user: ValidatedUser, dto: CreateTransactionDto) {
    // ensure account belongs to user
    const account = await this.prisma.account.findFirst({
      where: {
        id: dto.accountId,
        userId: user.userId,
      },
    });

    if (!account) {
      throw new ForbiddenException('Invalid account');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: user.userId,
        companyId: user.companyId,
        accountId: dto.accountId,
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        subCategory: dto.subCategory,
        source: dto.source,
        description: dto.description,
        transactionDate: new Date(dto.transactionDate),
      },
    });

    // async insight generation
    await this.queue.add('monthly-summary', {
      userId: user.userId,
      companyId: user.companyId,
      transactionDate: dto.transactionDate,
    });

    return transaction;
  }

  async bulkCreate(user: ValidatedUser, dto: BulkCreateTransactionDto) {
    const { transactions } = dto;

    // Validate all account IDs belong to user
    const accountIds = [...new Set(transactions.map((t) => t.accountId))];
    const userAccounts = await this.prisma.account.findMany({
      where: {
        id: { in: accountIds },
        userId: user.userId,
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
            userId: user.userId,
            companyId: user.companyId,
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
        userId: user.userId,
        companyId: user.companyId,
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
    userId: string,
    filters?: { accountId?: string; type?: string; category?: string },
  ) {
    const where: any = { userId };

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

  async findOne(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
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

  async remove(userId: string, transactionId: string) {
    // First check if transaction exists and belongs to user
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
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
