import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class UpdateBudgetDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2000)
  year: number;

  @IsNumber()
  @Min(0)
  budget: number;
}
