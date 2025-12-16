import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  goalName: string;

  @IsString()
  icon: string;

  @IsNumber()
  goalAmount: number;

  @IsOptional()
  @IsNumber()
  saving?: number;

  @IsDateString()
  goalDate: string;
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  goalName?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  goalAmount?: number;

  @IsOptional()
  @IsNumber()
  saving?: number;

  @IsOptional()
  @IsDateString()
  goalDate?: string;
}
