import { ScopedPrismaService } from '../../common/services/scoped-prisma.service';
import { Queue } from 'bullmq';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BulkCreateTransactionDto } from './dto/bulk-create-transaction.dto';
import { ValidatedUser } from '../../common/types/user.types';
export declare class TransactionsService {
    private readonly prisma;
    private readonly queue;
    constructor(prisma: ScopedPrismaService, queue: Queue);
    create(_user: ValidatedUser, dto: CreateTransactionDto): Promise<any>;
    bulkCreate(_user: ValidatedUser, dto: BulkCreateTransactionDto): Promise<{
        message: string;
        count: any;
        transactions: any;
        accountsLinked: any;
        accountsUnlinked: any;
    }>;
    findUserTransactions(_userId: string, filters?: {
        accountId?: string;
        type?: string;
        category?: string;
        limit?: number;
        skip?: number;
    }): Promise<any>;
    findOne(_userId: string, transactionId: string): Promise<any>;
    remove(_userId: string, transactionId: string): Promise<{
        message: string;
    }>;
}
