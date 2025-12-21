import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class BookConsultationDto {
  @IsString()
  @IsUUID('4', { message: 'Invalid slot ID format' })
  slotId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
