import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsEnum(['BANK', 'CASH', 'WALLET', 'CREDIT_CARD'])
  type: 'BANK' | 'CASH' | 'WALLET' | 'CREDIT_CARD';

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  maskedAccountNo?: string;
}
