import {
  IsString,
  IsArray,
  ValidateNested,
  IsDateString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class TimeSlot {
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;
}

export class CreateCoachSlotDto {
  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  timeSlots: TimeSlot[];
}
