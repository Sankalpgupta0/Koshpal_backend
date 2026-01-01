import { ScopedPrismaService } from '../../common/services/scoped-prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ValidatedUser } from '../../common/types/user.types';
export declare class AccountsService {
    private readonly prisma;
    constructor(prisma: ScopedPrismaService);
    create(user: ValidatedUser, dto: CreateAccountDto): Promise<any>;
    findUserAccounts(_userId: string): Promise<any>;
    findOne(_userId: string, accountId: string): Promise<any>;
    remove(_userId: string, accountId: string): Promise<{
        message: string;
    }>;
}
