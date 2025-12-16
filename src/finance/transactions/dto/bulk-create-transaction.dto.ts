import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateTransactionDto } from './create-transaction.dto';

export class BulkCreateTransactionDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one transaction is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionDto)
  transactions: CreateTransactionDto[];
}
