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
const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Neha', 'Arjun', 'Kavya', 'Siddharth', 'Ishita', 'Karan', 'Diya', 'Aditya', 'Riya', 'Varun', 'Shreya', 'Nikhil', 'Pooja', 'Manish', 'Tanvi', 'Rajesh', 'Simran', 'Vivek'];
const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Desai', 'Shah', 'Mehta', 'Joshi', 'Nair', 'Iyer', 'Rao', 'Malhotra', 'Chopra', 'Bhatia', 'Agarwal', 'Kapoor', 'Banerjee'];
const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR', 'Operations', 'Product', 'Design', 'Customer Success', 'Legal'];
const cities = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
const categories = ['Food & Dining', 'Shopping', 'Transportation', 'Bills & Utilities', 'Healthcare', 'Entertainment', 'Education', 'Personal Care'];
const subCategories = {
    'Food & Dining': ['Restaurants', 'Groceries', 'Cafe', 'Food Delivery'],
    'Shopping': ['Clothing', 'Electronics', 'Books', 'Home & Garden'],
    'Transportation': ['Uber', 'Petrol', 'Metro', 'Parking'],
    'Bills & Utilities': ['Electricity', 'Water', 'Internet', 'Phone'],
    'Healthcare': ['Medical', 'Pharmacy', 'Insurance', 'Dental'],
    'Entertainment': ['Movies', 'Concerts', 'Subscriptions', 'Gaming'],
    'Education': ['Courses', 'Books', 'Tuition', 'Certifications'],
    'Personal Care': ['Gym', 'Salon', 'Spa', 'Cosmetics']
};
async function main() {
    console.log('🌱 Seeding database with comprehensive test data...\n');
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('📦 Creating 3 companies...');
    const companies = await Promise.all([
        prisma.company.create({
            data: {
                name: 'TechCorp Solutions',
                domain: 'techcorp.com',
                employeeLimit: 500,
                status: client_1.CompanyStatus.ACTIVE,
            },
        }),
        prisma.company.create({
            data: {
                name: 'FinServe India',
                domain: 'finserve.in',
                employeeLimit: 200,
                status: client_1.CompanyStatus.ACTIVE,
            },
        }),
        prisma.company.create({
            data: {
                name: 'StartupHub Ventures',
                domain: 'startuphub.io',
                employeeLimit: 150,
                status: client_1.CompanyStatus.ACTIVE,
            },
        }),
    ]);
    console.log(`✅ Created ${companies.length} companies\n`);
    console.log('👤 Creating admin users...');
    const admin = await prisma.user.create({
        data: {
            email: 'admin@koshpal.com',
            passwordHash,
            role: client_1.Role.ADMIN,
            isActive: true,
            lastLoginAt: new Date(),
            adminProfile: {
                create: {
                    fullName: 'Super Admin',
                },
            },
        },
    });
    console.log(`✅ Created 1 admin user\n`);
    console.log('🎓 Creating 3 coaches...');
    const coaches = await Promise.all([
        prisma.user.create({
            data: {
                email: 'priya.sharma@koshpal.com',
                passwordHash,
                role: client_1.Role.COACH,
                isActive: true,
                lastLoginAt: new Date(),
                coachProfile: {
                    create: {
                        fullName: 'Priya Sharma',
                        expertise: ['Investment Planning', 'Retirement', 'Tax Planning'],
                        bio: 'CA, CFP with 8+ years in financial planning. Specialized in helping employees achieve financial goals.',
                        rating: new library_1.Decimal('4.8'),
                        successRate: 92,
                        clientsHelped: 147,
                        location: 'Mumbai',
                        languages: ['English', 'Hindi', 'Marathi'],
                        profilePhoto: '/coaches/priya-sharma.jpg',
                    },
                },
            },
        }),
        prisma.user.create({
            data: {
                email: 'rahul.verma@koshpal.com',
                passwordHash,
                role: client_1.Role.COACH,
                isActive: true,
                lastLoginAt: new Date(),
                coachProfile: {
                    create: {
                        fullName: 'Rahul Verma',
                        expertise: ['Debt Management', 'Financial Planning', 'Investment Planning'],
                        bio: 'MBA Finance with 10 years experience. Expert in debt restructuring and personal finance.',
                        rating: new library_1.Decimal('4.9'),
                        successRate: 95,
                        clientsHelped: 289,
                        location: 'Bangalore',
                        languages: ['English', 'Hindi', 'Kannada'],
                        profilePhoto: '/coaches/rahul-verma.jpg',
                    },
                },
            },
        }),
        prisma.user.create({
            data: {
                email: 'anjali.patel@koshpal.com',
                passwordHash,
                role: client_1.Role.COACH,
                isActive: true,
                lastLoginAt: new Date(),
                coachProfile: {
                    create: {
                        fullName: 'Anjali Patel',
                        expertise: ['Retirement Planning', 'Insurance', 'Tax Planning'],
                        bio: 'Certified Financial Planner specializing in retirement and insurance planning.',
                        rating: new library_1.Decimal('4.7'),
                        successRate: 88,
                        clientsHelped: 215,
                        location: 'Delhi',
                        languages: ['English', 'Hindi', 'Gujarati'],
                        profilePhoto: '/coaches/anjali-patel.jpg',
                    },
                },
            },
        }),
    ]);
    console.log(`✅ Created ${coaches.length} coaches\n`);
    console.log('📅 Creating coach availability slots...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeSlots = [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
    ];
    const allSlots = [];
    for (const coach of coaches) {
        const numSessions = randomInt(5, 10);
        for (let i = 0; i < numSessions; i++) {
            const dayOffset = randomInt(0, 14);
            const slotDate = new Date(today);
            slotDate.setDate(today.getDate() + dayOffset);
            if (slotDate.getDay() === 0 || slotDate.getDay() === 6)
                continue;
            const timeSlot = randomElement(timeSlots);
            const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
            const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
            const startTime = new Date(slotDate);
            startTime.setHours(startHour, startMinute, 0, 0);
            const endTime = new Date(slotDate);
            endTime.setHours(endHour, endMinute, 0, 0);
            const slot = await prisma.coachSlot.create({
                data: {
                    coachId: coach.id,
                    date: slotDate,
                    startTime,
                    endTime,
                    status: client_1.SlotStatus.AVAILABLE,
                },
            });
            allSlots.push({ ...slot, coachId: coach.id });
        }
    }
    console.log(`✅ Created ${allSlots.length} coach slots\n`);
    console.log('👥 Creating HR users and employees for each company...\n');
    let totalHRs = 0;
    let totalEmployees = 0;
    const allEmployees = [];
    for (const company of companies) {
        const numHRs = randomInt(1, 5);
        const numEmployees = randomInt(10, 15);
        console.log(`   📌 ${company.name}:`);
        console.log(`      - Creating ${numHRs} HR users...`);
        const hrs = [];
        for (let i = 0; i < numHRs; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const email = `hr${i + 1}@${company.domain}`;
            const hr = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    role: client_1.Role.HR,
                    companyId: company.id,
                    isActive: true,
                    lastLoginAt: new Date(),
                    hrProfile: {
                        create: {
                            fullName: `${firstName} ${lastName}`,
                            designation: randomElement(['HR Manager', 'Senior HR', 'HR Lead', 'HRBP', 'Talent Manager']),
                            phone: `+91-${randomInt(7000000000, 9999999999)}`,
                            companyId: company.id,
                        },
                    },
                },
            });
            hrs.push(hr);
            totalHRs++;
        }
        console.log(`      - Creating ${numEmployees} employees...`);
        for (let i = 0; i < numEmployees; i++) {
            const firstName = randomElement(firstNames);
            const lastName = randomElement(lastNames);
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${company.domain}`;
            const department = randomElement(departments);
            const joiningDate = new Date();
            joiningDate.setMonth(joiningDate.getMonth() - randomInt(1, 36));
            const employee = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    role: client_1.Role.EMPLOYEE,
                    companyId: company.id,
                    isActive: randomInt(0, 100) > 5,
                    lastLoginAt: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000),
                    employeeProfile: {
                        create: {
                            fullName: `${firstName} ${lastName}`,
                            employeeCode: `${(company.domain || 'EMP').split('.')[0].toUpperCase().slice(0, 2)}${String(i + 1).padStart(3, '0')}`,
                            phone: `+91-${randomInt(7000000000, 9999999999)}`,
                            department,
                            dateOfJoining: joiningDate,
                            companyId: company.id,
                        },
                    },
                },
            });
            allEmployees.push({ user: employee, company });
            totalEmployees++;
        }
        console.log(`      ✅ Created ${numHRs} HRs and ${numEmployees} employees\n`);
    }
    console.log(`✅ Total: ${totalHRs} HR users and ${totalEmployees} employees\n`);
    console.log('🏦 Creating accounts and transactions for employees...\n');
    let totalAccounts = 0;
    let totalTransactions = 0;
    let totalGoals = 0;
    let totalSummaries = 0;
    const accountProviders = {
        BANK: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra'],
        WALLET: ['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay'],
        CREDIT_CARD: ['HDFC Regalia', 'ICICI Platinum', 'SBI Elite', 'Axis Magnus'],
        CASH: ['Cash']
    };
    for (const { user: employee, company } of allEmployees) {
        const numAccounts = randomInt(0, 3);
        const employeeAccounts = [];
        if (numAccounts > 0) {
            const bankAccount = await prisma.account.create({
                data: {
                    userId: employee.id,
                    companyId: company.id,
                    type: client_1.AccountType.BANK,
                    provider: randomElement(accountProviders.BANK),
                    maskedAccountNo: `XXXX-XXXX-${randomInt(1000, 9999)}`,
                    employeeProfileUserId: employee.id,
                },
            });
            employeeAccounts.push(bankAccount);
            totalAccounts++;
            for (let i = 1; i < numAccounts; i++) {
                const accountTypes = [client_1.AccountType.WALLET, client_1.AccountType.CREDIT_CARD, client_1.AccountType.CASH];
                const accountType = randomElement(accountTypes);
                const account = await prisma.account.create({
                    data: {
                        userId: employee.id,
                        companyId: company.id,
                        type: accountType,
                        provider: randomElement(accountProviders[accountType]),
                        maskedAccountNo: accountType === client_1.AccountType.CASH ? null : `XXXX-${randomInt(1000, 9999)}`,
                        employeeProfileUserId: employee.id,
                    },
                });
                employeeAccounts.push(account);
                totalAccounts++;
            }
            const numTransactions = randomInt(10, 30);
            const transactions = [];
            const salaryAmount = randomDecimal(50000, 150000);
            transactions.push({
                userId: employee.id,
                companyId: company.id,
                accountId: employeeAccounts[0].id,
                amount: salaryAmount,
                type: client_1.TransactionType.INCOME,
                category: 'Salary',
                subCategory: 'Monthly Salary',
                source: client_1.TransactionSource.BANK,
                description: 'Monthly Salary',
                transactionDate: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
            });
            for (let i = 1; i < numTransactions; i++) {
                const isIncome = randomInt(0, 100) < 15;
                const category = isIncome ? 'Other Income' : randomElement(categories);
                const subCategory = isIncome ?
                    randomElement(['Freelance', 'Bonus', 'Refund', 'Gift']) :
                    randomElement(subCategories[category]);
                transactions.push({
                    userId: employee.id,
                    companyId: company.id,
                    accountId: randomElement(employeeAccounts).id,
                    amount: isIncome ? randomDecimal(1000, 20000) : randomDecimal(100, 15000),
                    type: isIncome ? client_1.TransactionType.INCOME : client_1.TransactionType.EXPENSE,
                    category,
                    subCategory,
                    source: randomElement([client_1.TransactionSource.BANK, client_1.TransactionSource.MOBILE, client_1.TransactionSource.MANUAL]),
                    description: `${subCategory} transaction`,
                    transactionDate: new Date(Date.now() - randomInt(0, 90) * 24 * 60 * 60 * 1000),
                });
            }
            for (const txn of transactions) {
                await prisma.transaction.create({ data: txn });
                totalTransactions++;
            }
            const totalIncome = transactions
                .filter(t => t.type === client_1.TransactionType.INCOME)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const totalExpense = transactions
                .filter(t => t.type === client_1.TransactionType.EXPENSE)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const savings = totalIncome - totalExpense;
            const budget = randomDecimal(30000, 80000);
            const expenseBreakdown = {};
            transactions
                .filter(t => t.type === client_1.TransactionType.EXPENSE)
                .forEach(t => {
                expenseBreakdown[t.category] = (expenseBreakdown[t.category] || 0) + Number(t.amount);
            });
            await prisma.monthlySummary.create({
                data: {
                    userId: employee.id,
                    companyId: company.id,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                    totalIncome: new library_1.Decimal(totalIncome),
                    totalExpense: new library_1.Decimal(totalExpense),
                    savings: new library_1.Decimal(savings),
                    budget,
                    categoryBreakdown: {
                        income: { Salary: Number(salaryAmount) },
                        expense: expenseBreakdown,
                    },
                },
            });
            totalSummaries++;
            const numGoals = randomInt(1, 3);
            const goalIcons = ['🏠', '🚗', '✈️', '💍', '🎓', '💻', '🏍️', '🏥'];
            const goalNames = [
                'Emergency Fund',
                'Car Purchase',
                'Home Down Payment',
                'Vacation',
                'Wedding Fund',
                'Child Education',
                'Laptop Purchase',
                'Medical Insurance'
            ];
            for (let i = 0; i < numGoals; i++) {
                const goalAmount = randomDecimal(50000, 2000000);
                const saving = randomDecimal(Number(goalAmount) * 0.1, Number(goalAmount) * 0.8);
                const goalDate = new Date();
                goalDate.setMonth(goalDate.getMonth() + randomInt(6, 36));
                await prisma.financialGoal.create({
                    data: {
                        userId: employee.id,
                        goalName: randomElement(goalNames),
                        icon: randomElement(goalIcons),
                        goalAmount,
                        saving,
                        goalDate,
                    },
                });
                totalGoals++;
            }
        }
    }
    console.log(`✅ Created ${totalAccounts} accounts`);
    console.log(`✅ Created ${totalTransactions} transactions`);
    console.log(`✅ Created ${totalSummaries} monthly summaries`);
    console.log(`✅ Created ${totalGoals} financial goals\n`);
    console.log('📞 Creating consultation bookings...\n');
    let totalBookings = 0;
    const availableSlots = allSlots.filter(s => s.status === client_1.SlotStatus.AVAILABLE);
    for (const coach of coaches) {
        const coachSlots = availableSlots.filter(s => s.coachId === coach.id);
        const numBookings = Math.min(randomInt(1, 10), coachSlots.length);
        for (let i = 0; i < numBookings; i++) {
            const slot = coachSlots[i];
            const employee = randomElement(allEmployees);
            await prisma.consultationBooking.create({
                data: {
                    slotId: slot.id,
                    coachId: coach.id,
                    employeeId: employee.user.id,
                    meetingLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`,
                    status: client_1.BookingStatus.CONFIRMED,
                },
            });
            await prisma.coachSlot.update({
                where: { id: slot.id },
                data: { status: client_1.SlotStatus.BOOKED },
            });
            totalBookings++;
        }
    }
    console.log(`✅ Created ${totalBookings} consultation bookings\n`);
    console.log('🔔 Creating notifications...');
    const notificationTemplates = [
        { title: 'Consultation Booked', message: 'Your consultation is confirmed', isRead: false },
        { title: 'Goal Achievement', message: 'You are making great progress on your goal!', isRead: false },
        { title: 'Budget Alert', message: 'You have spent 75% of your monthly budget', isRead: true },
        { title: 'New Financial Tip', message: 'Check out our latest guide on tax saving', isRead: false },
        { title: 'Monthly Summary Ready', message: 'Your monthly financial summary is available', isRead: true },
    ];
    let totalNotifications = 0;
    for (const { user: employee } of allEmployees.slice(0, 20)) {
        const numNotifs = randomInt(2, 5);
        for (let i = 0; i < numNotifs; i++) {
            const template = randomElement(notificationTemplates);
            await prisma.notification.create({
                data: {
                    userId: employee.id,
                    ...template,
                    createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
                },
            });
            totalNotifications++;
        }
    }
    console.log(`✅ Created ${totalNotifications} notifications\n`);
    console.log('📤 Creating employee upload batches...');
    let totalBatches = 0;
    for (const company of companies) {
        const numBatches = randomInt(2, 4);
        for (let i = 0; i < numBatches; i++) {
            const totalRecords = randomInt(10, 100);
            const successRecords = randomInt(Math.floor(totalRecords * 0.8), totalRecords);
            const failedRecords = totalRecords - successRecords;
            const hrUser = await prisma.user.findFirst({
                where: { companyId: company.id, role: client_1.Role.HR }
            });
            if (hrUser) {
                await prisma.employeeUploadBatch.create({
                    data: {
                        fileName: `employees_${new Date().toISOString().split('T')[0]}_${i + 1}.xlsx`,
                        totalRecords,
                        successRecords,
                        failedRecords,
                        status: failedRecords > totalRecords * 0.3 ? client_1.UploadStatus.FAILED : client_1.UploadStatus.COMPLETED,
                        companyId: company.id,
                        hrUserId: hrUser.id,
                        createdAt: new Date(Date.now() - randomInt(0, 60) * 24 * 60 * 60 * 1000),
                        updatedAt: new Date(),
                    },
                });
                totalBatches++;
            }
        }
    }
    console.log(`✅ Created ${totalBatches} upload batches\n`);
    console.log('\n🎉 ========================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('📋 Summary:');
    console.log(`   • ${companies.length} Companies`);
    console.log('   • 1 Admin');
    console.log(`   • ${totalHRs} HR users (1-5 per company)`);
    console.log(`   • ${totalEmployees} Employees (10-15 per company)`);
    console.log(`   • ${coaches.length} Coaches`);
    console.log(`   • ${allSlots.length} Coach slots`);
    console.log(`   • ${totalBookings} Consultation bookings (1-10 per coach)`);
    console.log(`   • ${totalAccounts} Financial accounts (0-3 per employee)`);
    console.log(`   • ${totalTransactions} Transactions (10+ per employee)`);
    console.log(`   • ${totalSummaries} Monthly summaries`);
    console.log(`   • ${totalGoals} Financial goals`);
    console.log(`   • ${totalNotifications} Notifications`);
    console.log(`   • ${totalBatches} Upload batches\n`);
    console.log('🔐 Sample Login Credentials (password: password123):');
    console.log('   ┌─────────────────────────────────────────┐');
    console.log('   │ ADMIN  → admin@koshpal.com              │');
    console.log('   │ HR     → hr1@techcorp.com               │');
    console.log('   │ HR     → hr1@finserve.in                │');
    console.log('   │ HR     → hr1@startuphub.io              │');
    console.log('   │ COACH  → priya.sharma@koshpal.com       │');
    console.log('   │ COACH  → rahul.verma@koshpal.com        │');
    console.log('   │ COACH  → anjali.patel@koshpal.com       │');
    console.log('   │ EMP    → Check database for emails      │');
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
//# sourceMappingURL=seed.backup.js.map