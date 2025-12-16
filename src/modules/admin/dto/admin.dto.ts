import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsEnum,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  employeeLimit?: number;
}

export class UpdateCompanyStatusDto {
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status: 'ACTIVE' | 'INACTIVE';
}

export class UpdateCompanyLimitsDto {
  @IsNumber()
  employeeLimit: number;
}

export class CreateHrDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  companyId: string;
}

export class UpdateHrStatusDto {
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status: 'ACTIVE' | 'INACTIVE';
}
