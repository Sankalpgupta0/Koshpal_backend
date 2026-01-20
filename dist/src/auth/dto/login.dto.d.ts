import { Role } from '../../common/enums/role.enum';
export declare class LoginDto {
    email: string;
    password: string;
    role?: Role;
}
