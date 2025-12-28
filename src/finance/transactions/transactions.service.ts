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
    // Validate amount
    if (dto.amount <= 0) {
      throw new BadRequestException(
        'Transaction amount must be greater than zero',
      );
    }
    if (dto.amount > 99999999) {
      throw new BadRequestException(
        'Transaction amount exceeds maximum allowed value',
      );
    }

    // Validate transaction date
    const transactionDate = new Date(dto.transactionDate);
    if (isNaN(transactionDate.getTime())) {
      throw new BadRequestException('Invalid transaction date');
    }
    if (transactionDate > new Date()) {
      throw new BadRequestException('Transaction date cannot be in the future');
    }
    if (transactionDate < new Date('2000-01-01')) {
      throw new BadRequestException('Transaction date is too far in the past');
    }

    // Check for duplicate transaction (idempotency)
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        userId: _user.userId,
        amount: dto.amount,
        transactionDate: transactionDate,
        merchant: dto.merchant,
        type: dto.type,
      },
    });

    if (existingTransaction) {
      throw new BadRequestException(
        'Duplicate transaction detected. This transaction already exists.',
      );
    }

    /**
     * SMART ACCOUNT MATCHING/CREATION LOGIC
     *
     * Why accountId is optional:
     * - Transactions from SMS/mobile arrive before accounts are manually created
     * - Transaction data is the source of truth, not account linkage
     * - Prevents data loss when employee has zero accounts
     *
     * Strategy:
     * 1. If accountId provided → validate and use it
     * 2. Else → try to find matching account by metadata (maskedAccountNo, bank, provider)
     * 3. If found → link transaction to account
     * 4. If not found → auto-create account OR create transaction without account
     * 5. NEVER reject transaction due to missing account
     */

    let accountId: string | null = null;

    // Case 1: accountId explicitly provided - validate it belongs to user
    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: {
          id: dto.accountId,
          userId: _user.userId, // Security: ensure account belongs to user
        },
      });

      if (!account) {
        throw new ForbiddenException(
          'Invalid account - does not belong to user',
        );
      }
      accountId = account.id;
    }
    // Case 2: No accountId provided - try to match existing account
    else if (dto.maskedAccountNo || dto.bank || dto.provider) {
      const matchedAccount = await this.prisma.account.findFirst({
        where: {
          userId: _user.userId,
          ...(dto.maskedAccountNo && { maskedAccountNo: dto.maskedAccountNo }),
          ...(dto.bank && { bank: dto.bank }),
          ...(dto.provider && { provider: dto.provider }),
        },
        orderBy: { createdAt: 'desc' }, // Use most recent if multiple matches
      });

      if (matchedAccount) {
        accountId = matchedAccount.id;
      } else {
        // Case 3: Auto-create account from transaction metadata
        // Only if we have enough info to create a meaningful account
        if (dto.maskedAccountNo || dto.provider || dto.bank) {
          try {
            const newAccount = await this.prisma.account.create({
              data: {
                userId: _user.userId,
                companyId: _user.companyId,
                type: dto.bank ? 'BANK' : dto.provider ? 'WALLET' : 'CASH',
                provider: dto.provider || dto.bank,
                maskedAccountNo: dto.maskedAccountNo,
                bank: dto.bank,
              },
            });
            accountId = newAccount.id;
          } catch (error) {
            // If account creation fails (e.g., unique constraint), continue without account
            // Transaction creation must not fail
            // Log error but don't expose to client
          }
        }
      }
    }
    // Case 4: No metadata at all - create transaction without account link
    // This is valid! Transaction data is preserved even without account.

    // Create transaction with optional account relation
    // Note: userId and companyId will be injected by scoped-prisma.service.ts
    const transactionData: any = {
      amount: dto.amount,
      type: dto.type,
      category: dto.category,
      subCategory: dto.subCategory,
      source: dto.source,
      description: dto.description,
      merchant: dto.merchant,
      bank: dto.bank,
      maskedAccountNo: dto.maskedAccountNo,
      transactionDate: transactionDate,
    };

    // If accountId exists, connect the account relation
    if (accountId) {
      transactionData.account = { connect: { id: accountId } };
    }

    const transaction = await this.prisma.transaction.create({
      data: transactionData,
    });

    // Async insight generation (works with or without accountId)
    await this.queue.add('monthly-summary', {
      userId: _user.userId,
      companyId: _user.companyId,
      transactionDate: dto.transactionDate,
    });

    return transaction;
  }

  async bulkCreate(_user: ValidatedUser, dto: BulkCreateTransactionDto) {
    const { transactions } = dto;

    /**
     * BULK CREATE WITH OPTIONAL ACCOUNTS
     *
     * Handle mixed scenarios:
     * - Some transactions may have accountId
     * - Some may have metadata for matching
     * - Some may have neither (still valid!)
     *
     * Strategy: Process each transaction independently
     */

    // Validate provided account IDs (if any) belong to user
    const providedAccountIds = transactions
      .filter((t) => t.accountId)
      .map((t) => t.accountId as string);

    if (providedAccountIds.length > 0) {
      const uniqueAccountIds = [...new Set(providedAccountIds)];
      const userAccounts = await this.prisma.account.findMany({
        where: {
          id: { in: uniqueAccountIds },
          userId: _user.userId,
        },
        select: { id: true },
      });

      const validAccountIds = new Set(userAccounts.map((a) => a.id));
      const invalidAccountIds = uniqueAccountIds.filter(
        (id) => !validAccountIds.has(id),
      );

      if (invalidAccountIds.length > 0) {
        throw new BadRequestException(
          `Invalid account IDs: ${invalidAccountIds.join(', ')}. All accounts must belong to the authenticated user.`,
        );
      }
    }

    // Get all existing accounts for matching
    const userAccounts = await this.prisma.account.findMany({
      where: { userId: _user.userId },
    });

    // Process transactions with smart account matching
    const transactionsToCreate = await Promise.all(
      transactions.map(async (txn) => {
        let accountId: string | null = null;

        // Use provided accountId if valid
        if (txn.accountId) {
          accountId = txn.accountId;
        }
        // Try to match existing account by metadata
        else if (txn.maskedAccountNo || txn.bank || txn.provider) {
          const matchedAccount = userAccounts.find((acc) => {
            const matchMasked =
              !txn.maskedAccountNo ||
              acc.maskedAccountNo === txn.maskedAccountNo;
            const matchBank = !txn.bank || acc.bank === txn.bank;
            const matchProvider =
              !txn.provider || acc.provider === txn.provider;
            return matchMasked && matchBank && matchProvider;
          });

          accountId = matchedAccount?.id || null;
        }

        const txnData: any = {
          // Note: userId and companyId will be injected by scoped-prisma.service.ts
          amount: txn.amount,
          type: txn.type,
          category: txn.category,
          subCategory: txn.subCategory,
          source: txn.source,
          description: txn.description,
          merchant: txn.merchant,
          bank: txn.bank,
          maskedAccountNo: txn.maskedAccountNo,
          transactionDate: new Date(txn.transactionDate),
        };

        // If accountId exists, connect the account relation
        if (accountId) {
          txnData.account = { connect: { id: accountId } };
        }

        return txnData;
      }),
    );

    // Bulk create all transactions
    const createdTransactions = await this.prisma.$transaction(
      transactionsToCreate.map((data) =>
        this.prisma.transaction.create({ data }),
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
      accountsLinked: createdTransactions.filter((t) => t.accountId).length,
      accountsUnlinked: createdTransactions.filter((t) => !t.accountId).length,
    };
  }

  async findUserTransactions(
    _userId: string,
    filters?: {
      accountId?: string;
      type?: string;
      category?: string;
      limit?: number;
      skip?: number;
    },
  ) {
    const where: any = {
      userId: _userId,
      deletedAt: null,
    };

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
      take: filters?.limit || 100, // Default limit to prevent unbounded queries
      skip: filters?.skip || 0,
    });
  }

  async findOne(_userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: _userId,
        deletedAt: null,
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
        userId: _userId,
        deletedAt: null,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Soft delete the transaction
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { deletedAt: new Date() },
    });

    // Queue insight recalculation for the affected month
    await this.queue.add('monthly-summary', {
      userId: _userId,
      companyId: transaction.companyId,
      transactionDate: transaction.transactionDate.toISOString(),
    });

    return { message: 'Transaction deleted successfully' };
  }
}
