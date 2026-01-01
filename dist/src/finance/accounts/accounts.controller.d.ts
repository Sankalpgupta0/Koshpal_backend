import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import type { ValidatedUser } from '../../common/types/user.types';
export declare class AccountsController {
    private readonly service;
    constructor(service: AccountsService);
    create(user: ValidatedUser, dto: CreateAccountDto): Promise<any>;
    getMyAccounts(user: ValidatedUser): Promise<any>;
    getAccount(user: ValidatedUser, id: string): Promise<any>;
    deleteAccount(user: ValidatedUser, id: string): Promise<{
        message: string;
    }>;
}
