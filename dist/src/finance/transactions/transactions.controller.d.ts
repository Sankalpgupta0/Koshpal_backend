import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { BulkCreateTransactionDto } from './dto/bulk-create-transaction.dto';
import type { ValidatedUser } from '../../common/types/user.types';
export declare class TransactionsController {
    private readonly service;
    constructor(service: TransactionsService);
    create(user: ValidatedUser, dto: CreateTransactionDto): Promise<any>;
    bulkCreate(user: ValidatedUser, dto: BulkCreateTransactionDto): Promise<{
        message: string;
        count: any;
        transactions: any;
        accountsLinked: any;
        accountsUnlinked: any;
    }>;
    getMyTransactions(user: ValidatedUser, accountId?: string, type?: string, category?: string): Promise<any>;
    getTransaction(user: ValidatedUser, id: string): Promise<any>;
    deleteTransaction(user: ValidatedUser, id: string): Promise<{
        message: string;
    }>;
}
