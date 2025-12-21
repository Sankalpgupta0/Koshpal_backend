import {
  PrismaClient,
  Role,
  CompanyStatus,
  AccountType,
  TransactionType,
  TransactionSource,
  SlotStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Koshpal test data...\n');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ========================================
  // 1️⃣ COMPANY
  // ========================================
  console.log('📦 Creating company...');
  
  const company = await prisma.company.create({
    data: {
      name: 'Koshpal Inc',
      domain: 'koshpal.com',
      employeeLimit: 1000,
      status: CompanyStatus.ACTIVE,
    },
  });

  console.log(`✅ Created company: ${company.name}\n`);

  // ========================================
  // 2️⃣ ADMIN USER
  // ========================================
  console.log('👤 Creating admin user...');
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@koshpal.com',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
      adminProfile: {
        create: {
          fullName: 'Koshpal Admin',
        },
      },
    },
  });

  console.log(`✅ Created admin: ${admin.email}\n`);

  // ========================================
  // 3️⃣ COACH USER
  // ========================================
  console.log('🎓 Creating coach user...');
  
  const coach = await prisma.user.create({
    data: {
      email: 'koshpal@koshpal.com',
      passwordHash,
      role: Role.COACH,
      isActive: true,
      lastLoginAt: new Date(),
      coachProfile: {
        create: {
          fullName: 'Koshpal Coach',
          expertise: ['Financial Planning', 'Investment Planning', 'Debt Management', 'Tax Planning', 'Retirement Planning'],
          bio: 'Expert financial coach with 10+ years experience in helping employees achieve their financial goals. Specialized in personalized financial planning and wealth management.',
          rating: new Decimal('4.9'),
          successRate: 95,
          clientsHelped: 250,
          location: 'Mumbai',
          languages: ['English', 'Hindi'],
          profilePhoto: '/coaches/koshpal-coach.jpg',
        },
      },
    },
  });

  console.log(`✅ Created coach: ${coach.email}\n`);

  // ========================================
  // 4️⃣ COACH AVAILABILITY SLOTS
  // ========================================
  console.log('📅 Creating coach availability slots...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const timeSlots = [
    { start: 9, end: 10 },
    { start: 10, end: 11 },
    { start: 11, end: 12 },
    { start: 14, end: 15 },
    { start: 15, end: 16 },
    { start: 16, end: 17 },
  ];

  const slots: any[] = [];
  
  // Create slots for next 14 days
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + dayOffset);
    
    for (const timeSlot of timeSlots) {
      const startTime = new Date(slotDate);
      startTime.setHours(timeSlot.start, 0, 0, 0);
      
      const endTime = new Date(slotDate);
      endTime.setHours(timeSlot.end, 0, 0, 0);
      
      const slot = await prisma.coachSlot.create({
        data: {
          coachId: coach.id,
          date: slotDate,
          startTime,
          endTime,
          status: SlotStatus.AVAILABLE,
        },
      });
      
      slots.push(slot);
    }
  }

  console.log(`✅ Created ${slots.length} coach slots\n`);

  // ========================================
  // 5️⃣ EMPLOYEE USER
  // ========================================
  console.log('👥 Creating employee user...');
  
  const employee = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'guptasankalp2004@gmail.com',
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
      lastLoginAt: new Date(),
      employeeProfile: {
        create: {
          companyId: company.id,
          employeeCode: 'EMP001',
          fullName: 'Sankalp Gupta',
          phone: '+91-9876543210',
          department: 'Engineering',
          dateOfJoining: new Date('2023-01-15'),
        },
      },
    },
  });

  console.log(`✅ Created employee: ${employee.email}\n`);

  // ========================================
  // 6️⃣ EMPLOYEE ACCOUNTS
  // ========================================
  console.log('💳 Creating employee accounts...');
  
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        userId: employee.id,
        employeeUserId: employee.id,
        companyId: company.id,
        type: AccountType.BANK,
        provider: 'HDFC Bank',
        maskedAccountNo: '****5432',
        bank: 'HDFC',
      },
    }),
    prisma.account.create({
      data: {
        userId: employee.id,
        employeeUserId: employee.id,
        companyId: company.id,
        type: AccountType.WALLET,
        provider: 'Paytm',
        maskedAccountNo: '****8901',
        bank: 'Paytm Payments Bank',
      },
    }),
    prisma.account.create({
      data: {
        userId: employee.id,
        employeeUserId: employee.id,
        companyId: company.id,
        type: AccountType.CREDIT_CARD,
        provider: 'ICICI Bank',
        maskedAccountNo: '****1111',
        bank: 'ICICI',
      },
    }),
    prisma.account.create({
      data: {
        userId: employee.id,
        employeeUserId: employee.id,
        companyId: company.id,
        type: AccountType.CASH,
        provider: 'Cash',
        maskedAccountNo: 'N/A',
        bank: 'N/A',
      },
    }),
  ]);

  console.log(`✅ Created ${accounts.length} accounts\n`);

  // ========================================
  // 7️⃣ TRANSACTIONS
  // ========================================
  console.log('💸 Creating transactions...');
  
  const transactions: any[] = [];
  const now = new Date();
  
  // Income transactions
  const incomeTransactions = [
    { date: -30, amount: 120000, description: 'Salary - December 2025', category: 'Salary', account: accounts[0] },
    { date: -60, amount: 120000, description: 'Salary - November 2025', category: 'Salary', account: accounts[0] },
    { date: -15, amount: 5000, description: 'Freelance Project Payment', category: 'Freelance', account: accounts[0] },
  ];
  
  for (const txn of incomeTransactions) {
    const txnDate = new Date(now);
    txnDate.setDate(now.getDate() + txn.date);
    
    const transaction = await prisma.transaction.create({
      data: {
        userId: employee.id,
        companyId: company.id,
        accountId: txn.account.id,
        amount: new Decimal(txn.amount),
        type: TransactionType.INCOME,
        category: txn.category,
        subCategory: 'Income',
        description: txn.description,
        transactionDate: txnDate,
        source: TransactionSource.MANUAL,
        bank: txn.account.bank,
        maskedAccountNo: txn.account.maskedAccountNo,
      },
    });
    transactions.push(transaction);
  }
  
  // Expense transactions
  const expenseTransactions = [
    { date: -2, amount: 1200, description: 'Zomato Food Order', category: 'Food & Dining', subCategory: 'Food Delivery', account: accounts[1] },
    { date: -3, amount: 500, description: 'Metro Card Recharge', category: 'Transportation', subCategory: 'Metro', account: accounts[1] },
    { date: -5, amount: 3500, description: 'Big Bazaar Groceries', category: 'Shopping', subCategory: 'Groceries', account: accounts[0] },
    { date: -7, amount: 850, description: 'Electricity Bill', category: 'Bills & Utilities', subCategory: 'Electricity', account: accounts[0] },
    { date: -8, amount: 1500, description: 'Netflix & Spotify', category: 'Entertainment', subCategory: 'Subscriptions', account: accounts[2] },
    { date: -10, amount: 2400, description: 'Nike Shoes', category: 'Shopping', subCategory: 'Clothing', account: accounts[2] },
    { date: -12, amount: 600, description: 'Starbucks Coffee', category: 'Food & Dining', subCategory: 'Cafe', account: accounts[3] },
    { date: -14, amount: 800, description: 'Medical Consultation', category: 'Healthcare', subCategory: 'Medical', account: accounts[0] },
    { date: -18, amount: 4500, description: 'Gym Membership - Annual', category: 'Personal Care', subCategory: 'Gym', account: accounts[2] },
    { date: -20, amount: 2200, description: 'Amazon Shopping', category: 'Shopping', subCategory: 'Electronics', account: accounts[2] },
    { date: -22, amount: 1800, description: 'Restaurant Dinner', category: 'Food & Dining', subCategory: 'Restaurants', account: accounts[0] },
    { date: -25, amount: 750, description: 'Uber Rides', category: 'Transportation', subCategory: 'Uber', account: accounts[1] },
    { date: -28, amount: 1100, description: 'Internet Bill', category: 'Bills & Utilities', subCategory: 'Internet', account: accounts[0] },
  ];
  
  for (const txn of expenseTransactions) {
    const txnDate = new Date(now);
    txnDate.setDate(now.getDate() + txn.date);
    
    const transaction = await prisma.transaction.create({
      data: {
        userId: employee.id,
        companyId: company.id,
        accountId: txn.account.id,
        amount: new Decimal(txn.amount),
        type: TransactionType.EXPENSE,
        category: txn.category,
        subCategory: txn.subCategory,
        description: txn.description,
        transactionDate: txnDate,
        source: TransactionSource.MANUAL,
        bank: txn.account.bank,
        maskedAccountNo: txn.account.maskedAccountNo,
      },
    });
    transactions.push(transaction);
  }

  console.log(`✅ Created ${transactions.length} transactions\n`);

  // ========================================
  // 8️⃣ FINANCIAL GOALS
  // ========================================
  console.log('🎯 Creating financial goals...');
  
  const targetDate1 = new Date();
  targetDate1.setFullYear(targetDate1.getFullYear() + 1);
  
  const targetDate2 = new Date();
  targetDate2.setFullYear(targetDate2.getFullYear() + 3);
  
  const targetDate3 = new Date();
  targetDate3.setFullYear(targetDate3.getFullYear() + 5);
  
  const goals = await Promise.all([
    prisma.financialGoal.create({
      data: {
        userId: employee.id,
        goalName: 'Emergency Fund',
        icon: '🏦',
        goalAmount: new Decimal('360000'),
        saving: new Decimal('85000'),
        goalDate: targetDate1,
      },
    }),
    prisma.financialGoal.create({
      data: {
        userId: employee.id,
        goalName: 'New Car Purchase',
        icon: '🚗',
        goalAmount: new Decimal('800000'),
        saving: new Decimal('150000'),
        goalDate: targetDate2,
      },
    }),
    prisma.financialGoal.create({
      data: {
        userId: employee.id,
        goalName: 'Home Down Payment',
        icon: '🏠',
        goalAmount: new Decimal('2000000'),
        saving: new Decimal('200000'),
        goalDate: targetDate3,
      },
    }),
  ]);

  console.log(`✅ Created ${goals.length} financial goals\n`);

  // ========================================
  // 9️⃣ MONTHLY SUMMARIES
  // ========================================
  console.log('📊 Creating monthly summaries...');
  
  const dec2025Start = new Date(2025, 11, 1); // December 1, 2025
  const dec2025End = new Date(2025, 11, 31, 23, 59, 59); // December 31, 2025
  const nov2025Start = new Date(2025, 10, 1); // November 1, 2025
  const nov2025End = new Date(2025, 10, 30, 23, 59, 59); // November 30, 2025
  
  const monthlySummaries = await Promise.all([
    prisma.monthlySummary.create({
      data: {
        userId: employee.id,
        companyId: company.id,
        month: 12,
        year: 2025,
        periodStart: dec2025Start,
        periodEnd: dec2025End,
        totalIncome: new Decimal('125000'),
        totalExpense: new Decimal('22700'),
        savings: new Decimal('102300'),
        budget: new Decimal('50000'),
        categoryBreakdown: {
          'Food & Dining': 3600,
          'Transportation': 1250,
          'Shopping': 5900,
          'Bills & Utilities': 1950,
          'Entertainment': 1500,
          'Healthcare': 800,
          'Personal Care': 4500,
        },
      },
    }),
    prisma.monthlySummary.create({
      data: {
        userId: employee.id,
        companyId: company.id,
        month: 11,
        year: 2025,
        periodStart: nov2025Start,
        periodEnd: nov2025End,
        totalIncome: new Decimal('120000'),
        totalExpense: new Decimal('45000'),
        savings: new Decimal('75000'),
        budget: new Decimal('50000'),
        categoryBreakdown: {
          'Food & Dining': 12000,
          'Transportation': 5000,
          'Shopping': 15000,
          'Bills & Utilities': 8000,
          'Entertainment': 3000,
          'Healthcare': 2000,
        },
      },
    }),
  ]);

  console.log(`✅ Created ${monthlySummaries.length} monthly summaries\n`);

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n✅ ===============================');
  console.log('🎉 Database seeded successfully!');
  console.log('===============================\n');
  
  console.log('📝 Login Credentials:');
  console.log('👤 Admin:');
  console.log('   Email: admin@koshpal.com');
  console.log('   Password: password123');
  console.log('');
  console.log('🎓 Coach:');
  console.log('   Email: koshpal@koshpal.com');
  console.log('   Password: password123');
  console.log('');
  console.log('👥 Employee:');
  console.log('   Email: guptasankalp2004@gmail.com');
  console.log('   Password: password123');
  console.log('');
  console.log('📊 Seeded Data:');
  console.log(`   • 1 Company`);
  console.log(`   • 3 Users (1 Admin, 1 Coach, 1 Employee)`);
  console.log(`   • ${slots.length} Coach Slots`);
  console.log(`   • ${accounts.length} Accounts`);
  console.log(`   • ${transactions.length} Transactions`);
  console.log(`   • ${goals.length} Financial Goals`);
  console.log(`   • ${monthlySummaries.length} Monthly Summaries`);
  console.log('\n===============================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
