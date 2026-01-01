export declare class CreateAccountDto {
    type: 'BANK' | 'CASH' | 'WALLET' | 'CREDIT_CARD';
    provider?: string;
    bank?: string;
    maskedAccountNo?: string;
}
