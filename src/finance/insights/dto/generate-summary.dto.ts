import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateSummaryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;
}
