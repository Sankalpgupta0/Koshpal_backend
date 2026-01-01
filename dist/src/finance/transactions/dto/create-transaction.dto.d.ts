export declare class CreateTransactionDto {
    accountId?: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    subCategory?: string;
    source: 'MANUAL' | 'MOBILE' | 'BANK';
    description?: string;
    transactionDate: string;
    merchant?: string;
    bank?: string;
    maskedAccountNo?: string;
    provider?: string;
}
