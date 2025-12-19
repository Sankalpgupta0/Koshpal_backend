import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateTransactionDto {
  // accountId is OPTIONAL - backend will match/create account automatically
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsNumber()
  amount: number;

  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  subCategory?: string;

  @IsEnum(['MANUAL', 'MOBILE', 'BANK'])
  source: 'MANUAL' | 'MOBILE' | 'BANK';

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  transactionDate: string;

  // Additional metadata for account matching/creation
  @IsOptional()
  @IsString()
  merchant?: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  maskedAccountNo?: string; // Last 4 digits

  @IsOptional()
  @IsString()
  provider?: string; // Bank/wallet provider name
}
