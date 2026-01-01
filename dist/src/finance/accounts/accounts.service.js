"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const scoped_prisma_service_1 = require("../../common/services/scoped-prisma.service");
let AccountsService = class AccountsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(user, dto) {
        return this.prisma.account.create({
            data: {
                ...dto,
                userId: user.userId,
                companyId: user.companyId,
            },
        });
    }
    async findUserAccounts(_userId) {
        return this.prisma.account.findMany({
            where: {
                userId: _userId,
                deletedAt: null,
            },
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
        });
    }
    async findOne(_userId, accountId) {
        const account = await this.prisma.account.findFirst({
            where: {
                id: accountId,
                userId: _userId,
                deletedAt: null,
            },
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        return account;
    }
    async remove(_userId, accountId) {
        const account = await this.prisma.account.findFirst({
            where: {
                id: accountId,
                userId: _userId,
                deletedAt: null,
            },
            include: {
                _count: {
                    select: { transactions: true },
                },
            },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (account?._count?.transactions > 0) {
            throw new common_1.BadRequestException(`Cannot delete account with ${account._count.transactions} transaction(s). Delete transactions first.`);
        }
        await this.prisma.account.update({
            where: { id: accountId },
            data: { deletedAt: new Date() },
        });
        return { message: 'Account deleted successfully' };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scoped_prisma_service_1.ScopedPrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map