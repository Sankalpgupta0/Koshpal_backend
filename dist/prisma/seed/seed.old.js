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
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min, max) => new library_1.Decimal((Math.random() * (max - min) + min).toFixed(2));
const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Neha', 'Arjun', 'Kavya', 'Siddharth', 'Ishita', 'Karan', 'Diya', 'Aditya', 'Riya', 'Varun', 'Shreya', 'Nikhil', 'Pooja'];
const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Desai', 'Shah', 'Mehta', 'Joshi', 'Nair', 'Iyer', 'Rao', 'Malhotra', 'Chopra', 'Bhatia', 'Agarwal', 'Kapoor', 'Banerjee'];
const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Product', 'Design', 'Customer Success', 'Legal'];
const cities = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
async function main() {
    console.log('🌱 Seeding database with comprehensive data...\n');
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('📦 Creating companies...');
    const company1 = await prisma.company.create({
        data: {
            name: 'TechCorp Solutions',
            domain: 'techcorp.com',
            employeeLimit: 500,
            status: client_1.CompanyStatus.ACTIVE,
        },
    });
    const company2 = await prisma.company.create({
        data: {
            name: 'FinServe India',
            domain: 'finserve.in',
            employeeLimit: 200,
            status: client_1.CompanyStatus.ACTIVE,
        },
    });
    const company3 = await prisma.company.create({
        data: {
            name: 'StartupHub',
            domain: 'startuphub.com',
            employeeLimit: 50,
            status: client_1.CompanyStatus.INACTIVE,
        },
    });
    console.log(`✅ Created 3 companies\n`);
    console.log('👤 Creating admin users...');
    const admin1 = await prisma.user.create({
        data: {
            email: 'admin@koshpal.com',
            passwordHash,
            role: client_1.Role.ADMIN,
            companyId: company1.id,
            isActive: true,
            lastLoginAt: new Date('2024-12-15T09:30:00Z'),
            adminProfile: {
                create: {
                    fullName: 'Sankalp Gupta',
                },
            },
        },
    });
    const admin2 = await prisma.user.create({
        data: {
            email: 'superadmin@koshpal.com',
            passwordHash,
            role: client_1.Role.ADMIN,
            isActive: true,
            lastLoginAt: new Date('2024-12-17T14:20:00Z'),
            adminProfile: {
                create: {
                    fullName: 'Super Admin',
                },
            },
        },
    });
    console.log(`✅ Created 2 admin users\n`);
    console.log('👥 Creating HR users...');
    const hr1 = await prisma.user.create({
        data: {
            email: 'hr@techcorp.com',
            passwordHash,
            role: client_1.Role.HR,
            companyId: company1.id,
            isActive: true,
            lastLoginAt: new Date('2024-12-18T08:15:00Z'),
            hrProfile: {
                create: {
                    fullName: 'Priya Mehta',
                    designation: 'Senior HR Manager',
                    companyId: company1.id,
                },
            },
        },
    });
    const hr2 = await prisma.user.create({
        data: {
            email: 'hr@finserve.in',
            passwordHash,
            role: client_1.Role.HR,
            companyId: company2.id,
            isActive: true,
            lastLoginAt: new Date('2024-12-16T10:45:00Z'),
            hrProfile: {
                create: {
                    fullName: 'Rajesh Kumar',
                    designation: 'HR Head',
                    companyId: company2.id,
                },
            },
        },
    });
    console.log(`✅ Created 2 HR users\n`);
    console.log('💼 Creating employee users...');
    const emp1 = await prisma.user.create({
        data: {
            email: 'john.doe@techcorp.com',
            passwordHash,
            role: client_1.Role.EMPLOYEE,
            companyId: company1.id,
            isActive: true,
            lastLoginAt: new Date('2024-12-18T09:00:00Z'),
            employeeProfile: {
                create: {
                    fullName: 'John Doe',
                    employeeCode: 'TC001',
                    phone: '+91-9876543210',
                    dateOfJoining: new Date('2023-01-15'),
                    companyId: company1.id,
                },
            },
        },
    });
    const emp2 = await prisma.user.create({
        data: {
            email: 'sarah.smith@techcorp.com',
            passwordHash,
            role: client_1.Role.EMPLOYEE,
            companyId: company1.id,
            isActive: true,
            lastLoginAt: new Date('2024-12-17T16:30:00Z'),
            employeeProfile: {
                create: {
                    fullName: 'Sarah Smith',
                    employeeCode: 'TC002',
                    phone: '+91-9876543211',
                    dateOfJoining: new Date('2023-03-20'),
                    companyId: company1.id,
                },
            },
        },
    });
    const emp3 = await prisma.user.create({
        data: {
            email: 'amit.patel@finserve.in',
            passwordHash,
            role: client_1.Role.EMPLOYEE,
            companyId: company2.id,
            isActive: true,
            lastLoginAt: new Date('2024-12-18T08:45:00Z'),
            employeeProfile: {
                create: {
                    fullName: 'Amit Patel',
                    employeeCode: 'FS001',
                    phone: '+91-9876543212',
                    dateOfJoining: new Date('2022-06-10'),
                    companyId: company2.id,
                },
            },
        },
    });
    const emp4 = await prisma.user.create({
        data: {
            email: 'neha.verma@finserve.in',
            passwordHash,
            role: client_1.Role.EMPLOYEE,
            companyId: company2.id,
            isActive: true,
            lastLoginAt: new Date('2024-12-15T11:20:00Z'),
            employeeProfile: {
                create: {
                    fullName: 'Neha Verma',
                    employeeCode: 'FS002',
                    phone: '+91-9876543213',
                    dateOfJoining: new Date('2023-09-01'),
                    companyId: company2.id,
                },
            },
        },
    });
    const emp5 = await prisma.user.create({
        data: {
            email: 'inactive@techcorp.com',
            passwordHash,
            role: client_1.Role.EMPLOYEE,
            companyId: company1.id,
            isActive: false,
            employeeProfile: {
                create: {
                    fullName: 'Inactive Employee',
                    employeeCode: 'TC999',
                    companyId: company1.id,
                },
            },
        },
    });
    console.log(`✅ Created 5 employees (4 active, 1 inactive)\n`);
    console.log('🎓 Creating coach users...');
    const coach1 = await prisma.user.create({
        data: {
            email: 'priya.sharma@koshpal.com',
            passwordHash,
            role: client_1.Role.COACH,
            isActive: true,
            lastLoginAt: new Date('2024-12-18T07:30:00Z'),
            coachProfile: {
                create: {
                    fullName: 'Priya Sharma',
                    expertise: ['Investment Planning', 'Retirement', 'Tax Planning'],
                    bio: 'CA, CFP with 8+ years experience in financial planning and wealth management. Specialized in helping employees achieve their financial goals.',
                    rating: new library_1.Decimal('4.8'),
                    successRate: 92,
                    clientsHelped: 147,
                    location: 'Mumbai',
                    languages: ['English', 'Hindi', 'Marathi'],
                    profilePhoto: '/coaches/priya-sharma.jpg',
                },
            },
        },
    });
    const coach2 = await prisma.user.create({
        data: {
            email: 'rahul.verma@koshpal.com',
            passwordHash,
            role: client_1.Role.COACH,
            isActive: true,
            lastLoginAt: new Date('2024-12-17T18:00:00Z'),
            coachProfile: {
                create: {
                    fullName: 'Rahul Verma',
                    expertise: [
                        'Debt Management',
                        'Financial Planning',
                        'Investment Planning',
                    ],
                    bio: 'MBA Finance with 10 years experience. Expert in debt restructuring and personal finance management for professionals.',
                    rating: new library_1.Decimal('4.9'),
                    successRate: 95,
                    clientsHelped: 289,
                    location: 'Bangalore',
                    languages: ['English', 'Hindi', 'Kannada'],
                    profilePhoto: '/coaches/rahul-verma.jpg',
                },
            },
        },
    });
    const coach3 = await prisma.user.create({
        data: {
            email: 'anjali.patel@koshpal.com',
            passwordHash,
            role: client_1.Role.COACH,
            isActive: true,
            lastLoginAt: new Date('2024-12-18T06:45:00Z'),
            coachProfile: {
                create: {
                    fullName: 'Anjali Patel',
                    expertise: ['Retirement Planning', 'Insurance', 'Tax Planning'],
                    bio: 'Certified Financial Planner specializing in retirement and insurance planning. Helping employees secure their financial future.',
                    rating: new library_1.Decimal('4.7'),
                    successRate: 88,
                    clientsHelped: 215,
                    location: 'Delhi',
                    languages: ['English', 'Hindi', 'Gujarati'],
                    profilePhoto: '/coaches/anjali-patel.jpg',
                },
            },
        },
    });
    console.log(`✅ Created 3 coaches\n`);
    console.log('📅 Creating coach availability slots...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const coaches = [coach1, coach2, coach3];
    const timeSlots = [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
    ];
    let slotsCreated = 0;
    const allSlots = [];
    for (const coach of coaches) {
        for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
            const slotDate = new Date(today);
            slotDate.setDate(today.getDate() + dayOffset);
            if (slotDate.getDay() === 0 || slotDate.getDay() === 6)
                continue;
            for (const timeSlot of timeSlots) {
                const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
                const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
                const startTime = new Date(slotDate);
                startTime.setHours(startHour, startMinute, 0, 0);
                const endTime = new Date(slotDate);
                endTime.setHours(endHour, endMinute, 0, 0);
                const shouldBlock = Math.random() < 0.1;
                const slot = await prisma.coachSlot.create({
                    data: {
                        coachId: coach.id,
                        date: slotDate,
                        startTime,
                        endTime,
                        status: shouldBlock ? client_1.SlotStatus.BLOCKED : client_1.SlotStatus.AVAILABLE,
                    },
                });
                allSlots.push(slot);
                slotsCreated++;
            }
        }
    }
    console.log(`✅ Created ${slotsCreated} coach slots\n`);
    console.log('📞 Creating consultation bookings...');
    const availableSlots = allSlots.filter((s) => s.status === client_1.SlotStatus.AVAILABLE);
    const employees = [emp1, emp2, emp3, emp4];
    let bookingsCreated = 0;
    for (let i = 0; i < Math.min(8, availableSlots.length); i++) {
        const slot = availableSlots[i];
        const employee = employees[i % employees.length];
        await prisma.consultationBooking.create({
            data: {
                slotId: slot.id,
                coachId: slot.coachId,
                employeeId: employee.id,
                meetingLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`,
                status: client_1.BookingStatus.CONFIRMED,
            },
        });
        await prisma.coachSlot.update({
            where: { id: slot.id },
            data: { status: client_1.SlotStatus.BOOKED },
        });
        bookingsCreated++;
    }
    console.log(`✅ Created ${bookingsCreated} bookings\n`);
    console.log('🏦 Creating financial accounts...');
    const johnBank = await prisma.account.create({
        data: {
            userId: emp1.id,
            companyId: company1.id,
            type: client_1.AccountType.BANK,
            provider: 'HDFC Bank',
            maskedAccountNo: 'XXXX-XXXX-3456',
            employeeProfileUserId: emp1.id,
        },
    });
    const johnWallet = await prisma.account.create({
        data: {
            userId: emp1.id,
            companyId: company1.id,
            type: client_1.AccountType.WALLET,
            provider: 'Paytm',
            maskedAccountNo: '9876543210',
            employeeProfileUserId: emp1.id,
        },
    });
    const johnCard = await prisma.account.create({
        data: {
            userId: emp1.id,
            companyId: company1.id,
            type: client_1.AccountType.CREDIT_CARD,
            provider: 'HDFC Regalia',
            maskedAccountNo: 'XXXX-XXXX-7890',
            employeeProfileUserId: emp1.id,
        },
    });
    const sarahBank = await prisma.account.create({
        data: {
            userId: emp2.id,
            companyId: company1.id,
            type: client_1.AccountType.BANK,
            provider: 'ICICI Bank',
            maskedAccountNo: 'XXXX-XXXX-1234',
            employeeProfileUserId: emp2.id,
        },
    });
    const sarahCash = await prisma.account.create({
        data: {
            userId: emp2.id,
            companyId: company1.id,
            type: client_1.AccountType.CASH,
            provider: 'Cash',
            maskedAccountNo: null,
            employeeProfileUserId: emp2.id,
        },
    });
    const amitBank = await prisma.account.create({
        data: {
            userId: emp3.id,
            companyId: company2.id,
            type: client_1.AccountType.BANK,
            provider: 'SBI',
            maskedAccountNo: 'XXXX-XXXX-5678',
            employeeProfileUserId: emp3.id,
        },
    });
    console.log(`✅ Created 6 financial accounts\n`);
    console.log('💰 Creating transactions...');
    const transactionsData = [
        { userId: emp1.id, companyId: company1.id, accountId: johnBank.id, amount: new library_1.Decimal('85000'), type: client_1.TransactionType.INCOME, category: 'Salary', subCategory: 'Monthly Salary', source: client_1.TransactionSource.BANK, description: 'December Salary', transactionDate: new Date('2024-12-01') },
        { userId: emp1.id, companyId: company1.id, accountId: johnBank.id, amount: new library_1.Decimal('1200'), type: client_1.TransactionType.EXPENSE, category: 'Food & Dining', subCategory: 'Restaurants', source: client_1.TransactionSource.BANK, description: 'Dinner at Italian restaurant', transactionDate: new Date('2024-12-05') },
        { userId: emp1.id, companyId: company1.id, accountId: johnCard.id, amount: new library_1.Decimal('5499'), type: client_1.TransactionType.EXPENSE, category: 'Shopping', subCategory: 'Electronics', source: client_1.TransactionSource.MOBILE, description: 'Wireless mouse', transactionDate: new Date('2024-12-07') },
        { userId: emp1.id, companyId: company1.id, accountId: johnBank.id, amount: new library_1.Decimal('15000'), type: client_1.TransactionType.EXPENSE, category: 'Housing', subCategory: 'Rent', source: client_1.TransactionSource.BANK, description: 'Monthly rent', transactionDate: new Date('2024-12-10') },
        { userId: emp1.id, companyId: company1.id, accountId: johnWallet.id, amount: new library_1.Decimal('250'), type: client_1.TransactionType.EXPENSE, category: 'Transportation', subCategory: 'Uber', source: client_1.TransactionSource.MOBILE, description: 'Office commute', transactionDate: new Date('2024-12-12') },
        { userId: emp1.id, companyId: company1.id, accountId: johnBank.id, amount: new library_1.Decimal('3500'), type: client_1.TransactionType.EXPENSE, category: 'Bills & Utilities', subCategory: 'Electricity', source: client_1.TransactionSource.BANK, description: 'Power bill', transactionDate: new Date('2024-12-14') },
        { userId: emp1.id, companyId: company1.id, accountId: johnBank.id, amount: new library_1.Decimal('2000'), type: client_1.TransactionType.INCOME, category: 'Other Income', subCategory: 'Freelance', source: client_1.TransactionSource.BANK, description: 'Freelance project payment', transactionDate: new Date('2024-12-16') },
        { userId: emp1.id, companyId: company1.id, accountId: johnBank.id, amount: new library_1.Decimal('85000'), type: client_1.TransactionType.INCOME, category: 'Salary', subCategory: 'Monthly Salary', source: client_1.TransactionSource.BANK, description: 'November Salary', transactionDate: new Date('2024-11-01') },
        { userId: emp1.id, companyId: company1.id, accountId: johnBank.id, amount: new library_1.Decimal('15000'), type: client_1.TransactionType.EXPENSE, category: 'Housing', subCategory: 'Rent', source: client_1.TransactionSource.BANK, description: 'Monthly rent', transactionDate: new Date('2024-11-10') },
        { userId: emp1.id, companyId: company1.id, accountId: johnCard.id, amount: new library_1.Decimal('8500'), type: client_1.TransactionType.EXPENSE, category: 'Shopping', subCategory: 'Clothing', source: client_1.TransactionSource.MOBILE, description: 'Winter clothes', transactionDate: new Date('2024-11-15') },
        { userId: emp2.id, companyId: company1.id, accountId: sarahBank.id, amount: new library_1.Decimal('95000'), type: client_1.TransactionType.INCOME, category: 'Salary', subCategory: 'Monthly Salary', source: client_1.TransactionSource.BANK, description: 'December Salary', transactionDate: new Date('2024-12-01') },
        { userId: emp2.id, companyId: company1.id, accountId: sarahBank.id, amount: new library_1.Decimal('18000'), type: client_1.TransactionType.EXPENSE, category: 'Housing', subCategory: 'Rent', source: client_1.TransactionSource.BANK, description: 'Monthly rent', transactionDate: new Date('2024-12-05') },
        { userId: emp2.id, companyId: company1.id, accountId: sarahCash.id, amount: new library_1.Decimal('500'), type: client_1.TransactionType.EXPENSE, category: 'Food & Dining', subCategory: 'Groceries', source: client_1.TransactionSource.MANUAL, description: 'Weekly groceries', transactionDate: new Date('2024-12-08') },
        { userId: emp2.id, companyId: company1.id, accountId: sarahBank.id, amount: new library_1.Decimal('12000'), type: client_1.TransactionType.EXPENSE, category: 'Healthcare', subCategory: 'Medical', source: client_1.TransactionSource.BANK, description: 'Health insurance premium', transactionDate: new Date('2024-12-12') },
        { userId: emp3.id, companyId: company2.id, accountId: amitBank.id, amount: new library_1.Decimal('75000'), type: client_1.TransactionType.INCOME, category: 'Salary', subCategory: 'Monthly Salary', source: client_1.TransactionSource.BANK, description: 'December Salary', transactionDate: new Date('2024-12-01') },
        { userId: emp3.id, companyId: company2.id, accountId: amitBank.id, amount: new library_1.Decimal('12000'), type: client_1.TransactionType.EXPENSE, category: 'Housing', subCategory: 'Rent', source: client_1.TransactionSource.BANK, description: 'Monthly rent', transactionDate: new Date('2024-12-08') },
        { userId: emp3.id, companyId: company2.id, accountId: amitBank.id, amount: new library_1.Decimal('4500'), type: client_1.TransactionType.EXPENSE, category: 'Transportation', subCategory: 'Fuel', source: client_1.TransactionSource.BANK, description: 'Petrol expense', transactionDate: new Date('2024-12-10') },
        { userId: emp3.id, companyId: company2.id, accountId: amitBank.id, amount: new library_1.Decimal('3000'), type: client_1.TransactionType.EXPENSE, category: 'Entertainment', subCategory: 'Movies', source: client_1.TransactionSource.BANK, description: 'Movie tickets', transactionDate: new Date('2024-12-15') },
    ];
    for (const txn of transactionsData) {
        await prisma.transaction.create({ data: txn });
    }
    console.log(`✅ Created ${transactionsData.length} transactions\n`);
    console.log('📊 Creating monthly summaries...');
    await prisma.monthlySummary.create({
        data: {
            userId: emp1.id,
            companyId: company1.id,
            month: 12,
            year: 2024,
            periodStart: new Date('2024-12-01'),
            periodEnd: new Date('2024-12-31'),
            totalIncome: new library_1.Decimal('87000'),
            totalExpense: new library_1.Decimal('27449'),
            savings: new library_1.Decimal('59551'),
            budget: new library_1.Decimal('40000'),
            categoryBreakdown: {
                income: { Salary: 85000, 'Other Income': 2000 },
                expense: {
                    'Food & Dining': 1200,
                    Shopping: 5499,
                    Housing: 15000,
                    Transportation: 250,
                    'Bills & Utilities': 3500,
                },
            },
        },
    });
    await prisma.monthlySummary.create({
        data: {
            userId: emp1.id,
            companyId: company1.id,
            month: 11,
            year: 2024,
            periodStart: new Date('2024-11-01'),
            periodEnd: new Date('2024-11-30'),
            totalIncome: new library_1.Decimal('85000'),
            totalExpense: new library_1.Decimal('23500'),
            savings: new library_1.Decimal('61500'),
            budget: new library_1.Decimal('40000'),
            categoryBreakdown: {
                income: { Salary: 85000 },
                expense: { Housing: 15000, Shopping: 8500 },
            },
        },
    });
    await prisma.monthlySummary.create({
        data: {
            userId: emp2.id,
            companyId: company1.id,
            month: 12,
            year: 2024,
            periodStart: new Date('2024-12-01'),
            periodEnd: new Date('2024-12-31'),
            totalIncome: new library_1.Decimal('95000'),
            totalExpense: new library_1.Decimal('30500'),
            savings: new library_1.Decimal('64500'),
            budget: new library_1.Decimal('45000'),
            categoryBreakdown: {
                income: { Salary: 95000 },
                expense: {
                    Housing: 18000,
                    'Food & Dining': 500,
                    Healthcare: 12000,
                },
            },
        },
    });
    await prisma.monthlySummary.create({
        data: {
            userId: emp3.id,
            companyId: company2.id,
            month: 12,
            year: 2024,
            periodStart: new Date('2024-12-01'),
            periodEnd: new Date('2024-12-31'),
            totalIncome: new library_1.Decimal('75000'),
            totalExpense: new library_1.Decimal('19500'),
            savings: new library_1.Decimal('55500'),
            budget: new library_1.Decimal('35000'),
            categoryBreakdown: {
                income: { Salary: 75000 },
                expense: {
                    Housing: 12000,
                    Transportation: 4500,
                    Entertainment: 3000,
                },
            },
        },
    });
    console.log(`✅ Created 4 monthly summaries\n`);
    console.log('🎯 Creating financial goals...');
    const goalsData = [
        { userId: emp1.id, goalName: 'Emergency Fund', icon: '🏥', goalAmount: new library_1.Decimal('200000'), saving: new library_1.Decimal('125000'), goalDate: new Date('2025-06-30') },
        { userId: emp1.id, goalName: 'Car Purchase', icon: '🚗', goalAmount: new library_1.Decimal('800000'), saving: new library_1.Decimal('350000'), goalDate: new Date('2026-03-31') },
        { userId: emp1.id, goalName: 'Vacation to Europe', icon: '✈️', goalAmount: new library_1.Decimal('300000'), saving: new library_1.Decimal('95000'), goalDate: new Date('2025-12-01') },
        { userId: emp2.id, goalName: 'Home Down Payment', icon: '🏠', goalAmount: new library_1.Decimal('1500000'), saving: new library_1.Decimal('600000'), goalDate: new Date('2026-12-31') },
        { userId: emp2.id, goalName: 'Wedding Fund', icon: '💍', goalAmount: new library_1.Decimal('500000'), saving: new library_1.Decimal('200000'), goalDate: new Date('2025-11-01') },
        { userId: emp3.id, goalName: 'Child Education', icon: '🎓', goalAmount: new library_1.Decimal('2000000'), saving: new library_1.Decimal('450000'), goalDate: new Date('2030-06-01') },
        { userId: emp3.id, goalName: 'Bike Upgrade', icon: '🏍️', goalAmount: new library_1.Decimal('150000'), saving: new library_1.Decimal('80000'), goalDate: new Date('2025-08-15') },
        { userId: emp4.id, goalName: 'Laptop Purchase', icon: '💻', goalAmount: new library_1.Decimal('120000'), saving: new library_1.Decimal('90000'), goalDate: new Date('2025-03-31') },
    ];
    for (const goal of goalsData) {
        await prisma.financialGoal.create({ data: goal });
    }
    console.log(`✅ Created ${goalsData.length} financial goals\n`);
    console.log('📤 Creating employee upload batches...');
    await prisma.employeeUploadBatch.create({
        data: {
            fileName: 'employees_dec_2024.xlsx',
            totalRecords: 50,
            successRecords: 48,
            failedRecords: 2,
            status: client_1.UploadStatus.COMPLETED,
            companyId: company1.id,
            hrUserId: hr1.id,
            createdAt: new Date('2024-12-10T10:30:00Z'),
            updatedAt: new Date('2024-12-10T10:35:00Z'),
        },
    });
    await prisma.employeeUploadBatch.create({
        data: {
            fileName: 'new_joiners_nov_2024.xlsx',
            totalRecords: 25,
            successRecords: 25,
            failedRecords: 0,
            status: client_1.UploadStatus.COMPLETED,
            companyId: company1.id,
            hrUserId: hr1.id,
            createdAt: new Date('2024-11-15T14:20:00Z'),
            updatedAt: new Date('2024-11-15T14:22:00Z'),
        },
    });
    await prisma.employeeUploadBatch.create({
        data: {
            fileName: 'employees_test.xlsx',
            totalRecords: 10,
            successRecords: 0,
            failedRecords: 10,
            status: client_1.UploadStatus.FAILED,
            companyId: company2.id,
            hrUserId: hr2.id,
            createdAt: new Date('2024-12-05T09:15:00Z'),
            updatedAt: new Date('2024-12-05T09:16:00Z'),
        },
    });
    await prisma.employeeUploadBatch.create({
        data: {
            fileName: 'processing_batch.xlsx',
            totalRecords: 100,
            successRecords: 75,
            failedRecords: 0,
            status: client_1.UploadStatus.PROCESSING,
            companyId: company2.id,
            hrUserId: hr2.id,
            createdAt: new Date('2024-12-18T08:00:00Z'),
            updatedAt: new Date('2024-12-18T08:10:00Z'),
        },
    });
    console.log(`✅ Created 4 upload batches\n`);
    console.log('🔔 Creating notifications...');
    const notificationsData = [
        { userId: emp1.id, title: 'Consultation Booked', message: 'Your consultation with Priya Sharma is confirmed for Dec 20, 2024', isRead: false, createdAt: new Date('2024-12-18T09:30:00Z') },
        { userId: emp1.id, title: 'Goal Achievement', message: 'You are 62.5% towards your Emergency Fund goal!', isRead: true, createdAt: new Date('2024-12-15T10:00:00Z') },
        { userId: emp1.id, title: 'Budget Alert', message: 'You have spent 68% of your December budget', isRead: true, createdAt: new Date('2024-12-14T08:30:00Z') },
        { userId: emp2.id, title: 'New Financial Tip', message: 'Check out our latest guide on tax saving investments', isRead: false, createdAt: new Date('2024-12-17T11:00:00Z') },
        { userId: emp2.id, title: 'Profile Updated', message: 'Your financial profile has been successfully updated', isRead: true, createdAt: new Date('2024-12-10T14:20:00Z') },
        { userId: emp3.id, title: 'Upcoming Consultation', message: 'Your session with Rahul Verma is in 2 days', isRead: false, createdAt: new Date('2024-12-18T07:00:00Z') },
        { userId: emp3.id, title: 'Monthly Summary Ready', message: 'Your November financial summary is now available', isRead: true, createdAt: new Date('2024-12-01T09:00:00Z') },
        { userId: coach1.id, title: 'New Booking Request', message: 'John Doe has booked a slot with you', isRead: false, createdAt: new Date('2024-12-18T09:30:00Z') },
        { userId: coach2.id, title: 'Session Reminder', message: 'You have 3 consultations scheduled for tomorrow', isRead: true, createdAt: new Date('2024-12-17T18:00:00Z') },
    ];
    for (const notif of notificationsData) {
        await prisma.notification.create({ data: notif });
    }
    console.log(`✅ Created ${notificationsData.length} notifications\n`);
    console.log('🔐 Creating refresh tokens (active sessions)...');
    console.log('⚠️  RefreshToken table migration not applied - skipping for now\n');
    console.log('\n🎉 ========================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('📋 Summary:');
    console.log('   • 3 Companies (2 active, 1 inactive)');
    console.log('   • 2 Admins');
    console.log('   • 2 HR users');
    console.log('   • 5 Employees (4 active, 1 inactive)');
    console.log('   • 3 Coaches with profiles');
    console.log(`   • ${slotsCreated} Coach availability slots`);
    console.log(`   • ${bookingsCreated} Consultation bookings`);
    console.log('   • 6 Financial accounts');
    console.log(`   • ${transactionsData.length} Transactions`);
    console.log('   • 4 Monthly summaries');
    console.log(`   • ${goalsData.length} Financial goals`);
    console.log('   • 4 Upload batches');
    console.log(`   • ${notificationsData.length} Notifications`);
    console.log('   • 0 Refresh tokens (migration pending)\n');
    console.log('🔐 Test Login Credentials (password: password123):');
    console.log('   ┌─────────────────────────────────────────┐');
    console.log('   │ ADMIN  → admin@koshpal.com              │');
    console.log('   │ ADMIN  → superadmin@koshpal.com         │');
    console.log('   │ HR     → hr@techcorp.com                │');
    console.log('   │ HR     → hr@finserve.in                 │');
    console.log('   │ EMP    → john.doe@techcorp.com          │');
    console.log('   │ EMP    → sarah.smith@techcorp.com       │');
    console.log('   │ EMP    → amit.patel@finserve.in         │');
    console.log('   │ EMP    → neha.verma@finserve.in         │');
    console.log('   │ COACH  → priya.sharma@koshpal.com       │');
    console.log('   │ COACH  → rahul.verma@koshpal.com        │');
    console.log('   │ COACH  → anjali.patel@koshpal.com       │');
    console.log('   └─────────────────────────────────────────┘\n');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.old.js.map