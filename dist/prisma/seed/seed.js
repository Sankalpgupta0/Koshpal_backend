"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient();
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}
function getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
}
function getDateWithTime(date, hours, minutes = 0) {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
}
async function main() {
    console.log('🌱 Seeding database with Koshpal production-like test data...\n');
    try {
        await prisma.$transaction(async (tx) => {
            console.log('📦 Creating/updating company...');
            const company = await tx.company.upsert({
                where: { domain: 'abc.com' },
                update: {
                    name: 'ABC Technologies Pvt Ltd',
                    employeeLimit: 1000,
                    status: client_1.CompanyStatus.ACTIVE,
                },
                create: {
                    name: 'ABC Technologies Pvt Ltd',
                    domain: 'abc.com',
                    employeeLimit: 1000,
                    status: client_1.CompanyStatus.ACTIVE,
                },
            });
            console.log(`✅ Company ready: ${company.name} (${company.domain})\n`);
            console.log('👥 Creating/updating users...');
            const adminPasswordHash = await hashPassword('password123');
            const admin = await tx.user.upsert({
                where: { email: 'admin@koshpal.com' },
                update: {
                    passwordHash: adminPasswordHash,
                    role: client_1.Role.ADMIN,
                    isActive: true,
                    companyId: company.id,
                },
                create: {
                    email: 'admin@koshpal.com',
                    passwordHash: adminPasswordHash,
                    role: client_1.Role.ADMIN,
                    isActive: true,
                    companyId: company.id,
                },
            });
            const hrPasswordHash = await hashPassword('password123');
            const hr = await tx.user.upsert({
                where: { email: 'hr@abc.com' },
                update: {
                    passwordHash: hrPasswordHash,
                    role: client_1.Role.HR,
                    isActive: true,
                    companyId: company.id,
                },
                create: {
                    email: 'hr@abc.com',
                    passwordHash: hrPasswordHash,
                    role: client_1.Role.HR,
                    isActive: true,
                    companyId: company.id,
                },
            });
            const coachPasswordHash = await hashPassword('password123');
            const coach = await tx.user.upsert({
                where: { email: 'coach@koshpal.com' },
                update: {
                    passwordHash: coachPasswordHash,
                    role: client_1.Role.COACH,
                    isActive: true,
                },
                create: {
                    email: 'coach@koshpal.com',
                    passwordHash: coachPasswordHash,
                    role: client_1.Role.COACH,
                    isActive: true,
                },
            });
            const employeePasswordHash = await hashPassword('password123');
            const employee = await tx.user.upsert({
                where: { email: 'employee@abc.com' },
                update: {
                    passwordHash: employeePasswordHash,
                    role: client_1.Role.EMPLOYEE,
                    isActive: true,
                    companyId: company.id,
                },
                create: {
                    email: 'employee@abc.com',
                    passwordHash: employeePasswordHash,
                    role: client_1.Role.EMPLOYEE,
                    isActive: true,
                    companyId: company.id,
                },
            });
            console.log(`✅ Users created:`);
            console.log(`   - Admin: ${admin.email}`);
            console.log(`   - HR: ${hr.email}`);
            console.log(`   - Coach: ${coach.email}`);
            console.log(`   - Employee: ${employee.email}\n`);
            console.log('📋 Creating/updating profiles...');
            await tx.adminProfile.upsert({
                where: { userId: admin.id },
                update: { fullName: 'System Administrator' },
                create: {
                    userId: admin.id,
                    fullName: 'System Administrator',
                },
            });
            await tx.hRProfile.upsert({
                where: { userId: hr.id },
                update: {
                    companyId: company.id,
                    fullName: 'HR Manager',
                    phone: '+91-9876543210',
                    designation: 'Human Resources Manager',
                },
                create: {
                    userId: hr.id,
                    companyId: company.id,
                    fullName: 'HR Manager',
                    phone: '+91-9876543210',
                    designation: 'Human Resources Manager',
                },
            });
            await tx.employeeProfile.upsert({
                where: { userId: employee.id },
                update: {
                    companyId: company.id,
                    employeeCode: 'EMP001',
                    fullName: 'John Smith',
                    phone: '+91-9876543211',
                    department: 'Engineering',
                    dateOfJoining: new Date('2024-01-15'),
                },
                create: {
                    userId: employee.id,
                    companyId: company.id,
                    employeeCode: 'EMP001',
                    fullName: 'John Smith',
                    phone: '+91-9876543211',
                    department: 'Engineering',
                    dateOfJoining: new Date('2024-01-15'),
                },
            });
            await tx.coachProfile.upsert({
                where: { userId: coach.id },
                update: {
                    fullName: 'Sarah Johnson',
                    expertise: ['Personal Finance', 'Investment Planning', 'Debt Management'],
                    bio: 'Certified financial coach with 5+ years of experience helping professionals achieve financial freedom.',
                    rating: new library_1.Decimal('4.8'),
                    successRate: 95,
                    clientsHelped: 150,
                    location: 'Mumbai, India',
                    languages: ['English', 'Hindi'],
                    timezone: 'Asia/Kolkata',
                },
                create: {
                    userId: coach.id,
                    fullName: 'Sarah Johnson',
                    expertise: ['Personal Finance', 'Investment Planning', 'Debt Management'],
                    bio: 'Certified financial coach with 5+ years of experience helping professionals achieve financial freedom.',
                    rating: new library_1.Decimal('4.8'),
                    successRate: 95,
                    clientsHelped: 150,
                    location: 'Mumbai, India',
                    languages: ['English', 'Hindi'],
                    timezone: 'Asia/Kolkata',
                },
            });
            console.log(`✅ Profiles created for all users\n`);
            console.log('🏦 Creating employee bank accounts...');
            const savingsAccount = await tx.account.upsert({
                where: {
                    unique_user_account: {
                        userId: employee.id,
                        maskedAccountNo: 'XXXX4321',
                        provider: 'HDFC',
                    },
                },
                update: {
                    companyId: company.id,
                    type: client_1.AccountType.BANK,
                    bank: 'HDFC Bank',
                    employeeUserId: employee.id,
                },
                create: {
                    userId: employee.id,
                    companyId: company.id,
                    type: client_1.AccountType.BANK,
                    provider: 'HDFC',
                    bank: 'HDFC Bank',
                    maskedAccountNo: 'XXXX4321',
                    employeeUserId: employee.id,
                },
            });
            const creditAccount = await tx.account.upsert({
                where: {
                    unique_user_account: {
                        userId: employee.id,
                        maskedAccountNo: 'XXXX8765',
                        provider: 'HDFC',
                    },
                },
                update: {
                    companyId: company.id,
                    type: client_1.AccountType.CREDIT_CARD,
                    bank: 'HDFC Bank',
                    employeeUserId: employee.id,
                },
                create: {
                    userId: employee.id,
                    companyId: company.id,
                    type: client_1.AccountType.CREDIT_CARD,
                    provider: 'HDFC',
                    bank: 'HDFC Bank',
                    maskedAccountNo: 'XXXX8765',
                    employeeUserId: employee.id,
                },
            });
            console.log(`✅ Accounts created:`);
            console.log(`   - Savings: ${savingsAccount.maskedAccountNo} (${savingsAccount.bank})`);
            console.log(`   - Credit: ${creditAccount.maskedAccountNo} (${creditAccount.bank})\n`);
            console.log('💰 Creating transactions...');
            const transactions = [
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: savingsAccount.id,
                    amount: new library_1.Decimal('75000.00'),
                    type: client_1.TransactionType.INCOME,
                    category: 'Salary',
                    subCategory: 'Monthly Salary',
                    source: client_1.TransactionSource.BANK,
                    description: 'Monthly salary credit',
                    transactionDate: new Date('2024-12-01'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: savingsAccount.id,
                    amount: new library_1.Decimal('-2500.00'),
                    type: client_1.TransactionType.EXPENSE,
                    category: 'Shopping',
                    subCategory: 'Online Shopping',
                    source: client_1.TransactionSource.BANK,
                    description: 'Amazon purchase',
                    transactionDate: new Date('2024-12-05'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: savingsAccount.id,
                    amount: new library_1.Decimal('-1200.00'),
                    type: client_1.TransactionType.EXPENSE,
                    category: 'Food',
                    subCategory: 'Restaurant',
                    source: client_1.TransactionSource.BANK,
                    description: 'Dinner at restaurant',
                    transactionDate: new Date('2024-12-10'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: savingsAccount.id,
                    amount: new library_1.Decimal('-3500.00'),
                    type: client_1.TransactionType.EXPENSE,
                    category: 'Utilities',
                    subCategory: 'Electricity Bill',
                    source: client_1.TransactionSource.BANK,
                    description: 'Monthly electricity bill',
                    transactionDate: new Date('2024-12-15'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: savingsAccount.id,
                    amount: new library_1.Decimal('5000.00'),
                    type: client_1.TransactionType.INCOME,
                    category: 'Salary',
                    subCategory: 'Bonus',
                    source: client_1.TransactionSource.BANK,
                    description: 'Performance bonus',
                    transactionDate: new Date('2024-12-20'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: creditAccount.id,
                    amount: new library_1.Decimal('-8500.00'),
                    type: client_1.TransactionType.EXPENSE,
                    category: 'Shopping',
                    subCategory: 'Electronics',
                    source: client_1.TransactionSource.BANK,
                    description: 'Laptop purchase',
                    transactionDate: new Date('2024-12-03'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: creditAccount.id,
                    amount: new library_1.Decimal('-3200.00'),
                    type: client_1.TransactionType.EXPENSE,
                    category: 'Food',
                    subCategory: 'Grocery',
                    source: client_1.TransactionSource.BANK,
                    description: 'Monthly grocery shopping',
                    transactionDate: new Date('2024-12-08'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: creditAccount.id,
                    amount: new library_1.Decimal('-1800.00'),
                    type: client_1.TransactionType.EXPENSE,
                    category: 'Utilities',
                    subCategory: 'Internet Bill',
                    source: client_1.TransactionSource.BANK,
                    description: 'Monthly internet bill',
                    transactionDate: new Date('2024-12-12'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: creditAccount.id,
                    amount: new library_1.Decimal('-4500.00'),
                    type: client_1.TransactionType.EXPENSE,
                    category: 'Shopping',
                    subCategory: 'Clothing',
                    source: client_1.TransactionSource.BANK,
                    description: 'Winter clothing',
                    transactionDate: new Date('2024-12-18'),
                },
                {
                    userId: employee.id,
                    companyId: company.id,
                    accountId: creditAccount.id,
                    amount: new library_1.Decimal('8500.00'),
                    type: client_1.TransactionType.INCOME,
                    category: 'Salary',
                    subCategory: 'Reimbursement',
                    source: client_1.TransactionSource.BANK,
                    description: 'Laptop reimbursement',
                    transactionDate: new Date('2024-12-25'),
                },
            ];
            for (const transaction of transactions) {
                await tx.transaction.upsert({
                    where: {
                        id: `${transaction.userId}-${transaction.accountId}-${transaction.transactionDate.toISOString()}-${transaction.amount}`,
                    },
                    update: transaction,
                    create: {
                        ...transaction,
                        id: `${transaction.userId}-${transaction.accountId}-${transaction.transactionDate.toISOString()}-${transaction.amount}`,
                    },
                });
            }
            console.log(`✅ Created ${transactions.length} transactions across 2 accounts\n`);
            console.log('📅 Creating coach availability slots...');
            const slotsData = [];
            const today = new Date();
            for (let day = 1; day <= 5; day++) {
                const slotDate = getFutureDate(day);
                for (let hour = 9; hour < 17; hour++) {
                    const startTime = getDateWithTime(slotDate, hour);
                    const endTime = getDateWithTime(slotDate, hour + 1);
                    slotsData.push({
                        coachId: coach.id,
                        date: slotDate,
                        startTime: startTime,
                        endTime: endTime,
                        status: client_1.SlotStatus.AVAILABLE,
                    });
                }
            }
            await tx.coachSlot.createMany({
                data: slotsData,
                skipDuplicates: true,
            });
            const slots = await tx.coachSlot.findMany({
                where: { coachId: coach.id },
            });
            console.log(`✅ Created ${slots.length} availability slots for coach\n`);
            console.log('📋 Creating consultation booking...');
            const bookingSlot = slots.find(slot => slot.status === client_1.SlotStatus.AVAILABLE);
            if (bookingSlot) {
                await tx.coachSlot.update({
                    where: { id: bookingSlot.id },
                    data: { status: client_1.SlotStatus.BOOKED },
                });
                await tx.consultationBooking.upsert({
                    where: { slotId: bookingSlot.id },
                    update: {
                        coachId: coach.id,
                        employeeId: employee.id,
                        meetingLink: 'https://meet.google.com/abc-defg-hij',
                        notes: 'Initial financial consultation session',
                        status: client_1.BookingStatus.CONFIRMED,
                    },
                    create: {
                        slotId: bookingSlot.id,
                        coachId: coach.id,
                        employeeId: employee.id,
                        meetingLink: 'https://meet.google.com/abc-defg-hij',
                        notes: 'Initial financial consultation session',
                        status: client_1.BookingStatus.CONFIRMED,
                    },
                });
                console.log(`✅ Created consultation booking:`);
                console.log(`   - Coach: ${coach.email}`);
                console.log(`   - Employee: ${employee.email}`);
                console.log(`   - Date: ${bookingSlot.startTime.toLocaleDateString()}`);
                console.log(`   - Time: ${bookingSlot.startTime.toLocaleTimeString()} - ${bookingSlot.endTime.toLocaleTimeString()}`);
                console.log(`   - Meeting: https://meet.google.com/abc-defg-hij\n`);
            }
            console.log('🎉 Database seeding completed successfully!');
            console.log('\n📊 Summary:');
            console.log(`   • Company: ${company.name}`);
            console.log(`   • Users: 4 (Admin, HR, Coach, Employee)`);
            console.log(`   • Accounts: 2 (Savings + Credit)`);
            console.log(`   • Transactions: ${transactions.length}`);
            console.log(`   • Coach Slots: ${slots.length}`);
            console.log(`   • Bookings: 1`);
            console.log('\n🔐 Login Credentials:');
            console.log(`   Admin: admin@koshpal.com / password123`);
            console.log(`   HR: hr@abc.com / password123`);
            console.log(`   Coach: coach@koshpal.com / password123`);
            console.log(`   Employee: employee@abc.com / password123`);
        }, {
            timeout: 60000,
        });
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map