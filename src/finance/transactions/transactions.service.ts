import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateTransactionDto } from './dto/create-transaction.dto';
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
