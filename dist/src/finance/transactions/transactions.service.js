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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const scoped_prisma_service_1 = require("../../common/services/scoped-prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let TransactionsService = class TransactionsService {
    prisma;
    queue;
    constructor(prisma, queue) {
        this.prisma = prisma;
        this.queue = queue;
    }
    async create(_user, dto) {
        if (dto.amount <= 0) {
            throw new common_1.BadRequestException('Transaction amount must be greater than zero');
        }
        if (dto.amount > 99999999) {
            throw new common_1.BadRequestException('Transaction amount exceeds maximum allowed value');
        }
        const transactionDate = new Date(dto.transactionDate);
        if (isNaN(transactionDate.getTime())) {
            throw new common_1.BadRequestException('Invalid transaction date');
        }
        if (transactionDate > new Date()) {
            throw new common_1.BadRequestException('Transaction date cannot be in the future');
        }
        if (transactionDate < new Date('2000-01-01')) {
            throw new common_1.BadRequestException('Transaction date is too far in the past');
        }
        const existingTransaction = await this.prisma.transaction.findFirst({
            where: {
                userId: _user.userId,
                amount: dto.amount,
                transactionDate: transactionDate,
                merchant: dto.merchant,
                type: dto.type,
            },
        });
        if (existingTransaction) {
            throw new common_1.BadRequestException('Duplicate transaction detected. This transaction already exists.');
        }
        let accountId = null;
        if (dto.accountId) {
            const account = await this.prisma.account.findFirst({
                where: {
                    id: dto.accountId,
                    userId: _user.userId,
                },
            });
            if (!account) {
                throw new common_1.ForbiddenException('Invalid account - does not belong to user');
            }
            accountId = account.id;
        }
        else if (dto.maskedAccountNo || dto.bank || dto.provider) {
            const matchedAccount = await this.prisma.account.findFirst({
                where: {
                    userId: _user.userId,
                    ...(dto.maskedAccountNo && { maskedAccountNo: dto.maskedAccountNo }),
                    ...(dto.bank && { bank: dto.bank }),
                    ...(dto.provider && { provider: dto.provider }),
                },
                orderBy: { createdAt: 'desc' },
            });
            if (matchedAccount) {
                accountId = matchedAccount.id;
            }
            else {
                if (dto.maskedAccountNo || dto.provider || dto.bank) {
                    try {
                        const newAccount = await this.prisma.account.create({
                            data: {
                                userId: _user.userId,
                                companyId: _user.companyId,
                                type: dto.bank ? 'BANK' : dto.provider ? 'WALLET' : 'CASH',
                                provider: dto.provider || dto.bank,
                                maskedAccountNo: dto.maskedAccountNo,
                                bank: dto.bank,
                            },
                        });
                        accountId = newAccount.id;
                    }
                    catch (error) {
                    }
                }
            }
        }
        const transactionData = {
            amount: dto.amount,
            type: dto.type,
            category: dto.category,
            subCategory: dto.subCategory,
            source: dto.source,
            description: dto.description,
            merchant: dto.merchant,
            bank: dto.bank,
            maskedAccountNo: dto.maskedAccountNo,
            transactionDate: transactionDate,
        };
        if (accountId) {
            transactionData.account = { connect: { id: accountId } };
        }
        const transaction = await this.prisma.transaction.create({
            data: transactionData,
        });
        await this.queue.add('monthly-summary', {
            userId: _user.userId,
            companyId: _user.companyId,
            transactionDate: dto.transactionDate,
        });
        return transaction;
    }
    async bulkCreate(_user, dto) {
        const { transactions } = dto;
        const providedAccountIds = transactions
            .filter((t) => t.accountId)
            .map((t) => t.accountId);
        if (providedAccountIds.length > 0) {
            const uniqueAccountIds = [...new Set(providedAccountIds)];
            const userAccounts = await this.prisma.account.findMany({
                where: {
                    id: { in: uniqueAccountIds },
                    userId: _user.userId,
                },
                select: { id: true },
            });
            const validAccountIds = new Set(userAccounts.map((a) => a.id));
            const invalidAccountIds = uniqueAccountIds.filter((id) => !validAccountIds.has(id));
            if (invalidAccountIds.length > 0) {
                throw new common_1.BadRequestException(`Invalid account IDs: ${invalidAccountIds.join(', ')}. All accounts must belong to the authenticated user.`);
            }
        }
        const userAccounts = await this.prisma.account.findMany({
            where: { userId: _user.userId },
        });
        const transactionsToCreate = await Promise.all(transactions.map(async (txn) => {
            let accountId = null;
            if (txn.accountId) {
                accountId = txn.accountId;
            }
            else if (txn.maskedAccountNo || txn.bank || txn.provider) {
                const matchedAccount = userAccounts.find((acc) => {
                    const matchMasked = !txn.maskedAccountNo ||
                        acc.maskedAccountNo === txn.maskedAccountNo;
                    const matchBank = !txn.bank || acc.bank === txn.bank;
                    const matchProvider = !txn.provider || acc.provider === txn.provider;
                    return matchMasked && matchBank && matchProvider;
                });
                accountId = matchedAccount?.id || null;
            }
            const txnData = {
                amount: txn.amount,
                type: txn.type,
                category: txn.category,
                subCategory: txn.subCategory,
                source: txn.source,
                description: txn.description,
                merchant: txn.merchant,
                bank: txn.bank,
                maskedAccountNo: txn.maskedAccountNo,
                transactionDate: new Date(txn.transactionDate),
            };
            if (accountId) {
                txnData.account = { connect: { id: accountId } };
            }
            return txnData;
        }));
        const createdTransactions = await this.prisma.$transaction(transactionsToCreate.map((data) => this.prisma.transaction.create({ data })));
        const uniquePeriods = new Set(transactions.map((t) => {
            const date = new Date(t.transactionDate);
            return `${date.getFullYear()}-${date.getMonth() + 1}`;
        }));
        for (const period of uniquePeriods) {
            const [year, month] = period.split('-');
            await this.queue.add('monthly-summary', {
                userId: _user.userId,
                companyId: _user.companyId,
                transactionDate: new Date(parseInt(year), parseInt(month) - 1, 1).toISOString(),
            });
        }
        return {
            message: `Successfully created ${createdTransactions.length} transactions`,
            count: createdTransactions.length,
            transactions: createdTransactions,
            accountsLinked: createdTransactions.filter((t) => t.accountId).length,
            accountsUnlinked: createdTransactions.filter((t) => !t.accountId).length,
        };
    }
    async findUserTransactions(_userId, filters) {
        const where = {
            userId: _userId,
            deletedAt: null,
        };
        if (filters?.accountId) {
            where.accountId = filters.accountId;
        }
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.category) {
            where.category = { contains: filters.category, mode: 'insensitive' };
        }
        return this.prisma.transaction.findMany({
            where,
            include: {
                account: {
                    select: {
                        type: true,
                        provider: true,
                        maskedAccountNo: true,
                    },
                },
            },
            orderBy: { transactionDate: 'desc' },
            take: filters?.limit || 100,
            skip: filters?.skip || 0,
        });
    }
    async findOne(_userId, transactionId) {
        const transaction = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId: _userId,
                deletedAt: null,
            },
            include: {
                account: {
                    select: {
                        type: true,
                        provider: true,
                        maskedAccountNo: true,
                    },
                },
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        return transaction;
    }
    async remove(_userId, transactionId) {
        const transaction = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId: _userId,
                deletedAt: null,
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { deletedAt: new Date() },
        });
        await this.queue.add('monthly-summary', {
            userId: _userId,
            companyId: transaction.companyId,
            transactionDate: transaction.transactionDate.toISOString(),
        });
        return { message: 'Transaction deleted successfully' };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('insight-queue')),
    __metadata("design:paramtypes", [scoped_prisma_service_1.ScopedPrismaService,
        bullmq_2.Queue])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map