import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for deactivating a coach
 */
export class DeactivateCoachDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
