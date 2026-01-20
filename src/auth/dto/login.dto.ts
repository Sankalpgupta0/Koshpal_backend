import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
