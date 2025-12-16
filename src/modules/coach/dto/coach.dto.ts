import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ConsultationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export class UpdateConsultationStatusDto {
  @IsEnum(ConsultationStatus)
  status: ConsultationStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
