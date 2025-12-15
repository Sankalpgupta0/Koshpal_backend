import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  accountId: string;

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
}
