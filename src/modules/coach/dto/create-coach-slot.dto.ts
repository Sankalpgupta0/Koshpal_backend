import {
  IsString,
  IsArray,
  ValidateNested,
  IsDateString,
  Matches,
  IsNumber,
  Min,
  Max,
  IsObject,
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

// New DTO for weekly schedule
class WeeklyTimeSlot {
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start must be in HH:mm format',
  })
  start: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end must be in HH:mm format',
  })
  end: string;
}

export class SaveCoachSlotsDto {
  @IsNumber()
  @Min(15)
  @Max(180)
  slotDurationMinutes: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  weeksToGenerate: number;

  @IsObject()
  weeklySchedule: {
    MONDAY?: WeeklyTimeSlot[];
    TUESDAY?: WeeklyTimeSlot[];
    WEDNESDAY?: WeeklyTimeSlot[];
    THURSDAY?: WeeklyTimeSlot[];
    FRIDAY?: WeeklyTimeSlot[];
    SATURDAY?: WeeklyTimeSlot[];
    SUNDAY?: WeeklyTimeSlot[];
  };
}
