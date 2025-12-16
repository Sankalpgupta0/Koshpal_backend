import { IsString, IsUUID } from 'class-validator';

export class BookConsultationDto {
  @IsString()
  @IsUUID()
  slotId: string;
}
