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
exports.HrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const bullmq_1 = require("bullmq");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
let HrService = class HrService {
    prisma;
    configService;
    uploadQueue;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.uploadQueue = new bullmq_1.Queue('employee-upload', {
            connection: {
                host: this.configService.get('REDIS_HOST', 'localhost'),
                port: this.configService.get('REDIS_PORT', 6379),
            },
        });
    }
    async handleUpload(file, user) {
        console.log(`[HR-SERVICE] 📤 New upload request from HR user: ${user.userId}`);
        console.log(`[HR-SERVICE] Company: ${user.companyId}`);
        if (!file) {
            console.warn(`[HR-SERVICE] ❌ Upload rejected: No file provided`);
            throw new common_1.BadRequestException('File is required');
        }
        console.log(`[HR-SERVICE] File: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
        if (!file.originalname.toLowerCase().endsWith('.csv')) {
            console.warn(`[HR-SERVICE] ❌ Upload rejected: Invalid file type - ${file.originalname}`);
            throw new common_1.BadRequestException('Only CSV files are allowed. Please convert your file to CSV format.');
        }
        if (file.size > 5 * 1024 * 1024) {
            console.warn(`[HR-SERVICE] ❌ Upload rejected: File too large (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
            throw new common_1.BadRequestException('File size must be under 5MB');
        }
        console.log(`[HR-SERVICE] 🔍 Checking for active uploads...`);
        const activeBatch = await this.prisma.employeeUploadBatch.findFirst({
            where: {
                companyId: user.companyId,
                status: {
                    in: [client_1.UploadStatus.PENDING, client_1.UploadStatus.PROCESSING],
                },
            },
        });
        if (activeBatch) {
            console.warn(`[HR-SERVICE] ❌ Upload rejected: Active batch found (${activeBatch.id})`);
            throw new common_1.BadRequestException('Another employee upload is already in progress');
        }
        console.log(`[HR-SERVICE] 💾 Creating upload batch record...`);
        const batch = await this.prisma.employeeUploadBatch.create({
            data: {
                hrUserId: user.userId,
                companyId: user.companyId,
                fileName: file.originalname,
                status: client_1.UploadStatus.PENDING,
            },
        });
        console.log(`[HR-SERVICE] ✓ Batch created: ${batch.id}`);
        console.log(`[HR-SERVICE] 📮 Adding job to queue...`);
        const job = await this.uploadQueue.add('employee-upload', {
            batchId: batch.id,
            companyId: user.companyId,
            fileBase64: file.buffer.toString('base64'),
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 3000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
        console.log(`[HR-SERVICE] ✅ Job queued successfully: ${job.id}`);
        console.log(`[HR-SERVICE] BatchId: ${batch.id} | JobId: ${job.id}\n`);
        return {
            message: 'Upload started. Processing in background.',
            batchId: batch.id,
        };
    }
    async getBatchStatus(batchId) {
        console.log(`[HR-SERVICE] 📋 Getting batch status for ${batchId}`);
        const batch = await this.prisma.employeeUploadBatch.findUnique({
            where: { id: batchId },
        });
        if (!batch) {
            throw new common_1.BadRequestException('Batch not found');
        }
        return {
            id: batch.id,
            status: batch.status,
            fileName: batch.fileName,
            totalRecords: batch.totalRecords,
            successRecords: batch.successRecords,
            failedRecords: batch.failedRecords,
            createdAt: batch.createdAt,
            updatedAt: batch.updatedAt,
        };
    }
    async getBatchesForCompany(companyId) {
        console.log(`[HR-SERVICE] 📋 Getting batches for company ${companyId}`);
        const batches = await this.prisma.employeeUploadBatch.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return batches.map((batch) => ({
            id: batch.id,
            status: batch.status,
            fileName: batch.fileName,
            totalRecords: batch.totalRecords,
            successRecords: batch.successRecords,
            failedRecords: batch.failedRecords,
            createdAt: batch.createdAt,
            updatedAt: batch.updatedAt,
        }));
    }
    async getEmployees(companyId) {
        const employees = await this.prisma.user.findMany({
            where: {
                companyId,
                role: 'EMPLOYEE',
            },
            include: {
                employeeProfile: {
                    select: {
                        fullName: true,
                        department: true,
                        phone: true,
                        dateOfJoining: true,
                    },
                },
                monthlySummaries: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        totalIncome: true,
                        totalExpense: true,
                        savings: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const employeeIds = employees.map((emp) => emp.id);
        const bookingCounts = await this.prisma.consultationBooking.groupBy({
            by: ['employeeId'],
            where: {
                employeeId: { in: employeeIds },
                status: 'CONFIRMED',
            },
            _count: true,
        });
        const bookingMap = new Map(bookingCounts.map((b) => [b.employeeId, b._count]));
        return employees.map((emp) => {
            const hasFinancialData = emp.monthlySummaries.length > 0;
            const sessionsAttended = bookingMap.get(emp.id) || 0;
            let status = 'Invited';
            if (hasFinancialData) {
                status = 'Onboarded';
            }
            let engagement = 'Inactive';
            if (hasFinancialData && emp.isActive) {
                const lastActivity = emp.monthlySummaries[0]?.createdAt;
                if (lastActivity) {
                    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSinceActivity < 60) {
                        engagement = 'Active';
                    }
                }
            }
            let lastActivity = 'Never';
            if (emp.monthlySummaries.length > 0) {
                const lastDate = emp.monthlySummaries[0].createdAt;
                const daysAgo = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysAgo < 1) {
                    lastActivity = 'Today';
                }
                else if (daysAgo < 30) {
                    lastActivity = `${daysAgo}d ago`;
                }
                else if (daysAgo < 60) {
                    lastActivity = `${Math.floor(daysAgo / 30)}mo ago`;
                }
                else {
                    lastActivity = `${Math.floor(daysAgo / 30)}mo ago`;
                }
            }
            return {
                id: emp.id,
                name: emp.employeeProfile?.fullName || emp.email,
                email: emp.email,
                department: emp.employeeProfile?.department || 'Unknown',
                role: 'Financial Analyst',
                status,
                engagement,
                lastActivity,
                sessionsAttended,
                isActive: emp.isActive,
                phone: emp.employeeProfile?.phone,
                dateOfJoining: emp.employeeProfile?.dateOfJoining,
            };
        });
    }
    async getDepartments(companyId) {
        const employeeProfiles = await this.prisma.employeeProfile.findMany({
            where: {
                companyId,
            },
            select: {
                department: true,
            },
            distinct: ['department'],
        });
        const departments = employeeProfiles
            .map((profile) => profile.department)
            .filter((dept) => dept !== null && dept !== undefined)
            .sort();
        return departments;
    }
    async getEmployee(id, companyId) {
        const employee = await this.prisma.user.findFirst({
            where: {
                id,
                companyId,
                role: 'EMPLOYEE',
            },
            select: {
                id: true,
                email: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!employee) {
            throw new common_1.BadRequestException('Employee not found');
        }
        return employee;
    }
    async updateEmployeeStatus(id, companyId, status) {
        const employee = await this.prisma.user.findFirst({
            where: {
                id,
                companyId,
                role: 'EMPLOYEE',
            },
        });
        if (!employee) {
            throw new common_1.BadRequestException('Employee not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: { isActive: status },
            select: {
                id: true,
                email: true,
                isActive: true,
                updatedAt: true,
            },
        });
    }
    async getCompanyInsightsSummary(companyId) {
        const summaries = await this.prisma.monthlySummary.findMany({
            where: {
                user: {
                    companyId,
                    role: 'EMPLOYEE',
                },
            },
            select: {
                month: true,
                year: true,
                totalIncome: true,
                totalExpense: true,
                savings: true,
            },
        });
        if (summaries.length === 0) {
            return {
                totalEmployees: 0,
                aggregatedIncome: 0,
                aggregatedExpense: 0,
                aggregatedSavings: 0,
                monthlySummaries: [],
            };
        }
        const employeeCount = await this.prisma.user.count({
            where: {
                companyId,
                role: 'EMPLOYEE',
                transactions: {
                    some: {},
                },
            },
        });
        const monthlyAggregates = summaries.reduce((acc, summary) => {
            const key = `${summary.year}-${summary.month}`;
            if (!acc[key]) {
                acc[key] = {
                    month: summary.month,
                    year: summary.year,
                    totalIncome: 0,
                    totalExpense: 0,
                    netSavings: 0,
                };
            }
            acc[key].totalIncome += Number(summary.totalIncome);
            acc[key].totalExpense += Number(summary.totalExpense);
            acc[key].netSavings += Number(summary.savings);
            return acc;
        }, {});
        const monthlySummaries = Object.values(monthlyAggregates).sort((a, b) => {
            if (a.year !== b.year)
                return b.year - a.year;
            return b.month - a.month;
        });
        const totals = monthlySummaries.reduce((acc, month) => ({
            totalIncome: acc.totalIncome + month.totalIncome,
            totalExpense: acc.totalExpense + month.totalExpense,
            totalSavings: acc.totalSavings + month.netSavings,
        }), { totalIncome: 0, totalExpense: 0, totalSavings: 0 });
        return {
            totalEmployees: employeeCount,
            aggregatedIncome: totals.totalIncome,
            aggregatedExpense: totals.totalExpense,
            aggregatedSavings: totals.totalSavings,
            monthlySummaries: monthlySummaries.slice(0, 12),
        };
    }
    async getDashboardStats(companyId) {
        const totalEmployees = await this.prisma.user.count({
            where: {
                companyId,
                role: 'EMPLOYEE',
                isActive: true,
            },
        });
        const monitoredEmployees = await this.prisma.user.count({
            where: {
                companyId,
                role: 'EMPLOYEE',
                isActive: true,
                employeeProfile: {
                    accounts: {
                        some: {},
                    },
                },
            },
        });
        const employeesWithTransactions = await this.prisma.user.findMany({
            where: {
                companyId,
                role: 'EMPLOYEE',
                isActive: true,
            },
            include: {
                monthlySummaries: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        let totalHealthScore = 0;
        let employeesWithHealth = 0;
        employeesWithTransactions.forEach((emp) => {
            if (emp.monthlySummaries.length > 0) {
                const summary = emp.monthlySummaries[0];
                const income = Number(summary.totalIncome);
                const expense = Number(summary.totalExpense);
                const savings = Number(summary.savings);
                let healthScore = 50;
                if (income > 0) {
                    const savingsRate = (savings / income) * 100;
                    const expenseRatio = (expense / income) * 100;
                    healthScore = Math.min(100, Math.max(0, savingsRate * 0.7 + (100 - expenseRatio) * 0.3));
                }
                totalHealthScore += healthScore;
                employeesWithHealth++;
            }
        });
        const avgFinancialHealth = employeesWithHealth > 0
            ? Math.round(totalHealthScore / employeesWithHealth)
            : 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sessionsThisPeriod = await this.prisma.consultationBooking.count({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
        });
        const participationRate = totalEmployees > 0
            ? Math.round((monitoredEmployees / totalEmployees) * 100)
            : 0;
        return {
            employeeMonitored: monitoredEmployees,
            employeeMonitoredChange: '+12%',
            avgFinancialHealth,
            avgFinancialHealthPeriod: 'This Month',
            participationRate,
            participationRateChange: '-5%',
            sessionsThisPeriod,
            sessionsRate: `${Math.round((sessionsThisPeriod / (totalEmployees || 1)) * 100)}%`,
        };
    }
    async getFinancialHealthDistribution(companyId) {
        const employees = await this.prisma.user.findMany({
            where: {
                companyId,
                role: 'EMPLOYEE',
                isActive: true,
            },
            include: {
                monthlySummaries: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        let low = 0;
        let medium = 0;
        let high = 0;
        employees.forEach((emp) => {
            if (emp.monthlySummaries.length > 0) {
                const summary = emp.monthlySummaries[0];
                const income = Number(summary.totalIncome);
                const expense = Number(summary.totalExpense);
                const savings = Number(summary.savings);
                let healthScore = 50;
                if (income > 0) {
                    const savingsRate = (savings / income) * 100;
                    const expenseRatio = (expense / income) * 100;
                    healthScore = Math.min(100, Math.max(0, savingsRate * 0.7 + (100 - expenseRatio) * 0.3));
                }
                if (healthScore < 40) {
                    low++;
                }
                else if (healthScore < 70) {
                    medium++;
                }
                else {
                    high++;
                }
            }
        });
        return {
            distribution: [
                { category: 'Low (0-39)', value: low, range: '0-39' },
                { category: 'Medium (40-69)', value: medium, range: '40-69' },
                { category: 'High (70-100)', value: high, range: '70-100' },
            ],
            total: low + medium + high,
        };
    }
    async getParticipationByDepartment(companyId) {
        const allEmployees = await this.prisma.user.findMany({
            where: {
                companyId,
                role: 'EMPLOYEE',
                isActive: true,
            },
            include: {
                employeeProfile: {
                    include: {
                        accounts: true,
                    },
                },
            },
        });
        const deptMap = new Map();
        allEmployees.forEach((emp) => {
            const dept = emp.employeeProfile?.department || 'Unknown';
            if (!deptMap.has(dept)) {
                deptMap.set(dept, { total: 0, participating: 0 });
            }
            const data = deptMap.get(dept);
            data.total++;
            if (emp.employeeProfile?.accounts &&
                emp.employeeProfile.accounts.length > 0) {
                data.participating++;
            }
        });
        const departments = Array.from(deptMap.entries()).map(([dept, data]) => {
            const rate = data.total > 0 ? (data.participating / data.total) * 100 : 0;
            return {
                department: dept,
                total: data.total,
                participating: data.participating,
                participationRate: Math.round(rate),
            };
        });
        return departments.sort((a, b) => b.participationRate - a.participationRate);
    }
    async getDashboardAlerts(companyId) {
        const alerts = [];
        const deptParticipation = await this.getParticipationByDepartment(companyId);
        deptParticipation.forEach((dept) => {
            if (dept.participationRate < 30 && dept.total > 5) {
                alerts.push({
                    type: 'warning',
                    title: `Low participation in ${dept.department} dept`,
                    message: `Only ${dept.participationRate}% participated in last 30 days`,
                    severity: 'medium',
                });
            }
        });
        const failedBatches = await this.prisma.employeeUploadBatch.count({
            where: {
                companyId,
                status: 'FAILED',
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
        });
        if (failedBatches > 0) {
            alerts.push({
                type: 'error',
                title: `${failedBatches} failed invite deliveries`,
                message: 'Review email addresses and resend',
                severity: 'high',
            });
        }
        const recentBatch = await this.prisma.employeeUploadBatch.findFirst({
            where: {
                companyId,
                status: 'COMPLETED',
            },
            orderBy: { createdAt: 'desc' },
        });
        if (recentBatch &&
            recentBatch.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            alerts.push({
                type: 'success',
                title: 'Data sync completed',
                message: 'All metrics updated',
                severity: 'low',
            });
        }
        return alerts;
    }
    async getHrProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                hrProfile: true,
            },
        });
        if (!user || !user.hrProfile) {
            throw new common_1.BadRequestException('HR profile not found');
        }
        return {
            id: user.id,
            email: user.email,
            fullName: user.hrProfile.fullName,
            phone: user.hrProfile.phone,
            designation: user.hrProfile.designation,
            companyId: user.companyId,
        };
    }
    async updateHrProfile(userId, updateData) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { hrProfile: true },
        });
        if (!user || !user.hrProfile) {
            throw new common_1.BadRequestException('HR profile not found');
        }
        const updatedProfile = await this.prisma.hRProfile.update({
            where: { userId: userId },
            data: {
                ...(updateData.fullName && { fullName: updateData.fullName }),
                ...(updateData.phone !== undefined && { phone: updateData.phone }),
                ...(updateData.designation && { designation: updateData.designation }),
            },
        });
        return {
            message: 'Profile updated successfully',
            profile: {
                id: user.id,
                email: user.email,
                fullName: updatedProfile.fullName,
                phone: updatedProfile.phone,
                designation: updatedProfile.designation,
            },
        };
    }
};
exports.HrService = HrService;
exports.HrService = HrService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], HrService);
//# sourceMappingURL=hr.service.js.map