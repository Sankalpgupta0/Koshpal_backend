import { PrismaClient, Role, CompanyStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1️⃣ Company
  const company = await prisma.company.upsert({
    where: { domain: 'koshpal.com' },
    update: {},
    create: {
      name: 'Koshpal',
      domain: 'koshpal.com',
      employeeLimit: 1000,
      status: CompanyStatus.ACTIVE,
    },
  });

  // 2️⃣ Admin
  await prisma.user.upsert({
    where: { email: 'admin@koshpal.com' },
    update: {},
    create: {
      email: 'admin@koshpal.com',
      passwordHash,
      role: Role.ADMIN,
      companyId: company.id,
      isActive: true,
      adminProfile: {
        create: {
          fullName: 'Koshpal Admin',
        },
      },
    },
  });

  // 3️⃣ HR
  await prisma.user.upsert({
    where: { email: 'hr@koshpal.com' },
    update: {},
    create: {
      email: 'hr@koshpal.com',
      passwordHash,
      role: Role.HR,
      companyId: company.id,
      isActive: true,
      hrProfile: {
        create: {
          fullName: 'Koshpal HR',
          designation: 'HR Manager',
          companyId: company.id,
        },
      },
    },
  });

  // 4️⃣ Employees
  const employees = [
    {
      email: 'emp1@koshpal.com',
      name: 'Employee One',
      code: 'EMP001',
    },
    {
      email: 'emp2@koshpal.com',
      name: 'Employee Two',
      code: 'EMP002',
    },
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        passwordHash,
        role: Role.EMPLOYEE,
        companyId: company.id,
        isActive: true,
        employeeProfile: {
          create: {
            fullName: emp.name,
            employeeCode: emp.code,
            companyId: company.id,
          },
        },
      },
    });
  }

  // 5️⃣ Coaches with detailed profiles
  const coach1 = await prisma.user.upsert({
    where: { email: 'priya.sharma@koshpal.com' },
    update: {},
    create: {
      email: 'priya.sharma@koshpal.com',
      passwordHash,
      role: Role.COACH,
      isActive: true,
      coachProfile: {
        create: {
          fullName: 'Priya Sharma',
          expertise: ['Investment Planning', 'Retirement', 'Tax Planning'],
          bio: 'CA, CFP with 8+ years experience in financial planning and wealth management. Specialized in helping employees achieve their financial goals.',
          rating: new Decimal('4.8'),
          successRate: 92,
          clientsHelped: 12,
          location: 'Mumbai',
          languages: ['English', 'Hindi'],
          profilePhoto: '/coaches/priya-sharma.jpg',
        } as Prisma.CoachProfileCreateWithoutUserInput,
      },
    },
  });

  const coach2 = await prisma.user.upsert({
    where: { email: 'rahul.verma@koshpal.com' },
    update: {},
    create: {
      email: 'rahul.verma@koshpal.com',
      passwordHash,
      role: Role.COACH,
      isActive: true,
      coachProfile: {
        create: {
          fullName: 'Rahul Verma',
          expertise: ['Debt Management', 'Financial Planning', 'Investment Planning'],
          bio: 'MBA Finance with 10 years experience. Expert in debt restructuring and personal finance management for professionals.',
          rating: new Decimal('4.9'),
          successRate: 95,
          clientsHelped: 28,
          location: 'Bangalore',
          languages: ['English', 'Hindi', 'Kannada'],
          profilePhoto: '/coaches/rahul-verma.jpg',
        } as Prisma.CoachProfileCreateWithoutUserInput,
      },
    },
  });

  const coach3 = await prisma.user.upsert({
    where: { email: 'anjali.patel@koshpal.com' },
    update: {},
    create: {
      email: 'anjali.patel@koshpal.com',
      passwordHash,
      role: Role.COACH,
      isActive: true,
      coachProfile: {
        create: {
          fullName: 'Anjali Patel',
          expertise: ['Retirement Planning', 'Insurance', 'Tax Planning'],
          bio: 'Certified Financial Planner specializing in retirement and insurance planning. Helping employees secure their financial future.',
          rating: new Decimal('4.7'),
          successRate: 88,
          clientsHelped: 15,
          location: 'Delhi',
          languages: ['English', 'Hindi', 'Gujarati'],
          profilePhoto: '/coaches/anjali-patel.jpg',
        } as Prisma.CoachProfileCreateWithoutUserInput,
      },
    },
  });

  // 6️⃣ Create slots for next 7 days for each coach
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

  for (const coach of coaches) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + dayOffset);

      // Skip weekends
      if (slotDate.getDay() === 0 || slotDate.getDay() === 6) continue;

      for (const timeSlot of timeSlots) {
        const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
        const [endHour, endMinute] = timeSlot.end.split(':').map(Number);

        const startTime = new Date(slotDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(slotDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        await prisma.coachSlot.create({
          data: {
            coachId: coach.id,
            date: slotDate,
            startTime,
            endTime,
            status: 'AVAILABLE',
          },
        });
      }
    }
  }

  console.log('✅ Seed completed');
  console.log('👥 Created 3 coaches with slots for next 7 days');
  console.log('🔐 Test logins (password: password123)');
  console.log('ADMIN → admin@koshpal.com');
  console.log('HR → hr@koshpal.com');
  console.log('EMP → emp1@koshpal.com / emp2@koshpal.com');
  console.log('COACH → coach@koshpal.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
