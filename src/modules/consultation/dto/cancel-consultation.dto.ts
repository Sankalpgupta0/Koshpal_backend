import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CancelConsultationDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Cancellation reason must not exceed 500 characters' })
  reason?: string;
}
